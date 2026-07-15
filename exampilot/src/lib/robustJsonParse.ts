/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Extracts and parses JSON from a potentially messy AI response.
 * Handles markdown formatting, trailing commas, and can optionally salvage partial arrays.
 */
export function robustJsonParse(rawText: string, batchIndex: number = 0, requestedCount: number = 0) {
  let clean = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
  
  // 1. Strip trailing commas safely
  clean = clean.replace(/,\s*([\]}])/g, '$1');

  // 2. Try parsing the clean string directly first
  try {
    const parsed = JSON.parse(clean);
    return parsed;
  } catch (e: any) {
    // 3. Fallback: Salvage partial arrays by parsing balanced JSON objects
    const recovered: any[] = [];
    let braceDepth = 0;
    let startIdx = -1;
    let inString = false;
    let escape = false;

    for (let i = 0; i < clean.length; i++) {
      const char = clean[i];
      if (escape) {
        escape = false;
        continue;
      }
      if (char === '\\') {
        escape = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      
      if (!inString) {
        if (char === '{') {
          if (braceDepth === 0) startIdx = i;
          braceDepth++;
        } else if (char === '}') {
          braceDepth--;
          if (braceDepth === 0 && startIdx !== -1) {
            const candidate = clean.substring(startIdx, i + 1);
            try {
              recovered.push(JSON.parse(candidate));
            } catch {
              // ignore malformed objects
            }
            startIdx = -1;
          }
        }
      }
    }

    if (recovered.length > 0) {
      console.warn(`[Batch ${batchIndex}] Recovered ${recovered.length} out of ${requestedCount} requested objects from truncated response. Raw length: ${rawText.length}`);
      return recovered;
    }

    // 4. If nothing recovered, throw error with diagnostics
    const msg = e instanceof Error ? e.message : "Unknown error";
    const parsePos = msg.match(/position (\d+)/)?.[1] || "unknown";
    console.error(`[Batch ${batchIndex}] JSON Parse Error at position ${parsePos}. Raw response length: ${rawText.length}`);
    throw new Error(`JSON Parse Error: ${msg} in batch ${batchIndex}. Raw length: ${rawText.length}`);
  }
}
