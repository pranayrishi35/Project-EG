import { LegalMarkdown } from "@/components/LegalMarkdown";
import fs from "fs";
import path from "path";

export const metadata = {
  title: "Refund Policy | ExamPilot",
  description: "ExamPilot Refund & Cancellation Policy",
};

export default async function RefundPolicyPage() {
  const filePath = path.join(process.cwd(), "docs", "legal", "refund_cancellation_policy.md");
  const content = fs.readFileSync(filePath, "utf8");

  return <LegalMarkdown content={content} />;
}
