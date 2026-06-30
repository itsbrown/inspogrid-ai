"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { createLocalProject } from "@/lib/store/local-store";

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const project = createLocalProject(name.trim(), description.trim() || undefined);
    router.push(`/projects/${project.id}`);
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <main className="mx-auto max-w-lg px-4 py-10">
        <h1 className="text-2xl font-bold text-stone-900">New mood board</h1>
        <p className="mt-1 text-stone-500">Give your project a name to get started</p>
        <form onSubmit={handleCreate} className="mt-8 space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div>
            <label className="text-sm font-medium text-stone-700">Project name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="2027 Vision Board"
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-stone-700">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kitchen renovation inspiration…"
              rows={3}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
            />
          </div>
          <Button type="submit" className="w-full" disabled={!name.trim()}>
            Create project
          </Button>
        </form>
      </main>
    </div>
  );
}