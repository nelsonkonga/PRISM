import type { Metadata } from "next";
import { Suspense } from "react";
import { SessionList } from "@/components/screens/session-list";

export const metadata: Metadata = { title: "Sessions" };

export default function Page() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Chargement des sessions…</p>}>
      <SessionList />
    </Suspense>
  );
}
