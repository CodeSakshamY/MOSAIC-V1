import Link from "next/link";
import { brand } from "@/lib/brand";

export function Logo() {
  return (
    <Link href="/" className="logo">
      <span className="logo-mark" aria-hidden="true" />
      <span className="logo-word">{brand.name}</span>
    </Link>
  );
}
