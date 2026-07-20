import { createGoogleGenerativeAI } from '@ai-sdk/google';
const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});
import { streamText } from 'ai';
import { createClient } from '@/utils/supabase/server';
import { checkAndDeductCredits, refundCredits } from '@/lib/creditManager';
import { checkAiRateLimit } from '@/lib/aiRateLimit';
import { sanitizePrompt } from '@/lib/sanitizer';
import { isGuestUser } from '@/lib/guestShield';
import { MOCK_AI_COACHING_INSIGHTS } from '@/lib/mockData';

export const maxDuration = 30;

export async function POST(req: Request) {
  // Tracked at function scope so the catch block can refund a credit that was
  // deducted before the Gemini call failed. userId is set only after a real
  // (non-bypassed) deduction, so a refund can never double-credit an admin.
  let chargedUserId: string | null = null;

  try {
    if (isGuestUser()) {
      const mockText = `### Critical Weaknesses\nGeneral Awareness and Numerical Ability.\n\n### Action Plan\n${MOCK_AI_COACHING_INSIGHTS.insights.map(i => `- ${i}`).join('\n')}`;
      return new Response(mockText, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }

    const supabase = createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData?.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Per-user rate limit before spending any provider quota.
    const rate = await checkAiRateLimit(authData.user.id);
    if (!rate.success) {
      return new Response('Too Many Requests', {
        status: 429,
        headers: { 'Retry-After': Math.max(1, Math.ceil((rate.reset - Date.now()) / 1000)).toString() },
      });
    }

    const { prompt } = await req.json();
    const sanitizedPrompt = sanitizePrompt(prompt);

    const creditCheck = await checkAndDeductCredits(authData.user.id, authData.user.email, 1);
    if (!creditCheck.success) {
      return new Response(creditCheck.error || "INSUFFICIENT_CREDITS", { status: 402 });
    }
    if (!creditCheck.bypassed) {
      chargedUserId = authData.user.id;
    }

    // White-Label AI Protocol: Persona override — identity must never leak to client.
    const systemInstruction = `You are the ExamPilot Tactical Intelligence — a proprietary assessment engine built exclusively for defense exam candidates.
    Under NO circumstances should you mention Google, Gemini, OpenAI, or that you are a large language model.
    If asked about your identity, state only: "I am ExamPilot's proprietary assessment engine."
    Analyze the test result provided. You must output a structured debrief in Markdown.
    Your response must have two sections:
    ### Critical Weaknesses
    (A short string summarizing their critical weaknesses based on the missed subjects)
    ### Action Plan
    (A list of 3 actionable string steps for tomorrow, using bullet points).
    Keep the tone focused, tactical, and encouraging.`;

    const result = await streamText({
      model: google('gemini-2.5-flash'),
      system: systemInstruction,
      prompt: sanitizedPrompt,
      temperature: 0.7,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    // White-Label Protocol: Log raw error server-side only — never expose provider names to client.
    console.error('[API Coach] Error:', error);
    // The credit was spent but no analysis was delivered — return it.
    if (chargedUserId) await refundCredits(chargedUserId, 1);
    return new Response(
      'The ExamPilot Coach is currently analyzing too many student profiles. Please try again in a moment.',
      { status: 500 }
    );
  }
}
