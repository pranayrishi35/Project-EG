/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Extracts and parses JSON from a potentially messy AI response.
 * Implements Layer 2 (Markdown Stripping) and Layer 3 (Bracket Extraction).
 */
export function robustJsonParse<T = any>(rawText: string, fallbackObject?: T): T {
  try {
    // Layer 2: Markdown Stripping
    let clean = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();

    // Layer 3: Bracket Extraction
    const firstBracket = Math.min(
      clean.indexOf('{') !== -1 ? clean.indexOf('{') : Infinity,
      clean.indexOf('[') !== -1 ? clean.indexOf('[') : Infinity
    );
    
    const lastBracket = Math.max(
      clean.lastIndexOf('}'),
      clean.lastIndexOf(']')
    );

    if (firstBracket !== Infinity && lastBracket !== -1 && lastBracket >= firstBracket) {
      clean = clean.substring(firstBracket, lastBracket + 1);
    }

    // Strip trailing commas safely
    clean = clean.replace(/,\s*([\]}])/g, '$1');

    return JSON.parse(clean) as T;
  } catch (error) {
    // Failure Graceful Handling
    console.error("[robustJsonParse] Fatal Parse Error. Raw broken string:", rawText, "Error:", error);
    if (fallbackObject !== undefined) {
      return fallbackObject;
    }
    throw error;
  }
}
