"use server";

import { createClient } from "@/utils/supabase/server";
import { triggerNewsFetch } from "@/app/actions/triggerNewsFetch";

export type NewsItem = {
  id: string;
  title: string;
  summary: string;
  url: string;
  imageUrl: string;
  publishedAt: string;
};

const MOCK_DEFENSE_NEWS: NewsItem[] = [
  {
    id: "mock-1",
    title: "DRDO Successfully Test-Fires Agni-V Ballistic Missile",
    summary: "India successfully flight-tested the Agni-V surface-to-surface ballistic missile, featuring Multiple Independently Targetable Re-entry Vehicle (MIRV) technology, bolstering strategic deterrence.",
    url: "#",
    imageUrl: "https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?q=80&w=800&auto=format&fit=crop",
    publishedAt: new Date().toISOString()
  },
  {
    id: "mock-2",
    title: "LCA Tejas Mk1A Completes Maiden Flight",
    summary: "The first production aircraft of the LCA Tejas Mk1A variant successfully completed its maiden flight, marking a significant milestone in indigenous aerospace manufacturing.",
    url: "#",
    imageUrl: "https://images.unsplash.com/photo-1574343166827-0402b80a133b?q=80&w=800&auto=format&fit=crop",
    publishedAt: new Date().toISOString()
  },
  {
    id: "mock-3",
    title: "Indian Navy Commissions INS Jatayu in Lakshadweep",
    summary: "Bolstering maritime security in the strategic Indian Ocean Region, the Indian Navy has commissioned INS Jatayu, an upgraded naval base in the Lakshadweep islands.",
    url: "#",
    imageUrl: "https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?q=80&w=800&auto=format&fit=crop",
    publishedAt: new Date().toISOString()
  },
  {
    id: "mock-4",
    title: "ISRO Achieves Major Milestone in Gaganyaan Mission",
    summary: "ISRO has successfully completed the human rating of the CE20 cryogenic engine, a crucial step forward for India's ambitious Gaganyaan human spaceflight program.",
    url: "#",
    imageUrl: "https://images.unsplash.com/photo-1574343166827-0402b80a133b?q=80&w=800&auto=format&fit=crop",
    publishedAt: new Date().toISOString()
  },
  {
    id: "mock-5",
    title: "Joint Military Exercise 'Desert Knight' Concludes",
    summary: "The joint military exercise involving the Indian Air Force and international partners concluded successfully, enhancing interoperability and tactical combat skills.",
    url: "#",
    imageUrl: "https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?q=80&w=800&auto=format&fit=crop",
    publishedAt: new Date().toISOString()
  }
];

export async function fetchDefenseNews(page = 0, limit = 20): Promise<{ data: NewsItem[], hasMore: boolean }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const supabase = createClient();
    
    const from = page * limit;
    const to = from + limit - 1;

    // Instead of fetch, we do the Supabase call
    const { data, error } = await supabase
      .from("news_cache")
      .select("id, headline, summary, source_url, image_url, fetched_at")
      .order("fetched_at", { ascending: false })
      .range(from, to)
      .abortSignal(controller.signal);

    clearTimeout(timeoutId);

    if (error) {
      throw new Error("API responded with " + error.code + ": " + error.message);
    }
    
    if (!data || data.length === 0) {
      throw new Error("Empty data returned");
    }

    // Auto-refresh logic: If the latest news is older than 12 hours, trigger a refresh in the background
    const latestFetch = data.length > 0 ? new Date(data[0].fetched_at).getTime() : 0;
    const twelveHoursMs = 12 * 60 * 60 * 1000;
    if (Date.now() - latestFetch > twelveHoursMs) {
      console.log("News cache is older than 12 hours. Triggering auto-refresh.");
      // We don't await this so it doesn't block the UI render
      triggerNewsFetch().catch(err => console.error("Auto-refresh failed:", err));
    }

    // Map to the expected UI type
    const formattedData = data.map((item: any) => ({
      id: item.id,
      title: item.headline,
      summary: item.summary,
      url: item.source_url,
      imageUrl: item.image_url || "https://images.unsplash.com/photo-1574343166827-0402b80a133b?q=80&w=800&auto=format&fit=crop",
      publishedAt: item.fetched_at,
    }));

    return { data: formattedData, hasMore: formattedData.length === limit };
  } catch (error) {
    clearTimeout(timeoutId);
    console.error("[News Fetch Error]:", error);
    return { data: page === 0 ? MOCK_DEFENSE_NEWS : [], hasMore: false };
  }
}
