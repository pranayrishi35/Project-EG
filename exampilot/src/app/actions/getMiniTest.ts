"use server";
import { z } from "zod";

import { getMockTest } from "./getMockTest";

/**
 * Wraps getMockTest to force the 'mini = true' constraint.
 * Keeps architectural distinction between Mock Tests and Mini Tests per instructions.
 */
const GetMiniTestSchema = z.object({ examTarget: z.string(), focusMode: z.boolean().default(false) });
export async function getMiniTest(rawExamTarget: string, rawFocusMode: boolean = false) {
  const parsed = GetMiniTestSchema.safeParse({ examTarget: rawExamTarget, focusMode: rawFocusMode });
  if (!parsed.success) throw new Error("BAD_REQUEST");
  const { examTarget, focusMode } = parsed.data;
  return getMockTest(examTarget, true, focusMode);
}
