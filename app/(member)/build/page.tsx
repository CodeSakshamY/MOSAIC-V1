import type { Metadata } from "next";
import { SectionPage } from "@/components/shell/SectionPage";

export const instant = false;

export const metadata: Metadata = {
  title: "Build",
};

export default function BuildPage() {
  return (
    <SectionPage
      title="Build"
      lede="Publish a project, a progress update, an idea, a request for help, or a milestone. The forms arrive with the project tools."
    />
  );
}
