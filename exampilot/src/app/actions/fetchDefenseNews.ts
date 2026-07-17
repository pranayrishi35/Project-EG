"use server";
import { z } from "zod";

import { getAdminClient } from "@/lib/adminClient";
import { headers } from "next/headers";
import { unstable_cache } from "next/cache";

export type NewsItem = {
  id: string;
  title: string;
  summary: string;
  category: string;
  relevanceScore: number;
  url: string;
  imageUrl: string;
  publishedAt: string;
};

const MOCK_DEFENSE_NEWS: NewsItem[] = [
  {
    id: "mock-1",
    title: "DRDO Successfully Test-Fires Agni-V Ballistic Missile",
    summary: "India successfully flight-tested the Agni-V surface-to-surface ballistic missile, featuring Multiple Independently Targetable Re-entry Vehicle (MIRV) technology, bolstering strategic deterrence.",
    category: "Defence",
    relevanceScore: 95,
    url: "#",
    imageUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='400'%3E%3Crect width='100%25' height='100%25' fill='%231e293b'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='24' fill='%236366f1' text-anchor='middle' dominant-baseline='middle'%3EDefense News%3C/text%3E%3C/svg%3E",
    publishedAt: new Date().toISOString()
  }
];

const FetchDefenseNewsSchema = z.object({ 
  page: z.number().default(0), 
  limit: z.number().default(20),
  category: z.string().optional(),
  minScore: z.number().optional(),
  dateFilter: z.string().optional()
});

export const fetchDefenseNews = async (
  rawPage = 0, 
  rawLimit = 20, 
  category?: string, 
  minScore?: number, 
  dateFilter?: string
): Promise<{ data: NewsItem[], hasMore: boolean }> => {
  const parsed = FetchDefenseNewsSchema.safeParse({ page: rawPage, limit: rawLimit, category, minScore, dateFilter });
  if (!parsed.success) throw new Error("BAD_REQUEST");
  const { page, limit, category: cat, minScore: score, dateFilter: date } = parsed.data;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const supabase = getAdminClient();
    
    const from = page * limit;
    const to = from + limit - 1;

    let query = supabase
      .from("news_cache")
      .select("id, headline, summary, category, exam_relevance_score, source_url, image_url, fetched_at")
      .order("fetched_at", { ascending: false })
      .range(from, to)
      .abortSignal(controller.signal);

    if (cat && cat !== "All") {
      query = query.ilike("category", `%${cat}%`);
    }
    if (score && score > 0) {
      query = query.gte("exam_relevance_score", score);
    }
    if (date && date !== "All Time") {
      const now = new Date();
      if (date === "Last 24 Hours") {
        now.setHours(now.getHours() - 24);
        query = query.gte("fetched_at", now.toISOString());
      } else if (date === "Last 7 Days") {
        now.setDate(now.getDate() - 7);
        query = query.gte("fetched_at", now.toISOString());
      }
    }

    const { data, error } = await query;
    clearTimeout(timeoutId);

    if (error) {
      throw new Error("API responded with " + error.code + ": " + error.message);
    }
    
    if (!data || data.length === 0) {
      return { data: [], hasMore: false };
    }

    // Auto-refresh logic (only trigger if no filters are applied to prevent weird behavior)
    if (!cat && !score && !date && data.length > 0) {
      const latestFetch = new Date(data[0].fetched_at).getTime();
      if (Date.now() - latestFetch > 12 * 60 * 60 * 1000) {
        const secret = process.env.CRON_SECRET;
        if (secret) {
          let host = process.env.VERCEL_URL || "localhost:3000";
          let protocol = process.env.NODE_ENV === "development" ? "http" : "https";
          const url = `${protocol}://${host}/api/cron/fetch-news?secret=${secret}`;
          fetch(url, { method: 'GET', cache: 'no-store' }).catch(() => {});
        }
      }
    }

    const formattedData = data.map((item: any) => {
      let finalImageUrl = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='400'%3E%3Crect width='100%25' height='100%25' fill='%231e293b'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='24' fill='%236366f1' text-anchor='middle' dominant-baseline='middle'%3EDefense News%3C/text%3E%3C/svg%3E";
      if (item.image_url && item.image_url !== "null" && item.image_url !== "undefined") {
        if (typeof item.image_url === 'string' && item.image_url.startsWith('[')) {
          try {
            const arr = JSON.parse(item.image_url);
            if (arr.length > 0) finalImageUrl = arr[0];
          } catch (e) {}
        } else {
          finalImageUrl = item.image_url;
        }
        if (finalImageUrl.startsWith('//')) {
          finalImageUrl = 'https:' + finalImageUrl;
        }
      }
      return {
        id: item.id,
        title: item.headline,
        summary: item.summary,
        category: item.category || "General",
        relevanceScore: item.exam_relevance_score || 50,
        url: item.source_url,
        imageUrl: finalImageUrl,
        publishedAt: item.fetched_at,
      };
    });

    return { data: formattedData, hasMore: formattedData.length === limit };
  } catch (error) {
    clearTimeout(timeoutId);
    console.error("[News Fetch Error]:", error);
    return { data: page === 0 ? MOCK_DEFENSE_NEWS : [], hasMore: false };
  }
};
