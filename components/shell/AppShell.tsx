import { DesktopSidebar } from "@/components/navigation/DesktopSidebar";
import { MobileNav } from "@/components/navigation/MobileNav";
import { TopBar } from "@/components/navigation/TopBar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell">
      <a className="skip-link" href="#content">
        Skip to content
      </a>
      <DesktopSidebar />
      <div className="shell-main">
        <TopBar />
        <main id="content" tabIndex={-1} className="shell-content">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
