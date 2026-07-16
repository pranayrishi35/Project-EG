import type { Metadata, Viewport } from "next";
import "./globals.css";
import { checkIsAdmin } from "@/lib/adminAuth";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Sidebar from "@/components/Sidebar";
import FloatingAssistant from "@/components/FloatingAssistant";
import { LegalFooter } from "@/components/LegalFooter";
import { createClient } from "@/utils/supabase/server";
import dynamic from 'next/dynamic';
const ReticleDev = dynamic(() => import('./reticle-dev').then(m => m.ReticleDev), { ssr: false });

export const metadata: Metadata = {
  metadataBase: new URL('https://exampilot.in'),
  title: "ExamPilot — Smart Study Planner",
  description: "ExamPilot helps Indian students plan, track, and ace competitive exams with an intelligent study planner.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ExamPilot",
  },
  icons: {
    icon: "/icon-192x192.png",
    apple: "/icon-192x192.png",
  },
  openGraph: {
    title: "ExamPilot — Smart Study Planner",
    description: "Elite AI Defense Exam Preparation",
    siteName: "ExamPilot",
    url: "https://exampilot.in",
    type: "website",
    images: [
      {
        url: "/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "ExamPilot Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ExamPilot — Smart Study Planner",
    description: "Elite AI Defense Exam Preparation",
    images: ["/icon-512x512.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0f172a",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  
  const isAdmin = await checkIsAdmin(user?.email);

  return (
    <html lang="en">
      <body>
        {process.env.NODE_ENV === 'development' ? <ReticleDev /> : null}
        {/* Fixed Header */}
        <Header />

        {/* Fixed Sidebar for md+ */}
        <Sidebar isAdmin={isAdmin} />

        {/* Main scrollable content area, padded for header + bottom nav/sidebar */}
        <main
          id="main-content"
          className="mx-auto max-w-lg md:max-w-5xl md:pl-64"
          style={{
            paddingTop: "var(--header-height)",
          }}
        >
          <div className="pb-16 md:pb-0 min-h-[100dvh] flex flex-col">
            <div className="flex-1">
              {children}
            </div>
            <LegalFooter />
          </div>
        </main>

        {/* Fixed Bottom Navigation for mobile */}
        <div className="md:hidden">
          <BottomNav isAdmin={isAdmin} />
        </div>
        
        {/* Floating AI Tutor */}
        <FloatingAssistant />
      </body>
    </html>
  );
}
