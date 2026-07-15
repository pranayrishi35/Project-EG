import { LegalMarkdown } from "@/components/LegalMarkdown";
import fs from "fs";
import path from "path";

export const metadata = {
  title: "Terms of Service | ExamPilot",
  description: "ExamPilot Terms of Service",
};

export default async function TermsPage() {
  const filePath = path.join(process.cwd(), "docs", "legal", "terms_of_service.md");
  const content = fs.readFileSync(filePath, "utf8");

  return <LegalMarkdown content={content} />;
}
