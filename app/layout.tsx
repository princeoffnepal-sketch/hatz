import type { Metadata, Viewport } from "next";
import { Instrument_Sans, Instrument_Serif } from "next/font/google";
import { Suspense } from "react";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CartProvider } from "@/components/cart/CartProvider";
import { CartView } from "@/components/cart/CartView";
import { Footer } from "@/components/layout/Footer";
import { Header, ServiceStrip } from "@/components/layout/Header";
import { MotionProvider } from "@/components/providers/MotionProvider";
import { site } from "@/config/site";
import "./globals.css";
import { AnalyticsBridge } from "@/components/admin/AnalyticsBridge";

const sans = Instrument_Sans({ subsets: ["latin"], variable: "--font-instrument-sans", display: "swap" });
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", variable: "--font-instrument-serif", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} · Made-to-order hats`, template: `%s · ${site.name}` },
  description: site.shortDescription,
  robots: { index: false, follow: false },
  openGraph: { siteName: site.name, type: "website" },
};

export const viewport: Viewport = {
  themeColor: "#f7f5f0",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body className="min-h-dvh">
        <a
          href="#main"
          className="sr-only z-50 bg-ink px-4 py-3 text-ivory focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
        >
          Skip to content
        </a>
        <MotionProvider>
          <AnalyticsBridge />
          <CartProvider>
            <ServiceStrip />
            <Header />
            <main id="main" tabIndex={-1} className="outline-none">
              {children}
            </main>
            <Footer />
            <CartDrawer>
              <Suspense fallback={<p className="p-5 text-sm text-ink-soft">Loading your bag…</p>}>
                <CartView variant="drawer" />
              </Suspense>
            </CartDrawer>
          </CartProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
