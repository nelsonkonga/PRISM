"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import {
  ChevronDown,
  CircleHelp,
  LogOut,
  Menu,
  Plus,
  Settings,
  X,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useStore } from "@/lib/store";
import { cn } from "cn";

const links = [
  { href: "/tableau-de-bord", label: "Tableau de bord" },
  { href: "/sessions", label: "Sessions" },
  { href: "/sessions?vue=historique", label: "Historique" },
  { href: "/aide", label: "Aide" },
];

function isActive(pathname: string, historique: boolean, href: string) {
  if (href === "/sessions?vue=historique") {
    return pathname === "/sessions" && historique;
  }
  if (href === "/sessions") {
    return pathname === "/sessions" && !historique;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: ReactNode }) {
  return <Shell>{children}</Shell>;
}

function Navigation({
  className,
  onNavigate,
}: {
  className: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const historique = useSearchParams().get("vue") === "historique";

  return (
    <nav className={className}>
      {links.map((link) => {
        const active = isActive(pathname, historique, link.href);
        return (
          <Link
            key={link.label}
            href={link.href}
            onClick={onNavigate}
            className={cn(
              "rounded-md px-3 py-2 text-sm text-[#3d5270] hover:text-[#1e50a0]",
              active && "font-semibold text-[#1e50a0] shadow-[inset_0_-2px_0_0_#1e50a0]",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const { ready, user, logout } = useStore();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const authed = Boolean(ready && user);

  useEffect(() => {
    if (ready && !user) router.replace("/");
  }, [ready, user, router]);

  return (
    <div className="flex min-h-screen flex-col">
      {authed && user ? (
        <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur">
          <div className="mx-auto flex h-16 w-full max-w-[1280px] items-center gap-4 px-4 sm:px-8">
            <Link href="/tableau-de-bord" className="shrink-0" aria-label="PRISM, tableau de bord">
              <Logo />
            </Link>
            <Suspense fallback={<div className="ml-2 hidden h-9 lg:block" />}>
              <Navigation className="ml-2 hidden items-center gap-1 lg:flex" />
            </Suspense>
            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <Button
                className="hidden h-9 sm:inline-flex"
                onClick={() => router.push("/sessions/nouvelle")}
              >
                <Plus />
                Nouvelle session
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg py-1 pr-1 pl-1 hover:bg-muted">
                  <span className="grid size-8 place-items-center rounded-full bg-[#1e50a0] text-xs font-semibold text-white">
                    CM
                  </span>
                  <span className="hidden text-left leading-tight sm:block">
                    <span className="block text-sm font-medium">{user.name}</span>
                    <span className="block text-xs text-muted-foreground">{user.role}</span>
                  </span>
                  <ChevronDown className="size-4 text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem onClick={() => router.push("/parametres")}>
                    <Settings />
                    Paramètres
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/aide")}>
                    <CircleHelp />
                    Aide
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      logout();
                      router.replace("/");
                    }}
                  >
                    <LogOut />
                    Se déconnecter
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="outline"
                size="icon"
                className="lg:hidden"
                aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
                onClick={() => setOpen((value) => !value)}
              >
                {open ? <X /> : <Menu />}
              </Button>
            </div>
          </div>
          {open ? (
            <div className="border-t border-border bg-white px-4 py-3 lg:hidden">
              <Suspense fallback={null}>
                <Navigation
                  className="flex flex-col gap-1"
                  onNavigate={() => setOpen(false)}
                />
              </Suspense>
              <Button className="mt-2" onClick={() => router.push("/sessions/nouvelle")}>
                <Plus />
                Nouvelle session
              </Button>
            </div>
          ) : null}
        </header>
      ) : (
        <div className="min-h-screen bg-background" />
      )}
      <main
        hidden={!authed}
        className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 sm:px-8 sm:py-8"
      >
        {children}
      </main>
      {authed ? (
        <footer className="border-t border-border bg-white">
          <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-2 px-4 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <p>© 2025 PRISM — Correction assistée réservée aux personnels de l’établissement.</p>
            <p className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-500" />
              Moteur opérationnel
              <span aria-hidden>·</span>
              Hébergement UE
            </p>
          </div>
        </footer>
      ) : null}
    </div>
  );
}
