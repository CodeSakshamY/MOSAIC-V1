import { SectionPage } from "@/components/shell/SectionPage";
import { brand } from "@/lib/brand";

export default function NotFound() {
  return (
    <SectionPage
      title="Page not found"
      lede={`That address is not part of ${brand.name}.`}
    />
  );
}
