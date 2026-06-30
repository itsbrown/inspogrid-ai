"use client";

import { getSessionUser } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/utils";

export type DataMode = "supabase" | "local";

export async function resolveDataMode(): Promise<DataMode> {
  if (!isSupabaseConfigured()) return "local";
  const user = await getSessionUser();
  return user ? "supabase" : "local";
}

export async function requireUserId(): Promise<string> {
  const user = await getSessionUser();
  if (!user) throw new Error("Authentication required");
  return user.id;
}