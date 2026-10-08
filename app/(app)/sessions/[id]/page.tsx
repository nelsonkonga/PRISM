import type { Metadata } from "next";
import { Suspense } from "react";
import { SessionSpace } from "@/components/screens/session-space";

export const metadata: Metadata = { title: "Espace de session" };

export default function Page() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Ouverture de la session…</p>}>
      <SessionSpace />
    </Suspense>
  );
}
