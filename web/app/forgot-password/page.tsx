"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { mapAuthError, withNextParam } from "@/lib/auth/errors";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/utils";
import { Mail } from "lucide-react";

function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!isSupabaseConfigured()) {
      setError("Password reset is unavailable in demo mode.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback?next=/login`
        : undefined;

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (resetError) {
      setError(mapAuthError(resetError.message));
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-sm text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <Mail className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold text-stone-900">Check your email</h1>
        <p className="mt-3 text-sm text-stone-600">
          If an account exists for <span className="font-medium text-stone-900">{email}</span>,
          we sent a link to reset your password.
        </p>
        <Link href={withNextParam("/login", searchParams.get("next"))} className="mt-6 inline-block">
          <Button className="w-full min-w-[200px]">Back to sign in</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-stone-900">Forgot password</h1>
      <p className="mt-1 text-sm text-stone-500">
        Enter your email and we&apos;ll send a reset link.
      </p>
      <form onSubmit={handleReset} className="mt-6 space-y-4">
        <div>
          <label htmlFor="forgot-email" className="text-sm font-medium text-stone-700">
            Email
          </label>
          <input
            id="forgot-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
            required
          />
        </div>
        {error && (
          <p className="text-sm text-rose-600" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Sending…" : "Send reset link"}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-stone-500">
        <Link
          href={withNextParam("/login", searchParams.get("next"))}
          className="text-rose-600 hover:underline"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <Suspense fallback={<div className="text-sm text-stone-500">Loading…</div>}>
        <ForgotPasswordForm />
      </Suspense>
    </div>
  );
}
