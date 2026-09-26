import { unstable_rethrow } from "next/navigation";
import { NextResponse } from "next/server";

import { homeForRole } from "@/lib/auth/paths";
import { getSessionUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        const user = await getSessionUser();
        const destination = user ? homeForRole(user.role) : "/login";
        return NextResponse.redirect(new URL(destination, origin));
      }
    } catch (error) {
      unstable_rethrow(error);
      return NextResponse.redirect(new URL("/login?error=auth", origin));
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth", origin));
}
