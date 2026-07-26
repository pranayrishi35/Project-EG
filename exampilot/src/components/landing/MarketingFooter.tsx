import Link from "next/link";

/**
 * MarketingFooter — minimal footer for the guest landing page (§3.6).
 * Background: --color-bg-paper-alt. Logo, legal links, copyright.
 * Server-safe.
 */
export default function MarketingFooter() {
  return (
    <footer className="bg-brand-bg-paper-alt border-t border-brand-border-subtle">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* Logo */}
        <Link
          href="/"
          aria-label="ExamPilot home"
          className="flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-brand-accent-400 rounded-lg"
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #0B1220 0%, #1E293B 100%)", border: "1.5px solid rgba(245,166,35,0.4)" }}
            aria-hidden="true"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#F5A623" aria-hidden="true">
              <path d="M21.707 2.293a1 1 0 0 0-1.414 0l-1.586 1.586A2 2 0 0 0 18 5.293V7l-5 5H9.414l-5.707 5.707a1 1 0 0 0 1.414 1.414L11 13.414V15a1 1 0 0 0 .293.707l4 4A1 1 0 0 0 17 19v-4l2.414-2.414A2 2 0 0 0 20 11.172V9.293l1.707-1.707a1 1 0 0 0 0-1.414l-1-1z" />
            </svg>
          </div>
          <span className="text-sm font-bold tracking-tight text-brand-ink-primary">
            Exam<span className="text-brand-accent-500">Pilot</span>
          </span>
        </Link>

        {/* Links */}
        <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {[
            { href: "/terms", label: "Terms" },
            { href: "/privacy", label: "Privacy" },
            { href: "/aup", label: "AUP" },
            { href: "/refund-policy", label: "Refund Policy" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-xs text-brand-ink-muted hover:text-brand-ink-primary transition-colors duration-base"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="w-full text-center py-4 border-t border-brand-border-subtle my-2 text-xs text-brand-ink-muted leading-relaxed">
          <p>
            <strong>Disclaimer:</strong> ExamPilot is an independent educational platform and is <strong>not affiliated with, endorsed by, or sponsored by</strong> the Union Public Service Commission (UPSC), the Indian Air Force, the Indian Army, the Indian Navy, or any government examination authority. All exam names and acronyms (e.g., AFCAT, CDS, NDA) belong solely to their respective formal institutions and are used for identification purposes only.
          </p>
        </div>

        <p className="text-xs text-brand-ink-muted">
          &copy; {new Date().getFullYear()} ExamPilot
        </p>
      </div>
    </footer>
  );
}
