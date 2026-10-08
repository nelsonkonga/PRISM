import type { Metadata } from "next";
import { SettingsScreen } from "@/components/screens/settings";

export const metadata: Metadata = { title: "Paramètres" };

export default function Page() {
  return <SettingsScreen />;
}
