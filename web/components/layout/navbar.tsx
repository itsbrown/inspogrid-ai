"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getSessionUser, signOut } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/utils";
import { Grid3x3, LogOut } from "lucide-react";

export function Navbar() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const supabaseMode = isSupabaseConfigured();

  useEffect(() => {
    if (!supabaseMode) return;
    getSessionUser().then((user) => setEmail(user?.email ?? null));
  }, [supabaseMode]);

  async function handleSignOut() {
    await signOut();
    setEmail(null);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="border-b border-stone-200 bg-white/80 backdrop-blur sticky top-0 z-50">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-stone-900">
          <Grid3x3 className="h-5 w-5 text-rose-600" />
          InspoGrid AI
        </Link>
        <nav className="flex items-center gap-3">
          <Link href="/dashboard" className="text-sm text-stone-600 hover:text-stone-900">
            Dashboard
          </Link>
          {email ? (
            <>
              <span className="hidden text-sm text-stone-500 sm:inline">{email}</span>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Get started</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}