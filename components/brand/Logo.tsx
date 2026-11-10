import Link from "next/link";
import { brand } from "@/lib/brand";

export function Logo() {
  return (
    <Link href="/" className="logo">
      <img className="logo-mark" src="/logo.svg" alt="" />
      <span className="logo-word min-[760px]:max-[1099px]:sr-only">{brand.name}</span>
    </Link>
  );
}
