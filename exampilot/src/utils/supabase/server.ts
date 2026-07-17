import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase client for use inside Server Components, Server Actions,
 * and Route Handlers.
 *
 * Reads and writes session cookies via next/headers so that the auth
 * state is always in sync between server and client renders.
 *
 * Usage (Server Component):
 *   const supabase = createClient();
 *   const { data: { user } } = await supabase.auth.getUser();
 *
 * Usage (Server Action / Route Handler):
 *   const supabase = createClient();
 *   const { error } = await supabase.from("study_plans").insert({ ... });
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
              })
            );
          } catch {
            // setAll called from a Server Component — cookies can only be
            // mutated from Server Actions or Route Handlers, so this is safe
            // to ignore here. The middleware keeps the session refreshed.
          }
        },
      },
    }
  );
}
