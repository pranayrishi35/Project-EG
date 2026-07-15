import { LegalMarkdown } from "@/components/LegalMarkdown";
import fs from "fs";
import path from "path";

export const metadata = {
  title: "Acceptable Usage Policy | ExamPilot",
  description: "ExamPilot Acceptable Usage Policy",
};

export default async function AupPage() {
  const filePath = path.join(process.cwd(), "docs", "legal", "acceptable_use_policy.md");
  const content = fs.readFileSync(filePath, "utf8");

  return <LegalMarkdown content={content} />;
}
