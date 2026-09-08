import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Returns the current Supabase access token for the logged-in user.
 * The Chrome extension uses this to authenticate imports without a shared key.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get the current session to return the access token (JWT)
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      return NextResponse.json({ error: "No active session token" }, { status: 401 });
    }

    return NextResponse.json({
      access_token: session.access_token,
      user: { id: user.id, email: user.email },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to get session";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
