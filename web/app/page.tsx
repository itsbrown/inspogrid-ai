"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { ArrowRight, Grid3x3, Sparkles, Upload } from "lucide-react";

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function joinWaitlist(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/60 via-stone-50 to-white">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 pb-20 pt-16">
        <section className="text-center">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-rose-100 px-4 py-1 text-sm font-medium text-rose-800">
            <Sparkles className="h-4 w-4" />
            MVP — Pinterest + manual upload
          </p>
          <h1 className="text-balance text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl">
            Turn scattered inspiration into{" "}
            <span className="text-rose-600">print-ready mood boards</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-stone-600">
            Pull saved pins from Pinterest, upload your own images, arrange professional
            contact-sheet grids, and export labeled PDFs optimized for framing.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/projects/new">
              <Button size="lg">
                Start a mood board
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" size="lg">
                Open dashboard
              </Button>
            </Link>
          </div>
        </section>

        <section className="mt-20 grid gap-6 sm:grid-cols-3">
          {[
            {
              icon: Upload,
              title: "Multi-source import",
              desc: "Manual upload now. Pinterest extension and Etsy OAuth coming in V1.",
            },
            {
              icon: Grid3x3,
              title: "Contact-sheet grids",
              desc: "4×6, 5×5, and 8×10 frame layouts with drag-and-drop reordering.",
            },
            {
              icon: Sparkles,
              title: "AI filtering (V1)",
              desc: "Semantic search like “neutral rustic kitchens for 8×10 frames.”",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-stone-900">{title}</h3>
              <p className="mt-2 text-sm text-stone-600">{desc}</p>
            </div>
          ))}
        </section>

        <section className="mx-auto mt-20 max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-900">Join the waitlist</h2>
          <p className="mt-1 text-sm text-stone-500">Get notified when Pro features launch.</p>
          <form onSubmit={joinWaitlist} className="mt-4 flex gap-2">
            <input
              type="email"
              required
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
            <Button type="submit" disabled={status === "loading"}>
              Join
            </Button>
          </form>
          {status === "done" && (
            <p className="mt-2 text-sm text-green-600">You&apos;re on the list!</p>
          )}
          {status === "error" && (
            <p className="mt-2 text-sm text-rose-600">Something went wrong. Try again.</p>
          )}
        </section>
      </main>
    </div>
  );
}