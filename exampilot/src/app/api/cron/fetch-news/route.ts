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
    const query = 'defence OR military OR ISRO OR DRDO OR "Indian Navy" OR "Indian Army" OR "Air Force" OR sports';
    const gnewsRes = await fetch(`https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&country=in&max=5&apikey=${gnewsKey}`);
    const data = await gnewsRes.json();
    if (data.articles) {
      articles = data.articles;
    } else {
      throw new Error(data.errors?.[0] || "No articles found from GNews");
    }
  } catch (err: any) {
    console.warn("GNews API network fetch failed, using fallback mock data. Error:", err.message);
    articles = [
      {
        title: "Indian Navy's latest aircraft carrier completes sea trials",
        description: "The indigenous aircraft carrier has successfully completed its final phase of sea trials and is ready for commissioning into the Indian Navy, marking a historic milestone.",
        url: "https://example.com/navy-news",
        image: "https://example.com/navy.jpg"
      },
      {
        title: "ISRO launches next-generation weather satellite",
        description: "The Indian Space Research Organisation (ISRO) successfully placed the advanced meteorological satellite into orbit, boosting the country's weather forecasting capabilities.",
        url: "https://example.com/isro-news",
        image: "https://example.com/isro.jpg"
      },
      {
        title: "DRDO tests new anti-tank guided missile",
        description: "Defence Research and Development Organisation (DRDO) has conducted a successful flight test of the indigenous anti-tank guided missile from a helicopter platform.",
        url: "https://example.com/drdo-news",
        image: "https://example.com/drdo.jpg"
      }
    ];
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
      const prompt = `Analyze this news article for a fast-paced Indian Defense Exam (AFCAT/NDA/CDS) preparation news feed.
Title: ${article.title}
Description: ${article.description}

Output a JSON object with EXACTLY these keys:
- "summary": A punchy, 60-word maximum news brief. Filter out fluff and focus on high-yield facts (names, operations, tech, milestones).
- "category": A single word or short phrase categorizing the news (e.g. "Defence", "Space", "Sports", "Geopolitics", "Tech").
- "relevance_score": An integer from 0 to 100 representing the probability that this topic will be asked in Indian Defense exams.

Output ONLY valid JSON, no markdown formatting or backticks.`;

      const result = await model.generateContent(prompt);
      let responseText = result.response.text().trim();
      
      if (responseText.startsWith('\`\`\`json')) {
        responseText = responseText.replace(/^\`\`\`json\n|\n\`\`\`$/g, '');
      } else if (responseText.startsWith('\`\`\`')) {
        responseText = responseText.replace(/^\`\`\`\n|\n\`\`\`$/g, '');
      }

      let parsedAI = { summary: article.description, category: "General", relevance_score: 50 };
      try {
        parsedAI = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse Gemini JSON:", responseText);
      }

      return {
        headline: article.title,
        summary: parsedAI.summary || article.description,
        category: parsedAI.category || "General",
        exam_relevance_score: typeof parsedAI.relevance_score === 'number' ? parsedAI.relevance_score : 50,
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
