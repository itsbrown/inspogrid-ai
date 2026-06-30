import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Grid3x3 } from "lucide-react";

export function Navbar() {
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
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">Get started</Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}