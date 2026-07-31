import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getDoubtPosts, getMyHandle, type ExamTrack } from "@/app/actions/doubtBoard";
import DoubtBoardClient from "@/components/doubts/DoubtBoardClient";

export const metadata: Metadata = {
  title: "Doubt Board — Jishnu",
  description: "Ask and answer exam doubts with the community. Moderated, public, safe.",
};

const VALID_TRACKS: ExamTrack[] = ["AFCAT", "NDA", "CDS"];

export default async function DoubtsPage({
  searchParams,
}: {
  searchParams: { track?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/doubts");
  }

  const track: ExamTrack = VALID_TRACKS.includes(searchParams.track as ExamTrack)
    ? (searchParams.track as ExamTrack)
    : "AFCAT";

  const [postsResult, handleResult] = await Promise.all([
    getDoubtPosts(track),
    getMyHandle(),
  ]);

  return (
    <DoubtBoardClient
      initialTrack={track}
      initialPosts={postsResult.success ? postsResult.data : []}
      loadError={postsResult.success ? null : postsResult.error}
      myHandle={handleResult.username}
    />
  );
}
