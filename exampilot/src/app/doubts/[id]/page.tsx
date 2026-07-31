import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getDoubtPost } from "@/app/actions/doubtBoard";
import DoubtPostClient from "@/components/doubts/DoubtPostClient";

export const metadata: Metadata = {
  title: "Doubt — Jishnu",
  description: "A community question on the Jishnu doubt board.",
};

export default async function DoubtPostPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/doubts/${params.id}`);
  }

  const result = await getDoubtPost(params.id);
  if (!result.success) {
    notFound();
  }

  return <DoubtPostClient post={result.data} />;
}
