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
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });
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
  const { data: { user } } = await supabase.auth.getUser();
  
  const isAdmin = await checkIsAdmin(user?.email);

  return (
    <html lang="en">
      {/* LIGHTHOUSE FIX: Eliminate CLS by applying next/font/google class directly */}
      <body className={`${inter.className} antialiased bg-slate-50 text-slate-900`}>
          {process.env.NODE_ENV === 'development' ? <ReticleDev /> : null}
          <div className="flex min-h-screen relative w-full">
            {/* Sticky Sidebar for md+ */}
            <Sidebar isAdmin={isAdmin} />

            <div className="flex-1 flex flex-col min-w-0 w-full">
              {/* Sticky Header */}
              <Header />

              {/* Main scrollable content area */}
              <main
                id="main-content"
                className="w-full relative"
              >
                <div className="pb-24 md:pb-0 min-h-[calc(100vh-var(--header-height))] flex flex-col">
                  <div className="flex-1 w-full relative">
                    {children}
                  </div>
                  <LegalFooter />
                </div>
              </main>
            </div>
          </div>

          {/* Fixed Bottom Navigation for mobile */}
          <div className="flex md:hidden">
            <BottomNav isAdmin={isAdmin} />
          </div>
          
          {/* Floating AI Tutor */}
          <FloatingAssistant />
      </body>
    </html>
  );
}
