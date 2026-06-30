import Link from "next/link";
import type { Project } from "@/lib/types/database";
import { LayoutGrid } from "lucide-react";

interface ProjectCardProps {
  project: Project;
  imageCount?: number;
}

export function ProjectCard({ project, imageCount = 0 }: ProjectCardProps) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="group rounded-xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-rose-200 hover:shadow-md"
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
        <LayoutGrid className="h-5 w-5" />
      </div>
      <h3 className="font-semibold text-stone-900 group-hover:text-rose-700">
        {project.name}
      </h3>
      {project.description && (
        <p className="mt-1 line-clamp-2 text-sm text-stone-500">{project.description}</p>
      )}
      <p className="mt-3 text-xs text-stone-400">
        {imageCount} images · {project.grid_settings.preset}
      </p>
    </Link>
  );
}