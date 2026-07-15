import { sanitizePrompt } from './sanitizer';

console.log("=== Testing Sanitizer ===");

// 1. Test with Email and Phone (Should Redact)
const test1 = "Hi, my email is test@example.com and you can reach me at 555-123-4567.";
console.log("Input 1:", test1);
console.log("Output 1:", sanitizePrompt(test1));
console.log("------------------------");

// 2. Test with unstructured PII - Name (Should NOT Redact)
const test2 = "Hi, my name is Rahul Sharma and I need help with calculus.";
console.log("Input 2:", test2);
console.log("Output 2:", sanitizePrompt(test2));
console.log("------------------------");

// 3. Mixed Test
const test3 = "I'm Priya. Send the syllabus to priya.99@gmail.com. Or call +91-9876543210.";
console.log("Input 3:", test3);
console.log("Output 3:", sanitizePrompt(test3));
console.log("=========================");
