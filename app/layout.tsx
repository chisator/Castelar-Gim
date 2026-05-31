import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ServiceWorkerUpdater } from "@/components/sw-updater";
import { Toaster } from "@/components/ui/sonner";
import { BottomNav } from "@/components/bottom-nav";
import { GlobalNotification } from "@/components/global-notification";
import { SplashOverlay } from "@/components/SplashOverlay";
import { getActiveNotification } from "@/app/actions/notification-actions";
import Image from "next/image";
import "./globals.css";

export const metadata: Metadata = {
  title: "Castelar Gimnasio",
  description: "Castelar Gimnasio",
  icons: {
    icon: "/Layer1000.svg",
    apple: "/Layer1000.svg",
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

import { ThemeProvider } from "@/components/theme-provider";



export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { notification } = await getActiveNotification();

  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased relative min-h-screen`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {/* Capas de Fondo */}
          <div className="fixed inset-0 pointer-events-none bg-background" style={{ zIndex: 0 }} />
          <div className="fixed inset-0 pointer-events-none flex items-center justify-center" style={{ zIndex: 1, opacity: 0.25 }}>
            <Image src="/Layer1000.svg" alt="Background Logo" width={800} height={800} className="object-contain" priority />
          </div>
          
          {/* Contenido Principal */}
          <div className="relative flex flex-col min-h-screen" style={{ zIndex: 10 }}>
            <ServiceWorkerUpdater />
            <GlobalNotification notification={notification || null} />
            <div className="flex-1 pb-16 md:pb-0">
              {children}
            </div>
            <Toaster />
            <BottomNav />
          </div>
          <SplashOverlay />
        </ThemeProvider>
      </body>
    </html>
  );
}
