import type { Metadata } from "next";
import { LoginForm } from "@/features/auth";

export const metadata: Metadata = {
  title: "Masuk Akun - GeoVertex",
  description: "Masuk untuk mengakses workspace GIS kolaboratif cloud GeoVertex Anda.",
};

export default function Page() {
  return <LoginForm />;
}
