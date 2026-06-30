"use client";

import type { ImageAsset, Project } from "@/lib/types/database";
import { DEFAULT_GRID_SETTINGS } from "@/lib/types/database";

const PROJECTS_KEY = "inspogrid_projects";
const IMAGES_KEY = "inspogrid_images";
const DEMO_USER_ID = "demo-user";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getLocalProjects(): Project[] {
  return read<Project[]>(PROJECTS_KEY, []);
}

export function getLocalProject(id: string): Project | undefined {
  return getLocalProjects().find((p) => p.id === id);
}

export function createLocalProject(name: string, description?: string): Project {
  const now = new Date().toISOString();
  const project: Project = {
    id: crypto.randomUUID(),
    user_id: DEMO_USER_ID,
    name,
    description: description ?? null,
    grid_settings: DEFAULT_GRID_SETTINGS,
    created_at: now,
    updated_at: now,
  };
  const projects = getLocalProjects();
  projects.unshift(project);
  write(PROJECTS_KEY, projects);
  return project;
}

export function updateLocalProject(id: string, patch: Partial<Project>): Project | undefined {
  const projects = getLocalProjects();
  const index = projects.findIndex((p) => p.id === id);
  if (index === -1) return undefined;
  projects[index] = {
    ...projects[index],
    ...patch,
    updated_at: new Date().toISOString(),
  };
  write(PROJECTS_KEY, projects);
  return projects[index];
}

export function deleteLocalProject(id: string) {
  write(
    PROJECTS_KEY,
    getLocalProjects().filter((p) => p.id !== id)
  );
  write(
    IMAGES_KEY,
    getLocalImages().filter((img) => img.project_id !== id)
  );
}

export function getLocalImages(projectId?: string): ImageAsset[] {
  const images = read<ImageAsset[]>(IMAGES_KEY, []);
  if (!projectId) return images;
  return images
    .filter((img) => img.project_id === projectId)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function addLocalImages(projectId: string, files: File[]): ImageAsset[] {
  const existing = getLocalImages();
  const startOrder = getLocalImages(projectId).length;
  const newImages: ImageAsset[] = files.map((file, i) => ({
    id: crypto.randomUUID(),
    user_id: DEMO_USER_ID,
    project_id: projectId,
    source_url: null,
    storage_path: null,
    title: file.name.replace(/\.[^.]+$/, ""),
    description: null,
    tags: [],
    platform: "manual",
    saved_at: new Date().toISOString(),
    selected: true,
    sort_order: startOrder + i,
    created_at: new Date().toISOString(),
    preview_url: URL.createObjectURL(file),
  }));
  write(IMAGES_KEY, [...existing, ...newImages]);
  return newImages;
}

export function updateLocalImageOrder(projectId: string, orderedIds: string[]) {
  const all = getLocalImages();
  const updated = all.map((img) => {
    if (img.project_id !== projectId) return img;
    const order = orderedIds.indexOf(img.id);
    return order === -1 ? img : { ...img, sort_order: order };
  });
  write(IMAGES_KEY, updated);
}

export function toggleLocalImageSelection(id: string, selected: boolean) {
  const all = getLocalImages();
  write(
    IMAGES_KEY,
    all.map((img) => (img.id === id ? { ...img, selected } : img))
  );
}

export function removeLocalImage(id: string) {
  write(IMAGES_KEY, getLocalImages().filter((img) => img.id !== id));
}