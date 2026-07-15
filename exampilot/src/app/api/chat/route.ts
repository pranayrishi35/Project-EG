import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';
import { createClient } from '@/utils/supabase/server';
import { sanitizePrompt } from '@/lib/sanitizer';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const maxDuration = 30; // max duration for Vercel Hobby

const systemInstruction = `You are ExamPilot's AI Study Assistant.
You are laser-focused on exam preparation. 
Your ONLY purpose is to answer questions about:
1. Exam concepts and academic subjects.
2. Study strategies, time management, and revision techniques.
3. Navigating and using the ExamPilot app.

If the user asks about ANYTHING unrelated to the above topics (e.g., politics, coding, recipes, general chit-chat unrelated to studying), you MUST politely refuse and state that you are laser-focused on exam prep. Be concise, encouraging, and helpful in your valid responses.

FORMATTING RULES: You must optimize for extreme readability on a small mobile screen. 1) NEVER write a wall of text. Break your response into micro-paragraphs of 1 to 2 sentences max. 2) Aggressively use bullet points for lists or steps. 3) Use emojis to make the tone friendly and interactive. 4) Be concise, punchy, and highly encouraging.`;

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData?.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { messages } = await req.json();

    const sanitizedMessages = messages.map((m: any) => ({
      ...m,
      content: sanitizePrompt(m.content)
    }));

    const result = await streamText({
      model: google('gemini-3.1-flash-lite'),
      system: systemInstruction,
      messages: sanitizedMessages,
      temperature: 0.5,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('[API Chat] Error:', error);
    return new Response('Error generating response', { status: 500 });
  }
}
