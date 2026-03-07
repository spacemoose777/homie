import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/contexts/AuthContext";
import { PWAInstallProvider } from "@/contexts/PWAInstallContext";
import UpdatePrompt from "@/components/layout/UpdatePrompt";
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
          </AuthProvider>
        </PWAInstallProvider>
      </body>
    </html>
  );
}
