import { LegalMarkdown } from "@/components/LegalMarkdown";
import fs from "fs";
import path from "path";

export const metadata = {
  title: "Community Guidelines | Jishnu",
  description: "Rules and safety guidelines for the Jishnu Doubt Board.",
};

export default async function CommunityGuidelinesPage() {
  const filePath = path.join(process.cwd(), "docs", "legal", "community_guidelines.md");
  const content = fs.readFileSync(filePath, "utf8");

  return <LegalMarkdown content={content} />;
}
