// ─────────────────────────────────────────────────────────────────────────────
// Content moderation filter for the public doubt board (Master Prompt v6, Part 5).
//
// Goal: block profanity/abuse/harassment on submission, hardened against the
// common evasion tricks — leetspeak (a→@/4, i→1/!, e→3, o→0, s→$/5), spacing
// and punctuation insertion (f.u.c.k, s h i t), repeated characters
// (fuuuuck), and zero-width/unicode obfuscation.
//
// This is deliberately conservative: it favors catching evasions over avoiding
// false positives, because the audience includes minors (per the Council audit).
// The trade-off is handled two ways:
//   1. Word-boundary matching on the NORMALIZED text so "Scunthorpe problem"
//      false positives (class, assess, etc.) are avoided via an allowlist.
//   2. A returned `matches` list so the caller can log what tripped it.
//
// Pure + dependency-free. Not a replacement for human moderation — it's the
// automated first line, backed by the Report flow + admin queue.
// ─────────────────────────────────────────────────────────────────────────────

export interface ModerationResult {
  /** true = content is clean and may be published. */
  ok: boolean;
  /** Human-facing reason when blocked (safe to show the user). */
  reason?: string;
  /** Internal: which categories tripped (for admin logs, never shown raw). */
  matches?: string[];
}

// Base offensive stems. Kept as stems so morphological variants (…ing/…er/…ed)
// are caught by substring test on normalized text. This is an English + common
// Hinglish abuse set appropriate to the platform's audience.
const BLOCKLIST_STEMS: string[] = [
  // English profanity / slurs (stems)
  "fuck", "shit", "bitch", "bastard", "asshole", "dickhead", "motherfuck",
  "cunt", "whore", "slut", "faggot", "nigger", "nigga", "retard", "dyke",
  "cock", "pussy", "wank", "jerkoff", "jackass", "dumbass", "prick",
  // Sexual / harassment
  "rape", "molest", "pedophile", "paedophile", "nude", "nudes", "porn",
  "sexchat", "sexvideo",
  // Hinglish / regional abuse (common in Indian exam-forum trolling)
  "madarchod", "behenchod", "bhenchod", "chutiya", "chutiye", "gaandu",
  "gandu", "randi", "lund", "lauda", "bhosdi", "bhosda", "harami",
  "kutte", "kamine", "chinaal", "raand",
  // Self-harm / violent threats (route to safety, block from public board)
  "killyourself", "kys", "suicidebait",
];

// Words that CONTAIN a blocked stem but are legitimate — exempt from matching.
// (The "Scunthorpe problem".) Checked against the normalized token.
const ALLOWLIST: Set<string> = new Set([
  "class", "classes", "classic", "classical", "classify",
  "assess", "assessment", "assessed", "assessing",
  "assassin", "assassination",
  "pass", "passed", "passing", "password", "passage", "passenger",
  "bass", "brass", "grass", "glass", "mass", "massive", "compass",
  "cockpit", "cocktail", "peacock", "shuttlecock",
  "analysis", "analyst", "analytical", "canalyse",
  "scrap", "scrape", "scrappy",
  "matriculate", "circumstance",
]);

// Leetspeak / homoglyph normalization map.
const CHAR_MAP: Record<string, string> = {
  "0": "o", "1": "i", "!": "i", "|": "i", "3": "e", "4": "a", "@": "a",
  "5": "s", "$": "s", "7": "t", "8": "b", "9": "g", "€": "e", "£": "l",
  // common unicode look-alikes
  "à": "a", "á": "a", "â": "a", "ä": "a", "ã": "a",
  "è": "e", "é": "e", "ê": "e", "ë": "e",
  "ì": "i", "í": "i", "î": "i", "ï": "i",
  "ò": "o", "ó": "o", "ô": "o", "ö": "o", "õ": "o",
  "ù": "u", "ú": "u", "û": "u", "ü": "u",
  "ç": "c", "ñ": "n",
};

