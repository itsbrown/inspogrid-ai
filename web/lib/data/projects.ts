"use client";

import { createClient } from "@/lib/supabase/client";
import { resolveDataMode } from "@/lib/data/provider";
import {
  createLocalProject,
  deleteLocalProject,
  getLocalProject,
  getLocalProjects,
  updateLocalProject,
} from "@/lib/store/local-store";
import type { GridSettings, Project } from "@/lib/types/database";
import { DEFAULT_GRID_SETTINGS } from "@/lib/types/database";
import { requireUserId } from "@/lib/data/provider";

export async function listProjects(): Promise<Project[]> {
  if ((await resolveDataMode()) === "local") {
    return getLocalProjects();
  }

  const userId = await requireUserId();
  const supabase = createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(normalizeProject);
}

export async function getProject(id: string): Promise<Project | null> {
  if ((await resolveDataMode()) === "local") {
    return getLocalProject(id) ?? null;
  }

  const userId = await requireUserId();
  const supabase = createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? normalizeProject(data) : null;
}

export async function createProject(
  name: string,
  description?: string
): Promise<Project> {
  if ((await resolveDataMode()) === "local") {
    return createLocalProject(name, description);
  }

  const userId = await requireUserId();
  const supabase = createClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: userId,
      name: name.trim(),
      description: description?.trim() || null,
      grid_settings: DEFAULT_GRID_SETTINGS,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return normalizeProject(data);
}

export async function updateProject(
  id: string,
  patch: Partial<Pick<Project, "name" | "description" | "grid_settings">>
): Promise<Project> {
  if ((await resolveDataMode()) === "local") {
    const updated = updateLocalProject(id, patch);
    if (!updated) throw new Error("Project not found");
    return updated;
  }

  const userId = await requireUserId();
  const supabase = createClient();
  const { data, error } = await supabase
    .from("projects")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return normalizeProject(data);
}

export async function deleteProject(id: string): Promise<void> {
  if ((await resolveDataMode()) === "local") {
    deleteLocalProject(id);
    return;
  }

  const userId = await requireUserId();
  const supabase = createClient();
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}

function normalizeProject(row: Record<string, unknown>): Project {
  const grid = row.grid_settings as GridSettings | undefined;
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    name: row.name as string,
    description: (row.description as string | null) ?? null,
    grid_settings: grid ?? DEFAULT_GRID_SETTINGS,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}