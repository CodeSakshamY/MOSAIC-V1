import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getMember, memberGate } from "@/lib/auth/session";
import { safeNext } from "@/lib/auth/validation";
import { supabaseBrowserEnv } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

function browserOrigin(request: Request) {
  const url = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  return host ? `${proto}://${host}` : url.origin;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = browserOrigin(request);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));
  const invalid = NextResponse.redirect(
    new URL("/profile?error=That+link+is+invalid+or+expired.", origin),
  );
  if (!code) return invalid;

  const cookieStore = await cookies();
  const pending: { name: string; value: string; options?: Record<string, unknown> }[] = [];
  const { url: supabaseUrl, key } = supabaseBrowserEnv();
  const supabase = createServerClient<Database>(supabaseUrl, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
          pending.push({ name, value, options });
        });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return invalid;

  const member = await getMember(supabase);
  const destination =
    next === "/reset-password" ? "/reset-password" : member ? (memberGate(member) ?? next) : "/profile";
  const response = NextResponse.redirect(new URL(destination, origin));
  pending.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });
  return response;
}
