"use server";
import { z } from "zod";

import { getMockTest } from "./getMockTest";

/**
 * Wraps getMockTest to force the 'mini = true' constraint.
 * Keeps architectural distinction between Mock Tests and Mini Tests per instructions.
 */
const GetMiniTestSchema = z.object({ examTarget: z.string() });
export async function getMiniTest(rawExamTarget: string) {
  const parsed = GetMiniTestSchema.safeParse({ examTarget: rawExamTarget });
  if (!parsed.success) throw new Error("BAD_REQUEST");
  const { examTarget } = parsed.data;
  return getMockTest(examTarget, true);
}
