import { cookies } from "next/headers";

export function isGuestUser(): boolean {
  const cookieStore = cookies();
  return cookieStore.get("onboarding_guest")?.value === "true";
}
