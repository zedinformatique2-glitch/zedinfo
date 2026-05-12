import "../globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import { ConvexClientProvider } from "@/components/providers/ConvexClientProvider";
import { AdminShell } from "@/components/admin/AdminShell";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: "ZED Admin",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const authed = !!cookieStore.get("admin_session");

  return (
    <html lang="ar" dir="rtl" className={inter.variable}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0..1,0&display=block"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;700;900&display=swap"
          rel="stylesheet"
        />
        <style>{`html[lang="ar"] body { font-family: 'Cairo', var(--font-inter), sans-serif; }`}</style>
      </head>
      <body>
        <ConvexClientProvider>
          {authed ? (
            <AdminShell>{children}</AdminShell>
          ) : (
            <div className="min-h-screen">{children}</div>
          )}
        </ConvexClientProvider>
      </body>
    </html>
  );
}
