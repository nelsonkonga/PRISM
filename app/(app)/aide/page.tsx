import type { Metadata } from "next";
import { HelpScreen } from "@/components/screens/help";

export const metadata: Metadata = { title: "Aide" };

export default function Page() {
  return <HelpScreen />;
}