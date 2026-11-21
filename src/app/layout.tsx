import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "عمارت رنگین — Color Manor",
  description:
    "بازی موبایلی مرتب‌سازی رنگ‌ها و بازسازی عمارت | Water-sort puzzle and mansion renovation game",
  applicationName: "Color Manor",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#FAE7C8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body className="antialiased">{children}
        <Toaster />
      </body>
    </html>
  );
}
