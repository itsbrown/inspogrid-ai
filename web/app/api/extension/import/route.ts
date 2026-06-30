import { NextResponse } from "next/server";

/**
 * Receives Pinterest board imports from the Chrome extension.
 * MVP: returns accepted payload; wire to Supabase when auth is connected.
 */
export async function POST(request: Request) {
  const apiKey = request.headers.get("x-extension-key");
  if (apiKey !== process.env.EXTENSION_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { platform, boardName, pins } = body;

  if (!platform || !Array.isArray(pins)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  console.log(`[extension] import ${pins.length} pins from ${platform} board "${boardName}"`);

  return NextResponse.json({
    ok: true,
    imported: pins.length,
    message: "Extension import endpoint ready — connect to Supabase in V1",
  });
}