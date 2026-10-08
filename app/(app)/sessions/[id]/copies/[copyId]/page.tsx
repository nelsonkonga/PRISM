import type { Metadata } from "next";
import { Suspense } from "react";
import { CopyDetail } from "@/components/screens/copy-detail";

export const metadata: Metadata = { title: "Détail de la copie" };

export default function Page() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Ouverture de la copie…</p>}>
      <CopyDetail />
    </Suspense>
  );
}
