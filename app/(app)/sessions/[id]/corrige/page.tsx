import type { Metadata } from "next";
import { Suspense } from "react";
import { Validation } from "@/components/screens/validation";

export const metadata: Metadata = { title: "Validation du corrigé" };

export default function Page() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Chargement du barème…</p>}>
      <Validation />
    </Suspense>
  );
}
