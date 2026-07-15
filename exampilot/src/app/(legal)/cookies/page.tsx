import { LegalMarkdown } from "@/components/LegalMarkdown";
import fs from "fs";
import path from "path";

export const metadata = {
  title: "Cookie Policy | ExamPilot",
  description: "ExamPilot Cookie Policy",
};

export default async function CookiesPage() {
  const filePath = path.join(process.cwd(), "docs", "legal", "cookie_policy.md");
  const content = fs.readFileSync(filePath, "utf8");

  return <LegalMarkdown content={content} />;
}
