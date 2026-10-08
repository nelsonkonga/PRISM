import type { Metadata } from "next";
import { SessionSpace } from "@/components/screens/session-space";

export const metadata: Metadata = { title: "Espace de session" };

export default function Page() {
  return <SessionSpace />;
}
