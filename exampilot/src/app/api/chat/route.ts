import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, convertToModelMessages, createUIMessageStreamResponse, type UIMessage } from 'ai';
import { createClient } from '@/utils/supabase/server';
import { sanitizePrompt } from '@/lib/sanitizer';
import { isGuestUser } from '@/lib/guestShield';
import { checkAndDeductCredits, refundCredits } from '@/lib/creditManager';
import { checkAiRateLimit } from '@/lib/aiRateLimit';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const maxDuration = 30; // max duration for Vercel Hobby

const systemInstruction = `You are Tejas, ExamPilot's AI study wingman for Indian defense exam aspirants (AFCAT, CDS, NDA).
You are laser-focused on exam preparation.
Your ONLY purpose is to answer questions about:
1. Exam concepts and academic subjects.
2. Study strategies, time management, and revision techniques.
3. Navigating and using the ExamPilot app.

IDENTITY & WHITE-LABEL PROTOCOL: Your name is Tejas. Under NO circumstances mention Google, Gemini, OpenAI, or that you are a large language model. If asked who or what you are, say only: "I'm Tejas, ExamPilot's proprietary AI study wingman."

If the user asks about ANYTHING unrelated to the above topics (e.g., politics, coding, recipes, general chit-chat unrelated to studying), you MUST politely refuse and state that you are laser-focused on exam prep. Be concise, encouraging, and helpful in your valid responses.

FORMATTING RULES: You must optimize for extreme readability on a small mobile screen. 1) NEVER write a wall of text. Break your response into micro-paragraphs of 1 to 2 sentences max. 2) Aggressively use bullet points for lists or steps. 3) Use emojis to make the tone friendly and interactive. 4) Be concise, punchy, and highly encouraging.`;

// Emit a single canned assistant message as a v7 UI-message stream so the
// client's useChat renders it identically to a real streamed response.
function staticUIMessageResponse(text: string): Response {
  const id = 'guest-' + Date.now();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue({ type: 'start' });
      controller.enqueue({ type: 'text-start', id });
      controller.enqueue({ type: 'text-delta', id, delta: text });
      controller.enqueue({ type: 'text-end', id });
      controller.enqueue({ type: 'finish' });
      controller.close();
    },
  });
  return createUIMessageStreamResponse({ stream });
}

export async function POST(req: Request) {
  // Tracked at function scope so the catch block can refund a credit deducted
  // before the Gemini call failed. Set only after a real (non-bypassed) charge.
  let chargedUserId: string | null = null;

  // Canned reply shown to anyone who isn't a signed-in user: the explicit
  // guest cookie (legacy onboarding) OR any unauthenticated visitor. The
  // onboarding flow that set `onboarding_guest` was removed, so we no longer
  // gate solely on that cookie — otherwise logged-out visitors 401 and Tejas
  // shows "lost signal" instead of the guest greeting.
  const guestReply =
    "I'm Tejas, your AI study wingman! 🛫 I can break down concepts, quiz you, and map out revision plans. Create a free account to fly a full mission with me!";

  try {
    if (isGuestUser()) {
      return staticUIMessageResponse(guestReply);
    }

    const supabase = createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData?.user) {
      // Not signed in and not a flagged guest — treat as a guest visitor
      // rather than rejecting, so the assistant still responds.
      return staticUIMessageResponse(guestReply);
    }

    // Per-user rate limit before spending any provider quota.
    const rate = await checkAiRateLimit(authData.user.id);
    if (!rate.success) {
      return new Response('Too Many Requests', {
        status: 429,
        headers: { 'Retry-After': Math.max(1, Math.ceil((rate.reset - Date.now()) / 1000)).toString() },
      });
    }

    // Meter the endpoint — 1 credit per message, matching /api/coach.
    const creditCheck = await checkAndDeductCredits(authData.user.id, authData.user.email, 1);
    if (!creditCheck.success) {
      return new Response(creditCheck.error || 'INSUFFICIENT_CREDITS', { status: 402 });
    }
    if (!creditCheck.bypassed) {
      chargedUserId = authData.user.id;
    }

    const { messages }: { messages: UIMessage[] } = await req.json();

    // v7 UIMessages carry content in parts[], not a `content` string. Sanitize
    // each text part in place, then convert to provider (model) messages.
    const sanitizedMessages = (messages ?? []).map((m) => ({
      ...m,
      parts: Array.isArray(m.parts)
        ? m.parts.map((p: any) =>
            p?.type === 'text' ? { ...p, text: sanitizePrompt(p.text ?? '') } : p
          )
        : m.parts,
    }));

    const result = await streamText({
      model: google('gemini-2.5-flash'),
      system: systemInstruction,
      messages: await convertToModelMessages(sanitizedMessages),
      temperature: 0.5,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('[API Chat] Error:', error);
    // Refund the credit if the provider call failed after we charged for it.
    if (chargedUserId) await refundCredits(chargedUserId, 1);
    return new Response('Error generating response', { status: 500 });
  }
}
