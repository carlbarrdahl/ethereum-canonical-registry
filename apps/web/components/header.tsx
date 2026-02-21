"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDownIcon, Menu } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet";
import { LoginButton } from "./login-button";
import { ThemeToggle } from "./theme-toggle";
import { createElement, useState } from "react";
import { ExternalLinkIcon } from "lucide-react";

const navLinks = [
  { label: "Strategies", path: "/strategies" },
  { label: "Projects", path: "/projects" },
  { label: "Docs", path: "https://curate-fund-docs.vercel.app/docs", icon: ExternalLinkIcon, target: "_blank" },
];

const curatorLinks = [
  { label: "New Strategy", path: "/strategies/create" },
  { label: "Wallet", path: "/wallet" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function isActive(path: string) {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  }

  return (
    <header className="border-b">
      <div className="max-w-screen-xl mx-auto flex items-center justify-between px-4 sm:px-6 h-14">
        <div className="flex items-center gap-4 sm:gap-8">
          {/* Logo */}
          <Link
            href="/"
            className="font-mono pt-2 font-bold text-sm tracking-tight border-2 border-foreground rounded-md px-3 py-1.5 hover:bg-foreground hover:text-background transition-colors"
          >
            support.eth curator
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ label, path, icon, target }) => (
              <Link
                href={path}
                key={path}
                target={target}
                className={cn(
                  "text-sm flex items-center text-muted-foreground hover:text-foreground transition-colors rounded-md px-3 py-1.5",
                  isActive(path) && "text-foreground font-medium bg-muted",
                )}
                >
                {label}
                {icon && createElement(icon, { 
className: "w-3.5 h-3.5 ml-1"                  
                })}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {/* Desktop Actions */}
          <div className="hidden sm:flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn("text-sm text-muted-foreground")}
                >
                  Curators
                  <ChevronDownIcon className="w-3.5 h-3.5 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {curatorLinks.map(({ label, path }) => (
                  <DropdownMenuItem key={path} asChild>
                    <Link href={path}>{label}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <LoginButton />
            <ThemeToggle />
          </div>

          {/* Mobile Menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-4 mt-8">
                {navLinks.map(({ label, path }) => (
                  <Link
                    href={path}
                    key={path}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "text-base text-muted-foreground hover:text-foreground transition-colors rounded-md px-3 py-2",
                      isActive(path) && "text-foreground font-medium bg-muted",
                    )}
                  >
                    {label}
                  </Link>
                ))}
                <div className="pt-4 border-t">
                  <p className="text-xs uppercase tracking-wider font-medium text-muted-foreground px-3 mb-2">
                    Curators
                  </p>
                  {curatorLinks.map(({ label, path }) => (
                    <Link
                      href={path}
                      key={path}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "block text-base text-muted-foreground hover:text-foreground transition-colors rounded-md px-3 py-2",
                        isActive(path) &&
                          "text-foreground font-medium bg-muted",
                      )}
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </nav>
              <div className="flex flex-col gap-4 mt-8 pt-8 border-t">
                <LoginButton />
                <ThemeToggle />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
