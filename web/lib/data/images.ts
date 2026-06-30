"use client";

import { createClient } from "@/lib/supabase/client";
import {
  MAX_FILE_SIZE_BYTES,
  MAX_IMAGES_PER_PROJECT_FREE,
  SIGNED_URL_TTL_SECONDS,
  STORAGE_BUCKET,
} from "@/lib/constants/limits";
import { incrementImports } from "@/lib/data/usage";
import { requireUserId, resolveDataMode } from "@/lib/data/provider";
import {
  addLocalImages,
  getLocalImages,
  removeLocalImage,
  updateLocalImageOrder,
} from "@/lib/store/local-store";
import type { ImageAsset } from "@/lib/types/database";

async function fileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function extensionFor(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && ["jpg", "jpeg", "png", "webp", "gif"].includes(fromName)) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  return map[file.type] ?? "jpg";
}

async function signedPreviewUrl(storagePath: string): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);
  if (error) return null;
  return data.signedUrl;
}

function normalizeImage(row: Record<string, unknown>, previewUrl?: string): ImageAsset {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    project_id: row.project_id as string,
    source_url: (row.source_url as string | null) ?? null,
    storage_path: (row.storage_path as string | null) ?? null,
    title: (row.title as string | null) ?? null,
    description: (row.description as string | null) ?? null,
    tags: (row.tags as string[]) ?? [],
    platform: row.platform as ImageAsset["platform"],
    saved_at: (row.saved_at as string | null) ?? null,
    selected: row.selected as boolean,
    sort_order: row.sort_order as number,
    created_at: row.created_at as string,
    preview_url: previewUrl,
  };
}

export async function listImages(projectId: string): Promise<ImageAsset[]> {
  if ((await resolveDataMode()) === "local") {
    return getLocalImages(projectId);
  }

  const userId = await requireUserId();
  const supabase = createClient();
  const { data, error } = await supabase
    .from("image_assets")
    .select("*")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);

  const images = await Promise.all(
    (data ?? []).map(async (row) => {
      const path = row.storage_path as string | null;
      const preview = path ? await signedPreviewUrl(path) : null;
      return normalizeImage(row, preview ?? undefined);
    })
  );

  return images;
}

const UNSUPPORTED_EXPORT_TYPES = new Set([
  "image/heic",
  "image/heif",
  "image/avif",
  "image/tiff",
]);

function isSupportedUpload(file: File): boolean {
  if (!file.type.startsWith("image/")) return false;
  if (file.size > MAX_FILE_SIZE_BYTES) return false;
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext && ["heic", "heif", "avif", "tiff", "tif"].includes(ext)) return false;
  if (UNSUPPORTED_EXPORT_TYPES.has(file.type)) return false;
  return true;
}

export async function uploadImages(
  projectId: string,
  files: File[]
): Promise<ImageAsset[]> {
  const validFiles = files.filter(isSupportedUpload);
  const skipped = files.length - validFiles.length;

  if (validFiles.length === 0) {
    throw new Error(
      skipped > 0
        ? "HEIC/HEIF/AVIF/TIFF not supported for PDF export. Please upload JPG or PNG."
        : "No valid image files (max 10 MB each, JPG/PNG/WebP/GIF)."
    );
  }

  if ((await resolveDataMode()) === "local") {
    return addLocalImages(projectId, validFiles);
  }

  const userId = await requireUserId();
  const existing = await listImages(projectId);
  if (existing.length + validFiles.length > MAX_IMAGES_PER_PROJECT_FREE) {
    throw new Error(
      `Project limit: ${MAX_IMAGES_PER_PROJECT_FREE} images on free plan.`
    );
  }

  const supabase = createClient();
  const startOrder = existing.length;
  const uploaded: ImageAsset[] = [];

  for (let i = 0; i < validFiles.length; i++) {
    const file = validFiles[i];
    const imageId = crypto.randomUUID();
    const ext = extensionFor(file);
    const storagePath = `${userId}/${projectId}/${imageId}.${ext}`;
    const hash = await fileHash(file);

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, file, { upsert: false, contentType: file.type });

    if (uploadError) throw new Error(uploadError.message);

    const { data, error: insertError } = await supabase
      .from("image_assets")
      .insert({
        id: imageId,
        user_id: userId,
        project_id: projectId,
        storage_path: storagePath,
        full_path: storagePath,
        content_hash: hash,
        title: file.name.replace(/\.[^.]+$/, ""),
        platform: "manual",
        saved_at: new Date().toISOString(),
        selected: true,
        sort_order: startOrder + i,
      })
      .select("*")
      .single();

    if (insertError) throw new Error(insertError.message);

    const preview = await signedPreviewUrl(storagePath);
    uploaded.push(normalizeImage(data, preview ?? undefined));
  }

  await incrementImports(validFiles.length);
  return uploaded;
}

export async function reorderImages(
  projectId: string,
  orderedIds: string[]
): Promise<void> {
  if ((await resolveDataMode()) === "local") {
    updateLocalImageOrder(projectId, orderedIds);
    return;
  }

  const userId = await requireUserId();
  const supabase = createClient();

  await Promise.all(
    orderedIds.map((id, index) =>
      supabase
        .from("image_assets")
        .update({ sort_order: index })
        .eq("id", id)
        .eq("project_id", projectId)
        .eq("user_id", userId)
    )
  );
}

export async function removeImage(imageId: string): Promise<void> {
  if ((await resolveDataMode()) === "local") {
    removeLocalImage(imageId);
    return;
  }

  const userId = await requireUserId();
  const supabase = createClient();

  const { data: image } = await supabase
    .from("image_assets")
    .select("storage_path")
    .eq("id", imageId)
    .eq("user_id", userId)
    .maybeSingle();

  if (image?.storage_path) {
    await supabase.storage.from(STORAGE_BUCKET).remove([image.storage_path]);
  }

  const { error } = await supabase
    .from("image_assets")
    .delete()
    .eq("id", imageId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}

export async function countImages(projectId: string): Promise<number> {
  const images = await listImages(projectId);
  return images.length;
}