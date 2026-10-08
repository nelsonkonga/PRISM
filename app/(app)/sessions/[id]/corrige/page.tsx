import type { Metadata } from "next";
import { Validation } from "@/components/screens/validation";

export const metadata: Metadata = { title: "Validation du corrigé" };

export default function Page() {
  return <Validation />;
}
