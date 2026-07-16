import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Ensure this runs dynamically
export const dynamic = "force-dynamic";
export const maxDuration = 60; // Extend Vercel Hobby timeout to maximum allowed

export async function GET(req: NextRequest) {
  // 1. Validate CRON_SECRET for access control
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  
  // If CRON_SECRET is set in env, enforce it. Otherwise, fallback to a query param check (for easy manual admin triggering during dev)
  const isAuthorized = 
    (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
    req.nextUrl.searchParams.get("secret") === cronSecret;

  if (cronSecret && !isAuthorized) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  // 2. Fetch GNews using real API
  const gnewsKey = process.env.GNEWS_API_KEY;
  if (!gnewsKey) {
    return NextResponse.json({ success: false, error: "Missing GNews API Key" }, { status: 500 });
  }

  // Fetching news related to defense, space, and sports for Indian exams
  let articles: any[] = [];
  try {
    const gnewsRes = await fetch(`https://gnews.io/api/v4/search?q=defence OR military OR ISRO OR DRDO OR "Indian Navy" OR "Indian Army" OR "Air Force" OR sports&country=in&max=10&apikey=${gnewsKey}`);
    const data = await gnewsRes.json();
    if (data.articles) {
      articles = data.articles;
    } else {
      throw new Error(data.errors?.[0] || "No articles found from GNews");
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: "GNews API Failed: " + err.message }, { status: 500 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ success: false, error: "Missing Gemini API Key" }, { status: 500 });
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

  const fetchedAt = new Date().toISOString();

  // 3. Summarize via Gemini
  const summaryPromises = articles.map(async (article) => {
    try {
      const prompt = `Summarize this news article into a punchy, 60-word maximum news brief suitable for a fast-paced Indian Defense Exam (AFCAT/NDA/CDS) preparation news feed. Filter out any fluff and focus strictly on high-yield facts (names, operations, tech, milestones).
Title: ${article.title}
Description: ${article.description}

Output ONLY the summary text, nothing else.`;

      const result = await model.generateContent(prompt);
      let summary = result.response.text().trim();
      
      // Fallback if Gemini fails or hallucinates
      if (!summary || summary.length < 10) {
        summary = article.description;
      }

      return {
        headline: article.title,
        summary: summary,
        category: "Defence/Tech", // In real implementation, parse from GNews topic
        source_url: article.url,
        image_url: article.image,
        fetched_at: fetchedAt
      };
      
    } catch (error) {
      console.error("Gemini summarization failed for article:", article.title, error);
      return null;
    }
  });

  const resolvedArticles = await Promise.all(summaryPromises);
  const processedArticles = resolvedArticles.filter((a): a is NonNullable<typeof a> => a !== null);

  if (processedArticles.length === 0) {
    return NextResponse.json({ success: false, error: "Failed to process any articles" }, { status: 500 });
  }

  // 4. Check for duplicates in DB before inserting
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createSupabaseClient(supabaseUrl, supabaseServiceKey);
  const urls = processedArticles.map(a => a.source_url);
  const { data: existing } = await supabase.from("news_cache").select("source_url").in("source_url", urls);
  
  const existingUrls = new Set(existing?.map(e => e.source_url) || []);
  const newArticles = processedArticles.filter(a => !existingUrls.has(a.source_url));

  if (newArticles.length === 0) {
    return NextResponse.json({ success: true, count: 0, message: "No new articles found." });
  }

  // 5. Insert into Supabase
  const { error } = await supabase.from("news_cache").insert(newArticles);

  if (error) {
    console.error("Supabase insert error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ 
    success: true, 
    count: processedArticles.length,
    batch_id: fetchedAt
  });
}
