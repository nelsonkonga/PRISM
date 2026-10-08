import type { Metadata } from "next";
import { LoginForm } from "@/components/screens/login-form";

export const metadata: Metadata = {
  title: "Connexion",
};

export default function Page() {
  return <LoginForm />;
}
