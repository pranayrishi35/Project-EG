import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "ExamPilot — Smart Study Planner",
  description:
    "ExamPilot helps Indian students plan, track, and ace competitive exams with an intelligent study planner.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ExamPilot",
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {/* Fixed Header */}
        <Header />

        {/* Main scrollable content area, padded for header + bottom nav */}
        <main
          id="main-content"
          className="mx-auto max-w-lg"
          style={{
            paddingTop: "var(--header-height)",
            paddingBottom: "var(--nav-height)",
            minHeight: "100dvh",
          }}
        >
          {children}
        </main>

        {/* Fixed Bottom Navigation */}
        <BottomNav />
      </body>
    </html>
  );
}
