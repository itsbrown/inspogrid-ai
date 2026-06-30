import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/utils";

export async function POST(request: Request) {
  const { email } = await request.json();
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    console.log("[waitlist] demo mode:", email);
    return NextResponse.json({ ok: true, mode: "demo" });
  }

  const supabase = await createClient();
  const { error } = await supabase.from("waitlist").insert({ email });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}