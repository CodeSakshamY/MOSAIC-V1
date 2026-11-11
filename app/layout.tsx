import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { AccountGate } from "@/components/auth/AccountGate";
import { AppShell } from "@/components/shell/AppShell";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { brand } from "@/lib/brand";
import { themeFromId } from "@/lib/theme/themes";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
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
      className={`${theme.mode === "dark" ? "dark " : ""}${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased`}
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
