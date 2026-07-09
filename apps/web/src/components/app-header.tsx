import Link from "next/link";
import { FileText } from "lucide-react";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";

export function AppHeader({ email }: { email?: string | null }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <FileText className="size-5 text-primary" aria-hidden />
          <span>Local-First Docs</span>
        </Link>
        <div className="flex items-center gap-3 text-sm">
          {email && (
            <span className="hidden text-muted-foreground sm:inline">{email}</span>
          )}
          <ThemeToggle />
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
