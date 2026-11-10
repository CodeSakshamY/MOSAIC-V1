import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { supabaseBrowserEnv } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

export async function createClient() {
  await connection();
  const cookieStore = await cookies();
  const { url, key } = supabaseBrowserEnv();

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // A Server Component cannot write cookies. proxy.ts refreshes the session.
        }
      },
    },
  });
}
