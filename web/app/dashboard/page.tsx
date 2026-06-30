"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/projects/project-card";
import type { Project } from "@/lib/types/database";
import { getLocalImages, getLocalProjects } from "@/lib/store/local-store";
import { Plus } from "lucide-react";

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    setProjects(getLocalProjects());
  }, []);

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Your mood boards</h1>
            <p className="mt-1 text-stone-500">Create, curate, and export contact-sheet PDFs</p>
          </div>
          <Link href="/projects/new">
            <Button data-testid="new-project-btn">
              <Plus className="h-4 w-4" />
              New project
            </Button>
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
            <p className="text-stone-600">No projects yet. Start with a manual upload mood board.</p>
            <Link href="/projects/new" className="mt-4 inline-block">
              <Button>Create your first project</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                imageCount={getLocalImages(project.id).length}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}