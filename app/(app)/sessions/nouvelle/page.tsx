import type { Metadata } from "next";
import { Suspense } from "react";
import { Wizard } from "@/components/screens/wizard";

export const metadata: Metadata = { title: "Nouvelle session" };

export default function Page() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Préparation de l’assistant…</p>}>
      <Wizard />
    </Suspense>
  );
}
