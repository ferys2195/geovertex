import type { Metadata } from "next";
import { ProjectEditorView } from "@/features/project";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Editor Proyek ${id} - GeoVertex`,
    description: "Editor peta cloud spasial kolaboratif GeoVertex.",
  };
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <ProjectEditorView projectId={id} />;
}
