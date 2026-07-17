const fs = require('fs');
const path = require('path');

const dir = 'd:/Project-EG/exampilot/src/app/actions';

// 1. fetchDefenseNews.ts
let fdn = fs.readFileSync(path.join(dir, 'fetchDefenseNews.ts'), 'utf-8');
if (!fdn.includes('import { z } from "zod"')) {
    fdn = `import { z } from "zod";\n` + fdn;
    fdn = fdn.replace(
        /export const fetchDefenseNews = unstable_cache\(async \(page = 0, limit = 20\)/,
        `const FetchDefenseNewsSchema = z.object({ page: z.number().default(0), limit: z.number().default(20) });\nexport const fetchDefenseNews = unstable_cache(async (rawPage = 0, rawLimit = 20)`
    );
    fdn = fdn.replace(
        /const controller = new AbortController\(\);/,
        `const parsed = FetchDefenseNewsSchema.safeParse({ page: rawPage, limit: rawLimit });\n  if (!parsed.success) throw new Error("BAD_REQUEST");\n  const { page, limit } = parsed.data;\n  const controller = new AbortController();`
    );
    fs.writeFileSync(path.join(dir, 'fetchDefenseNews.ts'), fdn);
}

// 2. getMiniTest.ts
let gmt = fs.readFileSync(path.join(dir, 'getMiniTest.ts'), 'utf-8');
if (!gmt.includes('import { z } from "zod"')) {
    gmt = `import { z } from "zod";\n` + gmt;
    gmt = gmt.replace(
        /export async function getMiniTest\(examTarget: string\)/,
        `const GetMiniTestSchema = z.object({ examTarget: z.string() });\nexport async function getMiniTest(rawExamTarget: string)`
    );
    gmt = gmt.replace(
        /const supabase = createClient\(\);/,
        `const parsed = GetMiniTestSchema.safeParse({ examTarget: rawExamTarget });\n  if (!parsed.success) throw new Error("BAD_REQUEST");\n  const { examTarget } = parsed.data;\n  const supabase = createClient();`
    );
    fs.writeFileSync(path.join(dir, 'getMiniTest.ts'), gmt);
}

// 3. getMockTest.ts
let gmock = fs.readFileSync(path.join(dir, 'getMockTest.ts'), 'utf-8');
if (!gmock.includes('import { z } from "zod"')) {
    gmock = `import { z } from "zod";\n` + gmock;
    gmock = gmock.replace(
        /export async function getMockTest\(examTarget: string, mini: boolean = false\)/,
        `const GetMockTestSchema = z.object({ examTarget: z.string(), mini: z.boolean().default(false) });\nexport async function getMockTest(rawExamTarget: string, rawMini: boolean = false)`
    );
    gmock = gmock.replace(
        /const supabase = createClient\(\);/,
        `const parsed = GetMockTestSchema.safeParse({ examTarget: rawExamTarget, mini: rawMini });\n  if (!parsed.success) throw new Error("BAD_REQUEST");\n  const { examTarget, mini } = parsed.data;\n  const supabase = createClient();`
    );
    fs.writeFileSync(path.join(dir, 'getMockTest.ts'), gmock);
}

// 4. getCurrentAffairsTest.ts (No params, just add zod import to be consistent if needed, but no payload so skip)

// 5. getBooklets.ts
let gbk = fs.readFileSync(path.join(dir, 'getBooklets.ts'), 'utf-8');
if (!gbk.includes('import { z } from "zod"')) {
    gbk = `import { z } from "zod";\n` + gbk;
    gbk = gbk.replace(
        /export async function getBookletContent\(examTarget: string, subject\?: string, page = 0, limit = 20\)/,
        `const GetBookletContentSchema = z.object({ examTarget: z.string(), subject: z.string().optional(), page: z.number().default(0), limit: z.number().default(20) });\nexport async function getBookletContent(rawExamTarget: string, rawSubject?: string, rawPage = 0, rawLimit = 20)`
    );
    gbk = gbk.replace(
        /const supabase = createClient\(\);/,
        `const parsed = GetBookletContentSchema.safeParse({ examTarget: rawExamTarget, subject: rawSubject, page: rawPage, limit: rawLimit });\n  if (!parsed.success) throw new Error("BAD_REQUEST");\n  const { examTarget, subject, page, limit } = parsed.data;\n  const supabase = createClient();`
    );
    fs.writeFileSync(path.join(dir, 'getBooklets.ts'), gbk);
}

// 6. adminConfig.ts
let acfg = fs.readFileSync(path.join(dir, 'adminConfig.ts'), 'utf-8');
if (!acfg.includes('import { z } from "zod"')) {
    acfg = `import { z } from "zod";\n` + acfg;
    acfg = acfg.replace(
        /throw new Error\("Unauthorized access."\);/,
        `throw new Error("UNAUTHORIZED");`
    );
    acfg = acfg.replace(
        /export async function updateAppConfig\(key: string, value: string\)/,
        `const UpdateAppConfigSchema = z.object({ key: z.string(), value: z.string() });\nexport async function updateAppConfig(rawKey: string, rawValue: string)`
    );
    acfg = acfg.replace(
        /const supabase = createClient\(\);/,
        `const parsed = UpdateAppConfigSchema.safeParse({ key: rawKey, value: rawValue });\n  if (!parsed.success) throw new Error("BAD_REQUEST");\n  const { key, value } = parsed.data;\n  const supabase = createClient();`
    );
    // Replace only the first occurrence for updateAppConfig
    fs.writeFileSync(path.join(dir, 'adminConfig.ts'), acfg);
}

console.log("Applied Zod armor to public routes and adminConfig");
