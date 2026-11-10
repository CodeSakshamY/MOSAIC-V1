import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ComponentGallery } from "@/components/dev/ComponentGallery";

export const metadata: Metadata = {
  title: "Components",
  robots: { index: false, follow: false },
};

export default function ComponentGalleryPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <ComponentGallery />;
}
