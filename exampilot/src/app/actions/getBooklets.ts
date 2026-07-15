"use server";

import { createClient } from "@/utils/supabase/server";
import { getAdminClient } from "@/lib/adminClient";
import { unstable_cache } from "next/cache";

export type BookletMetadata = Record<string, Record<string, number>>;

export type BookletQuestion = {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
  subject?: string;
};

/**
 * Fetches lightweight metadata for the directory page.
 * We only query exam_target, then group and count in JS.
 */
export const getBookletDirectory = unstable_cache(async (): Promise<BookletMetadata> => {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from("question_bank")
    .select("exam_target, subject")
    .eq("source_pool", "booklet");

  if (error || !data) {
    console.error("Failed to fetch booklet directory:", error);
    return {};
  }

  // Count occurrences of each exam_target and subject
  const counts: Record<string, Record<string, number>> = {};
  for (const row of data) {
    const target = row.exam_target;
    const subject = row.subject || "General";
    if (target) {
      if (!counts[target]) counts[target] = {};
      counts[target][subject] = (counts[target][subject] || 0) + 1;
    }
  }

  return counts;
}, ['booklet-directory'], { revalidate: 3600, tags: ['booklets'] });

/**
 * Fetches the heavy content payload for a specific exam target.
 */
export const getBookletContent = unstable_cache(async (examTarget: string, subject?: string, page = 0, limit = 20): Promise<{ data: BookletQuestion[], hasMore: boolean }> => {
  // Use admin client because correct_index is revoked for standard clients, but booklets explicitly require it.
  const supabase = getAdminClient();
  const from = page * limit;
  const to = from + limit - 1;

  if (examTarget === "Current Affairs") {
    const { data, error } = await supabase
      .from("question_bank")
      .select("id, question, options, correct_index, subject")
      .eq("subject", "Current Affairs")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error || !data) {
      console.error(`Failed to fetch Current Affairs booklet:`, error);
      return { data: [], hasMore: false };
    }
    return { data: data as BookletQuestion[], hasMore: data.length === limit };
  }

  let query = supabase
    .from("question_bank")
    .select("id, question, options, correct_index")
    .eq("exam_target", examTarget)
    .eq("source_pool", "booklet");

  if (subject) {
    query = query.eq("subject", subject);
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error || !data) {
    console.error(`Failed to fetch booklet content for ${examTarget}:`, error);
    return { data: [], hasMore: false };
  }

  return { data: data as BookletQuestion[], hasMore: data.length === limit };
}, ['booklet-content'], { revalidate: 3600, tags: ['booklets'] });
