import { createBrowserClient } from "@supabase/ssr";
import { supabaseBrowserEnv } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

export function createClient() {
  const { url, key } = supabaseBrowserEnv();
  return createBrowserClient<Database>(url, key);
}
