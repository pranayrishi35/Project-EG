"use client";

import { useState, useTransition } from "react";
import { CalendarPlus, Copy, Check, X, Loader2 } from "lucide-react";
import { getCalendarUrl } from "@/app/actions/getCalendarUrl";

// ─────────────────────────────────────────────────────────────────────────────
// "Add to Calendar" — surfaces the user's personal .ics feed URL.
//
// The feed auto-updates: calendar apps re-poll the URL, and the route always
// serves the user's most-recent plan, so changing the plan changes the feed with
// no extra action. We offer a one-click subscribe (webcal://) plus a copyable
// https link for apps that want it pasted in manually.
// ─────────────────────────────────────────────────────────────────────────────

export default function AddToCalendarButton() {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [webcalUrl, setWebcalUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleOpen() {
    setOpen(true);
    if (url || isPending) return; // fetch once
    setError(null);
    startTransition(async () => {
      const result = await getCalendarUrl();
      if (result.success) {
        setUrl(result.url);
        setWebcalUrl(result.webcalUrl);
      } else {
        setError(result.error);
      }
    });
  }

  async function handleCopy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Couldn't copy — please select and copy the link manually.");
    }
  }

  return (
    <>
      <button
        type="button"
        id="add-to-calendar-btn"
        onClick={handleOpen}
        className="print:hidden inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 transition-colors hover:bg-amber-100 active:scale-95"
      >
        <CalendarPlus size={16} strokeWidth={1.9} aria-hidden="true" />
        Add to Calendar
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-to-calendar-title"
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100" aria-hidden="true">
                  <CalendarPlus size={22} strokeWidth={1.9} className="text-amber-600" />
                </div>
                <div>
                  <h2 id="add-to-calendar-title" className="text-lg font-bold text-gray-900">
                    Sync your study plan
                  </h2>
                  <p className="text-xs text-gray-500">Updates automatically when your plan changes.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            {isPending && (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500">
                <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                Preparing your calendar link…
              </div>
            )}

            {error && !isPending && (
              <div role="alert" className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {url && !isPending && (
              <div className="flex flex-col gap-4">
                <a
                  href={webcalUrl ?? url}
                  className="ep-btn-primary group"
                >
                  <CalendarPlus size={18} strokeWidth={1.9} aria-hidden="true" />
                  <span className="font-semibold">Subscribe in one tap</span>
                </a>

                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Or paste this link into your calendar app
                  </p>
                  <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-2">
                    <input
                      readOnly
                      inputMode="url"
                      value={url}
                      aria-label="Calendar feed URL"
                      onFocus={(e) => e.currentTarget.select()}
                      className="min-w-0 flex-1 bg-transparent px-2 text-xs text-gray-600 outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50 active:scale-95"
                    >
                      {copied ? (
                        <>
                          <Check size={14} strokeWidth={2.2} className="text-emerald-600" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy size={14} strokeWidth={2} /> Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <p className="text-xs leading-relaxed text-gray-400">
                  Keep this link private — anyone with it can view your study schedule.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
