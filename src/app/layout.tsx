import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/contexts/AuthContext";
import { PWAInstallProvider } from "@/contexts/PWAInstallContext";
import UpdatePrompt from "@/components/layout/UpdatePrompt";
import OfflineBanner from "@/components/layout/OfflineBanner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Homie",
  description: "Household management for families",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Homie",
  },
};

export const viewport: Viewport = {
  themeColor: "#FF6B6B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // Without this, modern Chrome/Safari resize only the *visual* viewport when
  // the on-screen keyboard opens, not the layout viewport — so `fixed`
  // bottom sheets (e.g. CookPickerSheet) can end up stranded underneath the
  // keyboard. "resizes-content" makes the layout viewport shrink instead,
  // so plain fixed/inset-0 positioning stays above the keyboard everywhere.
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="min-h-screen">
        <PWAInstallProvider>
          <AuthProvider>
            {children}
            <UpdatePrompt />
            <OfflineBanner />
          </AuthProvider>
        </PWAInstallProvider>
      </body>
    </html>
  );
}
