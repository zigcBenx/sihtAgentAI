"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  userName?: string | null;
}

export function Header({ userName }: HeaderProps) {
  return (
    <header className="border-b border-surface-border/60 bg-surface/70 backdrop-blur-md sticky top-0 z-50">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/dashboard" className="text-lg font-bold text-foreground">
          Šiht<span className="bg-gradient-to-r from-accent to-accent-light bg-clip-text text-transparent">Agent</span> AI
        </Link>
        <div className="flex items-center gap-4">
          {userName && (
            <span className="text-sm text-muted">{userName}</span>
          )}
          <Button
            variant="ghost"
            onClick={() => signOut({ redirectTo: "/" })}
          >
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
