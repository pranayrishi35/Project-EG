import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { createClient } from '@/utils/supabase/server';
import { checkAndDeductCredits } from '@/lib/creditManager';
import { sanitizePrompt } from '@/lib/sanitizer';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData?.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { prompt } = await req.json();
    const sanitizedPrompt = sanitizePrompt(prompt);

    const creditCheck = await checkAndDeductCredits(authData.user.id, authData.user.email, 1);
    if (!creditCheck.success) {
      return new Response(creditCheck.error || "INSUFFICIENT_CREDITS", { status: 402 });
    }

    const systemInstruction = `You are an elite defense exam tactical coach. 
    Analyze the test result provided. You must output a structured debrief in Markdown. 
    Your response must have two sections: 
    ### Critical Weaknesses 
    (A short string summarizing their critical weaknesses based on the missed subjects)
    ### Action Plan
    (A list of 3 actionable string steps for tomorrow, using bullet points).
    Keep the tone focused, tactical, and encouraging.`;

    const result = await streamText({
      model: google('gemini-3.1-flash-lite'),
      system: systemInstruction,
      prompt: sanitizedPrompt,
      temperature: 0.7,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('[API Coach] Error:', error);
    return new Response('Error generating strategy', { status: 500 });
  }
}
