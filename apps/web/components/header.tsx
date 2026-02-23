"use client";

import Link from "next/link";
import { ExternalLinkIcon } from "lucide-react";
import { LoginButton } from "./login-button";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  return (
    <header className="border-b">
      <div className="max-w-screen-xl mx-auto flex items-center justify-between px-4 sm:px-6 h-14">
        <div className="flex items-center gap-6">
          <Link href="/" className="group font-mono text-sm tracking-tight">
            <span className="font-bold transition-colors group-hover:text-foreground/70">
              canonical
            </span>
            <span className="font-medium text-muted-foreground transition-colors group-hover:text-foreground/50">
              .registry
            </span>
          </Link>

          <nav className="hidden sm:flex items-center gap-1">
            <Link
              href="/wallet"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md px-3 py-1.5"
            >
              Wallet
            </Link>
            <Link
              href="/prove"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md px-3 py-1.5"
            >
              Prove
            </Link>
            <Link
              href="https://curate-fund-docs.vercel.app/docs"
              target="_blank"
              className="text-sm flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors rounded-md px-3 py-1.5"
            >
              Docs
              <ExternalLinkIcon className="w-3 h-3" />
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <LoginButton />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
