import { LegalMarkdown } from "@/components/LegalMarkdown";
import fs from "fs";
import path from "path";

export const metadata = {
  title: "Privacy Policy | Jishnu",
  description: "Jishnu Privacy Policy",
};

export default async function PrivacyPage() {
  const filePath = path.join(process.cwd(), "docs", "legal", "privacy_policy.md");
  const content = fs.readFileSync(filePath, "utf8");

  return <LegalMarkdown content={content} />;
}
