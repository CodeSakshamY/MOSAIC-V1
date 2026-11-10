import { NavLinks } from "@/components/navigation/NavLinks";

export function MobileNav() {
  return (
    <nav className="mobile-nav" aria-label="Primary">
      <NavLinks placement="mobile" />
    </nav>
  );
}
