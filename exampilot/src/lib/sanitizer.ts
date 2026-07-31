/**
 * Utility to strip structured Personally Identifiable Information (PII) from text 
 * before sending it to third-party services (like the Gemini API).
 */
import nlp from 'compromise';

export function sanitizePrompt(text: string | null | undefined): string {
  if (!text) return '';

  let sanitized = text;

  // 1. Strip Email Addresses
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  sanitized = sanitized.replace(emailRegex, '[REDACTED_EMAIL]');

  // 2. Strip Phone Numbers (matches standard 10-digit formats with optional +91 or +1)
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  sanitized = sanitized.replace(phoneRegex, '[REDACTED_PHONE]');

  // 3. Strip Proper Nouns / Names using NLP
  const doc = nlp(sanitized);
  doc.people().replaceWith('[REDACTED_NAME]');
  sanitized = doc.text();

  return sanitized;
}
