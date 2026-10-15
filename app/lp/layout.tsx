import "../globals.css";
import type { Metadata } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import { ConvexClientProvider } from "@/components/providers/ConvexClientProvider";
import { ICON_FONT_HREF } from "@/lib/icons";
import { metaPixelJs } from "@/lib/third-party";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const FB_PIXEL_ID = "929394893194723";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={inter.variable}>
      <head>
        <link href={ICON_FONT_HREF} rel="stylesheet" />
      </head>
      <body className="min-h-screen">
        <Script id="fb-pixel-lp" strategy="afterInteractive">
          {metaPixelJs(FB_PIXEL_ID)}
        </Script>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
