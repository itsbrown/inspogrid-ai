import { NextResponse } from "next/server";
import { createClient as createServerClient, type SupabaseClient } from "@supabase/supabase-js";
import { FREE_TIER_IMPORTS_PER_MONTH } from "@/lib/constants/limits";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getAuthedSupabase(accessToken: string): SupabaseClient {
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  });
}

type SupabaseServerClient = Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>;

// Union covering the dynamic clients we use (service-role style + SSR cookie client)
type AnySupabase = SupabaseClient | SupabaseServerClient;

async function getUserFromRequest(request: Request) {
  // Prefer explicit bearer token from extension (stored Supabase session)
  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
  let accessToken: string | null = null;
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    accessToken = authHeader.slice(7).trim();
  }
  // Fallback: custom header used by some flows
  if (!accessToken) {
    accessToken = request.headers.get("x-supabase-token");
  }

  if (accessToken) {
    const supabase = getAuthedSupabase(accessToken);
    const { data, error } = await supabase.auth.getUser();
    if (!error && data?.user) {
      return { user: data.user, supabase, accessToken };
    }
  }

  // Legacy shared key (dev / fallback only). Not primary.
  const apiKey = request.headers.get("x-extension-key");
  if (apiKey && process.env.EXTENSION_API_KEY && apiKey === process.env.EXTENSION_API_KEY) {
    // No user context with shared key — reject for production imports
    return null;
  }

  // Try cookie-based session (when popup fetches from same browser profile)
  try {
    const { createClient: createSsrClient } = await import("@/lib/supabase/server");
    const supabase: SupabaseServerClient = await createSsrClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      return { user, supabase, accessToken: null };
    }
  } catch {
    // ignore, no session
  }

  return null;
}

async function getProjectsForUser(supabase: AnySupabase, userId: string) {
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, description")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  return data ?? [];
}

async function checkAndReserveImportQuota(supabase: AnySupabase, userId: string, count: number) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .maybeSingle();

  const plan = (profile?.plan ?? "free") as "free" | "pro" | "team";
  if (plan !== "free") {
    return { allowed: true, used: 0, limit: Infinity };
  }

  const now = new Date();
  const month = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

  const { data: counter } = await supabase
    .from("usage_counters")
    .select("id, imports")
    .eq("user_id", userId)
    .eq("month", month)
    .maybeSingle();

  const used = counter?.imports ?? 0;
  const limit = FREE_TIER_IMPORTS_PER_MONTH;

  if (used + count > limit) {
    return {
      allowed: false,
      used,
      limit,
      message: `Free plan limit: ${limit} imports per month. You have ${limit - used} remaining.`,
    };
  }

  return { allowed: true, used, limit };
}

async function incrementImportCount(supabase: AnySupabase, userId: string, count: number) {
  const now = new Date();
  const month = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

  const { data: existing } = await supabase
    .from("usage_counters")
    .select("id, imports")
    .eq("user_id", userId)
    .eq("month", month)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("usage_counters")
      .update({ imports: existing.imports + count, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
  } else {
    await supabase.from("usage_counters").insert({
      user_id: userId,
      month,
      imports: count,
    });
  }
}

function pickBestImageUrl(rawUrl: string | null | undefined): string | null {
  if (!rawUrl) return null;
  try {
    // Pinterest often serves lower-res in src (236x, 474x). Upgrade path.
    // Common patterns: /236x/, /474x/, /736x/, /orig/ etc. Prefer larger or originals.
    let url = rawUrl;
    // Replace common low-res segments with higher-res variants when present
    url = url.replace(/\/236x\//, "/736x/");
    url = url.replace(/\/474x\//, "/736x/");
    // If we see a size param or known small, try to get originals when path contains /pinimg/
    if (url.includes("pinimg.com") && !url.includes("/originals/")) {
      // Some URLs are like https://i.pinimg.com/236x/ab/cd/ef/....jpg
      url = url.replace(/\/(236x|474x|736x)\//, "/originals/");
    }
    return url;
  } catch {
    return rawUrl;
  }
}

export async function GET(request: Request) {
  const auth = await getUserFromRequest(request);
  if (!auth?.user) {
    return NextResponse.json({ error: "Unauthorized. Log in to the web app or connect via extension." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  // Support listing projects for the popup picker via same endpoint for minimal surface
  if (searchParams.get("list") === "projects" || request.url.includes("projects")) {
    try {
      const projects = await getProjectsForUser(auth.supabase, auth.user.id);
      return NextResponse.json({ projects });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load projects";
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  // Default GET: basic status + projects (convenience for extension)
  try {
    const projects = await getProjectsForUser(auth.supabase, auth.user.id);
    return NextResponse.json({ ok: true, user: { id: auth.user.id, email: auth.user.email }, projects });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await getUserFromRequest(request);
  if (!auth?.user) {
    return NextResponse.json({ error: "Unauthorized. Please log into InspoGrid in your browser or provide a valid session token." }, { status: 401 });
  }

  const userId = auth.user.id;
  const supabase = auth.supabase;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { platform, boardName, pins, projectId } = body as {
    platform?: string;
    boardName?: string;
    pins?: unknown;
    projectId?: string;
  };

  if (!projectId || typeof projectId !== "string") {
    return NextResponse.json({ error: "projectId is required. Select a project in the extension popup." }, { status: 400 });
  }
  const pinsArr = Array.isArray(pins) ? pins : [];
  if (!platform || pinsArr.length === 0) {
    return NextResponse.json({ error: "Invalid payload. Expected platform and non-empty pins array." }, { status: 400 });
  }

  // Verify project belongs to user
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!project) {
    return NextResponse.json({ error: "Project not found or access denied." }, { status: 404 });
  }

  // Enforce usage limits (count = pinsArr.length)
  const quota = await checkAndReserveImportQuota(supabase, userId, pinsArr.length);
  if (!quota.allowed) {
    return NextResponse.json({ error: quota.message || "Import limit reached." }, { status: 429 });
  }

  // Fetch current max sort_order for append
  const { data: existingImages } = await supabase
    .from("image_assets")
    .select("sort_order")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .order("sort_order", { ascending: false })
    .limit(1);

  let startOrder = 0;
  if (existingImages && existingImages.length > 0) {
    startOrder = (existingImages[0].sort_order ?? 0) + 1;
  }

  const now = new Date().toISOString();
  const rowsToInsert = pinsArr.map((p: Record<string, unknown>, idx: number) => {
    const bestUrl = pickBestImageUrl(
      (p.imageUrl as string | undefined) ||
        (p.image_url as string | undefined) ||
        (p.src as string | undefined)
    );
    const rawTitle = (p.title as string | undefined) || (boardName as string | undefined) || "Pinterest pin";
    return {
      user_id: userId,
      project_id: projectId,
      source_url: bestUrl,
      title: rawTitle.toString().slice(0, 200),
      platform: "pinterest" as const,
      saved_at: now,
      selected: true,
      sort_order: startOrder + idx,
    };
  });

  const { data: inserted, error: insertError } = await supabase
    .from("image_assets")
    .insert(rowsToInsert)
    .select("id");

  if (insertError) {
    return NextResponse.json({ error: insertError.message || "Failed to save pins" }, { status: 500 });
  }

  await incrementImportCount(supabase, userId, pinsArr.length);

  console.log(`[extension] imported ${inserted?.length ?? pinsArr.length} pinterest pins to project ${projectId}`);

  return NextResponse.json({
    ok: true,
    imported: inserted?.length ?? pinsArr.length,
    projectId,
    boardName: (boardName as string | null) || null,
  });
}