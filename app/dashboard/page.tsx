import type { Metadata } from "next";
import { DashboardView } from "@/features/dashboard";

export const metadata: Metadata = {
  title: "Dashboard Proyek - GeoVertex",
  description: "Kelola proyek GIS, undang tim kolaborasi, dan simpan geometri vertex otomatis di Supabase PostGIS Cloud.",
};

export default function Page() {
  return <DashboardView />;
}
