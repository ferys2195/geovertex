import type { Metadata } from "next";
import { HomeView } from "@/features/home";

export const metadata: Metadata = {
  title: "GeoVertex - Collaborative GIS & Spatial Digitizing Platform",
  description: "Olah data spasial lahan, edit vertex presisi, konversi UTM, dan generator PDF kartografi resmi berbasis cloud PostGIS.",
};

export default function Page() {
  return <HomeView />;
}
