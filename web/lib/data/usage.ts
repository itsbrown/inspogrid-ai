"use client";

import { createClient } from "@/lib/supabase/client";
import { FREE_TIER_IMPORTS_PER_MONTH } from "@/lib/constants/limits";
import { requireUserId, resolveDataMode } from "@/lib/data/provider";
import type { Plan } from "@/lib/types/database";

function currentMonth(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

export interface UsageCheckResult {
  allowed: boolean;
  used: number;
  limit: number;
  message?: string;
}

export async function checkImportLimit(plan: Plan = "free"): Promise<UsageCheckResult> {
  if ((await resolveDataMode()) === "local") {
    return { allowed: true, used: 0, limit: Infinity };
  }

  if (plan !== "free") {
    return { allowed: true, used: 0, limit: Infinity };
  }

  const userId = await requireUserId();
  const supabase = createClient();
  const month = currentMonth();

  const { data } = await supabase
    .from("usage_counters")
    .select("imports")
    .eq("user_id", userId)
    .eq("month", month)
    .maybeSingle();

  const used = data?.imports ?? 0;
  const limit = FREE_TIER_IMPORTS_PER_MONTH;

  if (used >= limit) {
    return {
      allowed: false,
      used,
      limit,
      message: `Free plan limit: ${limit} imports per month. Upgrade to Pro for unlimited.`,
    };
  }

  return { allowed: true, used, limit };
}

export async function incrementImports(count: number): Promise<void> {
  if ((await resolveDataMode()) === "local") return;

  const userId = await requireUserId();
  const supabase = createClient();
  const month = currentMonth();

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