import { sanitizePrompt } from './src/lib/sanitizer.ts';

const testCases = [
  "Contact Rahul Sharma at 9876543210 for more info on the NDA syllabus.",
  "Priya and Anjali were studying for the CDS exam yesterday.",
  "The commander of the operation was Gen. Bipin Rawat.",
  "My name is Amit Patel and my email is amit.patel@example.com.",
  "What is the capital of India? New Delhi.", // Checking false positives on places
  "Mr. Rakesh Jhunjhunwala invested in the stock market.",
  "General Knowledge syllabus: History of Ashoka the Great."
];

console.log("--- PII Sanitizer Test ---");
testCases.forEach((t, i) => {
  console.log(`\nCase ${i+1}:`);
  console.log(`Original : ${t}`);
  console.log(`Sanitized: ${sanitizePrompt(t)}`);
});
