import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { Fraunces, JetBrains_Mono, Outfit } from "next/font/google";
import { AccountGate } from "@/components/auth/AccountGate";
import { AppShell } from "@/components/shell/AppShell";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { brand } from "@/lib/brand";
import { themeFromId } from "@/lib/theme/themes";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const instant = false;

export const metadata: Metadata = {
  title: {
    default: brand.name,
    template: `%s · ${brand.name}`,
  },
  description: brand.description,
};

export const viewport: Viewport = {
  colorScheme: "dark light",
  themeColor: "#141817",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const saved = (await cookies()).get("mosaic-theme")?.value;
  const theme = themeFromId(saved);

  return (
    <html
      lang="en"
      data-theme={theme.id}
      className={`${theme.mode === "dark" ? "dark " : ""}${outfit.variable} ${fraunces.variable} ${jetbrains.variable} h-full antialiased`}
      style={{ colorScheme: theme.mode }}
    >
      <body className="min-h-full">
        <TooltipProvider>
          <AppShell>
            <Suspense fallback={null}>
              <AccountGate>{children}</AccountGate>
            </Suspense>
          </AppShell>
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  );
}
