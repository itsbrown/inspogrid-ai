"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { ImageUploadZone } from "@/components/editor/image-upload-zone";
import { GridEditor } from "@/components/editor/grid-editor";
import { ExportPanel } from "@/components/editor/export-panel";
import { getProject, listImages, reorderImages, removeImage, updateProject, uploadImages } from "@/lib/data";
import type { GridSettings, ImageAsset, Project } from "@/lib/types/database";
import { ArrowLeft } from "lucide-react";

export default function ProjectEditorPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [images, setImages] = useState<ImageAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setError("");
    try {
      const [p, imgs] = await Promise.all([getProject(projectId), listImages(projectId)]);
      setProject(p);
      setImages(imgs);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load project");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleUpload(files: File[]) {
    setUploading(true);
    setError("");
    try {
      await uploadImages(projectId, files);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleReorder(orderedIds: string[]) {
    await reorderImages(projectId, orderedIds);
    await refresh();
  }

  async function handleRemove(id: string) {
    await removeImage(id);
    await refresh();
  }

  async function handleGridChange(settings: GridSettings) {
    await updateProject(projectId, { grid_settings: settings });
    await refresh();
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <p className="text-stone-500">Loading project…</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <div className="text-center">
          <p className="text-stone-600">Project not found.</p>
          <Link href="/dashboard" className="mt-2 inline-block text-rose-600 hover:underline">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Link
          href="/dashboard"
          className="mb-4 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-stone-900">{project.name}</h1>
          {project.description && (
            <p className="mt-1 text-stone-500">{project.description}</p>
          )}
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</p>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 font-semibold text-stone-900">Manual upload</h2>
              <p className="mb-4 text-sm text-stone-500">
                Drag images or use the InspoGrid Chrome extension on Pinterest boards.
              </p>
              <ImageUploadZone onFilesSelected={handleUpload} disabled={uploading} />
              {uploading && <p className="mt-3 text-sm text-stone-500">Uploading…</p>}
              {images.length > 0 && (
                <p className="mt-3 text-sm text-green-700" data-testid="import-count">
                  {images.length} image{images.length !== 1 ? "s" : ""} in library
                </p>
              )}
            </section>

            <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
              <GridEditor
                images={images}
                gridSettings={project.grid_settings}
                onReorder={handleReorder}
                onRemove={handleRemove}
              />
            </section>
          </div>

          <div>
            <ExportPanel
              projectId={projectId}
              projectName={project.name}
              images={images}
              gridSettings={project.grid_settings}
              onGridChange={handleGridChange}
              watermark
            />
          </div>
        </div>
      </main>
    </div>
  );
}