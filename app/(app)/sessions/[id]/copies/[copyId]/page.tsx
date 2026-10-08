import type { Metadata } from "next";
import { CopyDetail } from "@/components/screens/copy-detail";

export const metadata: Metadata = { title: "Détail de la copie" };

export default function Page() {
  return <CopyDetail />;
}
