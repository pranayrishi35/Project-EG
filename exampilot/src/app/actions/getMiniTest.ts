"use server";

import { getMockTest } from "./getMockTest";

/**
 * Wraps getMockTest to force the 'mini = true' constraint.
 * Keeps architectural distinction between Mock Tests and Mini Tests per instructions.
 */
export async function getMiniTest(examTarget: string) {
  return getMockTest(examTarget, true);
}
