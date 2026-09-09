"use client";

import { useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/auth/password-input";
import { mapAuthError, safeNextPath, withNextParam } from "@/lib/auth/errors";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/utils";
import { Mail } from "lucide-react";

const MIN_PASSWORD_LENGTH = 6;

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = useMemo(
    () => safeNextPath(searchParams.get("next")),
    [searchParams]
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!isSupabaseConfigured()) {
      router.push(next);
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      setLoading(false);
      return;
    }

    if (confirmPassword && password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) {
      setError(mapAuthError(authError.message));
      setLoading(false);
      return;
    }

    if (data.session) {
      router.push(next);
      router.refresh();
      return;
    }

    // Email confirmation required — stay on page with clear next step
    setCheckEmail(true);
    setLoading(false);
  }

  if (checkEmail) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-sm text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <Mail className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold text-stone-900">Check your email</h1>
        <p className="mt-3 text-sm text-stone-600">
          We sent a confirmation link to <span className="font-medium text-stone-900">{email}</span>.
          Open it to activate your account, then sign in.
        </p>
        <Link href={withNextParam("/login", searchParams.get("next"))} className="mt-6 inline-block">
          <Button className="w-full min-w-[200px]">Back to sign in</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-stone-900">Create account</h1>
      <p className="mt-1 text-sm text-stone-500">Start building print-ready mood boards</p>
      <form onSubmit={handleSignup} className="mt-6 space-y-4">
        <div>
          <label htmlFor="signup-email" className="text-sm font-medium text-stone-700">
            Email
          </label>
          <input
            id="signup-email"
            data-testid="signup-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
            required={isSupabaseConfigured()}
          />
        </div>
        <PasswordInput
          id="signup-password"
          data-testid="signup-password"
          label="Password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={MIN_PASSWORD_LENGTH}
          required={isSupabaseConfigured()}
          hint={`At least ${MIN_PASSWORD_LENGTH} characters`}
        />
        <PasswordInput
          id="signup-password-confirm"
          data-testid="signup-password-confirm"
          label="Confirm password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          minLength={MIN_PASSWORD_LENGTH}
          required={isSupabaseConfigured()}
        />
        {error && (
          <p className="text-sm text-rose-600" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating account…" : "Get started free"}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-stone-500">
        Already have an account?{" "}
        <Link
          href={withNextParam("/login", searchParams.get("next"))}
          className="text-rose-600 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <Suspense fallback={<div className="text-sm text-stone-500">Loading…</div>}>
        <SignupForm />
      </Suspense>
    </div>
  );
}
