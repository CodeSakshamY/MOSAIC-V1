import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseBrowserEnv } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

function supabaseSecretKey() {
  const value = process.env.SUPABASE_SECRET_KEY;
  if (!value) {
    throw new Error(
      "SUPABASE_SECRET_KEY is not set. Add it to .env.local on the server. Do not prefix it with NEXT_PUBLIC_.",
    );
  }
  return value;
}

// Bypasses RLS. Callers must authorize first and say why the user-scoped client is not enough.
export function createAdminClient() {
  const { url } = supabaseBrowserEnv();
  return createClient<Database>(url, supabaseSecretKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