/**
 * Aggressive normalization for evasion-resistant matching:
 *   1. Lowercase + Unicode NFKD (splits accents into base + combining mark).
 *   2. Strip zero-width and combining marks.
 *   3. Map leetspeak/homoglyphs to base letters.
 *   4. Collapse runs of the same letter to a single letter (fuuuck → fuck).
 *   5. Drop everything that isn't a-z, keeping a separate spaced form.
 */
function normalize(input: string): { tokens: string[] } {
  let s = input.toLowerCase().normalize("NFKD");
  // Remove zero-width chars (ZWSP, ZWNJ, ZWJ, BOM) + combining diacritical marks.
  s = s.replace(/[​‌‍﻿]/g, "");
  s = s.replace(/[̀-ͯ]/g, "");
  // Map leet/homoglyph chars.
  s = s.replace(/./g, (ch) => CHAR_MAP[ch] ?? ch);

  // Tokenize on non-letters BEFORE stripping, so we keep real word boundaries
  // for the allowlist check.
  const tokens = s
    .split(/[^a-z]+/)
    .filter(Boolean)
    .map((t) => t.replace(/(.)\1{2,}/g, "$1$1")); // fuuuuck→fuuck (keep doubles)

  return { tokens };
}

// Pre-collapse each stem the same way `collapsed` is built (squeeze repeats) so
// e.g. "asshole" → "ashole" matches the collapsed input consistently.
const COLLAPSED_STEMS: { stem: string; collapsed: string }[] = BLOCKLIST_STEMS.map(
  (stem) => ({ stem, collapsed: stem.replace(/(.)\1+/g, "$1") })
);

/**
 * Moderate a piece of user text. Returns { ok: true } if clean.
 *
 * Two-layer detection:
 *   • Token layer: any token that IS a blocked stem or starts with one, unless
 *     the token is allowlisted. Catches normal usage + morphology.
 *   • Collapsed layer: the whole text with separators removed — catches
 *     "f u c k", "sh!t", "b.i.t.c.h" that the token layer would miss.
 */
export function moderateContent(text: string | null | undefined): ModerationResult {
  if (!text || !text.trim()) {
    return { ok: false, reason: "Content cannot be empty." };
  }

  const { tokens } = normalize(text);
  const matches = new Set<string>();

  // Token layer.
  for (const token of tokens) {
    if (ALLOWLIST.has(token)) continue;
    for (const { stem } of COLLAPSED_STEMS) {
      // token equals stem, or token begins with stem (morphology: fucking),
      // or stem is embedded in a longer non-allowlisted token (motherfucker).
      if (token === stem || token.startsWith(stem) || token.includes(stem)) {
        matches.add(stem);
        break;
      }
    }
  }

  // Collapsed layer — only meaningful for multi-char stems (avoid trivial
  // 3-letter stems matching inside innocent squeezed text). Require length >= 4.
  //
  // Build the collapsed form from ONLY the non-allowlisted tokens, so a clean
  // token like "cockpit" (allowlisted) can't contribute its letters to a
  // cross-token false positive. This keeps the spacing-evasion defense
  // ("f u c k" → tokens f,u,c,k are all non-allowlisted → collapse to "fuck")
  // while exempting legitimate words.
  const unsafeCollapsed = tokens
    .filter((t) => !ALLOWLIST.has(t))
    .join("")
    .replace(/(.)\1+/g, "$1");

  for (const { stem, collapsed: cstem } of COLLAPSED_STEMS) {
    if (cstem.length < 4) continue;
    if (unsafeCollapsed.includes(cstem)) {
      matches.add(stem);
    }
  }

  if (matches.size > 0) {
    return {
      ok: false,
      reason:
        "Your post appears to contain language that violates our community guidelines. Please rephrase respectfully and try again.",
      matches: Array.from(matches),
    };
  }

  return { ok: true };
}
