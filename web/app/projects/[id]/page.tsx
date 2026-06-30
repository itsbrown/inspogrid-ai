"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { ImageUploadZone } from "@/components/editor/image-upload-zone";
import { GridEditor } from "@/components/editor/grid-editor";
import { ExportPanel } from "@/components/editor/export-panel";
import type { GridSettings, ImageAsset, Project } from "@/lib/types/database";
import {
  addLocalImages,
  getLocalImages,
  getLocalProject,
  removeLocalImage,
  updateLocalImageOrder,
  updateLocalProject,
} from "@/lib/store/local-store";
import { ArrowLeft } from "lucide-react";

export default function ProjectEditorPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [images, setImages] = useState<ImageAsset[]>([]);

  const refresh = useCallback(() => {
    setProject(getLocalProject(projectId) ?? null);
    setImages(getLocalImages(projectId));
  }, [projectId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function handleUpload(files: File[]) {
    addLocalImages(projectId, files);
    refresh();
  }

  function handleReorder(orderedIds: string[]) {
    updateLocalImageOrder(projectId, orderedIds);
    refresh();
  }

  function handleRemove(id: string) {
    removeLocalImage(id);
    refresh();
  }

  function handleGridChange(settings: GridSettings) {
    updateLocalProject(projectId, { grid_settings: settings });
    refresh();
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

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 font-semibold text-stone-900">Manual upload</h2>
              <p className="mb-4 text-sm text-stone-500">
                UC-09 fallback — drag images from your desktop. Pinterest extension import coming next.
              </p>
              <ImageUploadZone onFilesSelected={handleUpload} />
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