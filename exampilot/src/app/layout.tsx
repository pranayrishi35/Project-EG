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
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });
// Design-system fonts (Phase 1): display = geometric headline face, mono = CBT
// timer / scores / credits only. Exposed as CSS vars for the Tailwind fontFamily tokens.
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], display: 'swap', variable: '--font-display' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-mono' });
const ReticleDev = dynamic(() => import('./reticle-dev').then(m => m.ReticleDev), { ssr: false });
// Smooth-scroll + custom-cursor craft layer (Phase 1). Client-only; self-disables
// on CBT routes, touch devices, and under prefers-reduced-motion.
const SmoothScrollProvider = dynamic(() => import('@/components/ui/SmoothScrollProvider'), { ssr: false });

export const metadata: Metadata = {
  metadataBase: new URL('https://exampilot-delta.vercel.app'),
  title: "ExamPilot | Smart AI Study Planner for Competitive Exams",
  description: "ExamPilot helps students plan, track, and ace competitive defense exams with an intelligent, personalized AI study planner and mock tests.",
  alternates: {
    canonical: '/',
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ExamPilot",
  },
  // Standard, non-deprecated PWA install hint. Next injects the legacy
  // apple-mobile-web-app-capable tag via appleWebApp above; this adds the
  // spec'd equivalent that Chrome/Android expect.
  other: {
    "mobile-web-app-capable": "yes",
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
  openGraph: {
    title: "ExamPilot | Smart AI Study Planner for Competitive Exams",
    description: "Elite AI Defense Exam Preparation and Mock Tests",
    siteName: "ExamPilot",
    url: "https://exampilot-delta.vercel.app",
    type: "website",
    images: [
      {
        url: "/icons/icon-512x512.png",
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
    images: ["/icons/icon-512x512.png"],
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
      <body className={`${inter.className} ${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased bg-slate-50 text-slate-900`}>
          {process.env.NODE_ENV === 'development' ? <ReticleDev /> : null}
          <SmoothScrollProvider />

          {user ? (
            /* ── Authenticated app shell ── */
            <>
              <div className="flex min-h-screen relative w-full">
                <Sidebar isAdmin={isAdmin} />
                <div className="flex-1 flex flex-col min-w-0 w-full">
                  <Header />
                  <main id="main-content" className="w-full relative">
                    <div className="pb-24 md:pb-0 min-h-[calc(100vh-var(--header-height))] flex flex-col">
                      <div className="flex-1 w-full relative">{children}</div>
                      <LegalFooter />
                    </div>
                  </main>
                </div>
              </div>
              <div className="flex md:hidden">
                <BottomNav isAdmin={isAdmin} />
              </div>
              <FloatingAssistant />
            </>
          ) : (
            /* ── Guest / marketing shell — no sidebar, no app header, no bottom nav ── */
            <>
              <main id="main-content" className="w-full">
                {children}
              </main>
              {/* Floating AI study wingman — Tejas (present on all pages incl. landing) */}
              <FloatingAssistant />
            </>
          )}
      </body>
    </html>
  );
}
