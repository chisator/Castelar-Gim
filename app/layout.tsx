import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ServiceWorkerUpdater } from "@/components/sw-updater";
import { Toaster } from "@/components/ui/sonner";
import { BottomNav } from "@/components/bottom-nav";
import Image from "next/image";
import "./globals.css";

export const metadata: Metadata = {
  title: "Castelar Gimnasio",
  description: "Castelar Gimnasio",
  icons: {
    icon: "/logo.webp",
    apple: "/logo.webp",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Castelar Gim",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#0ea5e9",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="light">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased relative min-h-screen`}
      >
        {/* Capas de Fondo */}
        <div className="fixed inset-0 pointer-events-none bg-gradient-to-br from-sky-200 to-white" style={{ zIndex: 0 }} />
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center" style={{ zIndex: 1, opacity: 0.25 }}>
          <Image src="/logo.webp" alt="Background Logo" width={800} height={800} className="object-contain" priority />
        </div>
        
        {/* Contenido Principal */}
        <div className="relative" style={{ zIndex: 10 }}>
          <ServiceWorkerUpdater />
          <div className="pb-16 md:pb-0">
            {children}
          </div>
          <Toaster />
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
