"use client";

import {
  useState,
  useRef,
  useTransition,
  useCallback,
  useEffect,
  type DragEvent,
  type ChangeEvent,
} from "react";
import { useRouter } from "next/navigation";
import { generateStudyPlan } from "@/app/actions/planner";
import CreditModal from "./CreditModal";

// ─── Types ────────────────────────────────────────────────────────────────────
interface UploadedFile {
  name: string;
  size: number;
  type: string;
  raw: File;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const ACCEPTED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
const ACCEPTED_LABEL = "PDF, PNG, JPG or WEBP";

// ─── Sub-components ───────────────────────────────────────────────────────────

function HeroOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none" aria-hidden="true">
      <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-30" style={{ background: "radial-gradient(circle, #818CF8 0%, transparent 70%)" }} />
      <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #C4B5FD 0%, transparent 70%)" }} />
    </div>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function FilePill({ file, onRemove, disabled }: { file: UploadedFile; onRemove: () => void; disabled: boolean }) {
  const isPDF = file.type === "application/pdf";
  return (
    <div id="selected-file-pill" className="flex items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 mt-4 animate-fade-in">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-base" style={{ background: isPDF ? "#EEF2FF" : "#F0FDF4" }} aria-hidden="true">
        {isPDF ? "📄" : "🖼️"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{file.name}</p>
        <p className="text-xs text-gray-500">{formatBytes(file.size)}</p>
      </div>
      <button id="remove-file-btn" type="button" onClick={onRemove} disabled={disabled} aria-label="Remove selected file" className="w-7 h-7 flex items-center justify-center rounded-full text-slate-700 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

function Spinner() {
  return <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin flex-shrink-0" aria-hidden="true" />;
}

// ─── Streak badge ─────────────────────────────────────────────────────────────

function StreakBadge({ streak }: { streak: number }) {
  if (streak === 0) return null;
  return (
    <div
      className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-2 backdrop-blur-sm border border-white/20"
      aria-label={`${streak} day study streak`}
    >
      <span className="text-lg leading-none" aria-hidden="true">🔥</span>
      <div className="flex items-baseline gap-1">
        <span
          className="text-xl font-black leading-none tabular-nums"
          style={{
            background: "linear-gradient(135deg, #FDE68A 0%, #F97316 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: "drop-shadow(0 1px 4px rgba(251,146,60,0.6))",
          }}
        >
          {streak}
        </span>
        <span className="text-xs font-semibold text-white/80">
          {streak === 1 ? "day" : "day"} streak
        </span>
      </div>
    </div>
  );
}

// ─── Main Form Component ───────────────────────────────────────────────────────

export default function CreatePlanForm({ streak, compact = false }: { streak: number; compact?: boolean }) {
  const router = useRouter();

  // Aggressively prefetch the planner route so the transition is instant
  useEffect(() => {
    router.prefetch('/planner');
  }, [router]);

  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [dragError, setDragError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [examName, setExamName] = useState("AFCAT");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  const acceptFile = useCallback((file: File) => {
    setDragError(null);
    if (!ACCEPTED_TYPES.includes(file.type)) { setDragError("Only PDF, PNG, JPG, or WEBP files are accepted."); return; }
    if (file.size > 20 * 1024 * 1024) { setDragError("File must be under 20 MB."); return; }
    setUploadedFile({ name: file.name, size: file.size, type: file.type, raw: file });
  }, []);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false); };
  const handleDrop = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files?.[0]; if (f) acceptFile(f); };
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) acceptFile(f); e.target.value = ""; };

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError(null);
    const formData = new FormData(e.currentTarget);
    if (uploadedFile?.raw) formData.set("syllabusFile", uploadedFile.raw, uploadedFile.name);
    else formData.delete("syllabusFile");

    startTransition(async () => {
      const result = await generateStudyPlan(formData);
      console.log("Server Action Raw Payload:", result);
      if (!result.success) { 
        if (result && typeof result.error === 'string' && result.error.includes('INSUFFICIENT_CREDITS')) {
          console.log("Intercepted Insufficient Credits! Triggering Modal.");
          setSubmitError(""); // Clear the red banner
          setShowCreditModal(true); // Show the premium modal
          return;
        } else if (result.error === 'AI_SERVICE_UNAVAILABLE' && 'message' in result) {
          setSubmitError(result.message as string);
        } else {
          setSubmitError(result.error); 
        }
        return; 
      }
      
      // Refresh the router to update the server-rendered Header credit badge
      router.refresh();
      router.push(`/planner/${result.planId}`);
    });
  }

  return (
    <div className={compact ? "flex flex-col gap-5" : "flex flex-col gap-5 p-4 pt-6 pb-24"}>

      {/* Hero Banner (hidden in compact mode) */}
      {!compact && (
        <section id="create-plan-hero" aria-labelledby="create-plan-heading" className="relative rounded-2xl p-5 text-white overflow-hidden" style={{ background: "linear-gradient(135deg, #4F46E5 0%, #6D28D9 100%)" }}>
          <HeroOrbs />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-1">New Plan</p>
              <h1 id="create-plan-heading" className="text-2xl font-bold leading-tight mb-1">Create Study Plan</h1>
              <p className="text-sm opacity-75 leading-relaxed">Upload your syllabus and let ExamPilot craft a personalised day-by-day schedule.</p>
            </div>
            {/* Streak badge — top-right of hero */}
            <div className="flex-shrink-0 mt-0.5">
              <StreakBadge streak={streak} />
            </div>
          </div>
        </section>
      )}

      {/* Form */}
      <form id="create-plan-form" aria-label="Create study plan form" onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>

        {/* Exam Name */}
        <div id="exam-name-section" className="flex flex-col gap-3">
          <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
            <span className="text-base" aria-hidden="true">🎯</span> Target Exam
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* AFCAT Card */}
            <div 
              role="button" 
              tabIndex={0}
              onClick={() => { if (!isPending) setExamName("AFCAT"); }}
              className={`relative flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                isPending ? "opacity-60 cursor-not-allowed border-gray-200" 
                : examName === "AFCAT" ? "border-indigo-500 bg-indigo-50/50 shadow-sm" 
                : "border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/30"
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl">
                ✈️
              </div>
              <span className={`font-bold ${examName === "AFCAT" ? "text-indigo-900" : "text-gray-700"}`}>AFCAT</span>
            </div>

            {/* NDA Card (Disabled) */}
            <div className="relative flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed transition-all">
              <div className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
                Coming Soon
              </div>
              <div className="w-10 h-10 rounded-xl bg-gray-200 text-gray-500 flex items-center justify-center text-xl grayscale">
                🎖️
              </div>
              <span className="font-bold text-gray-500">NDA</span>
            </div>

            {/* CDS Card */}
            <div 
              role="button" 
              tabIndex={0}
              onClick={() => { if (!isPending) setExamName("CDS"); }}
              className={`relative flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                isPending ? "opacity-60 cursor-not-allowed border-gray-200" 
                : examName === "CDS" ? "border-indigo-500 bg-indigo-50/50 shadow-sm" 
                : "border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/30"
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-colors ${examName === "CDS" ? "bg-indigo-100 text-indigo-600" : "bg-gray-100 text-gray-500"}`}>
                ⚓
              </div>
              <span className={`font-bold ${examName === "CDS" ? "text-indigo-900" : "text-gray-700"}`}>CDS</span>
            </div>
          </div>
          {/* Hidden input to pass the selected exam to the server action */}
          <input type="hidden" name="examName" value={examName} />
        </div>

        {/* Exam Date */}
        <div id="exam-date-section" className="flex flex-col gap-1.5">
          <label htmlFor="exam-date" className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
            <span className="text-base" aria-hidden="true">📅</span> Exam Date
          </label>
          <div className="relative">
            <input id="exam-date" name="examDate" type="date" required disabled={isPending} className="ep-input ep-date-input peer disabled:opacity-60 disabled:cursor-not-allowed" aria-required="true" min={new Date().toISOString().split("T")[0]} />
            <div className="pointer-events-none absolute inset-0 rounded-xl ring-0 peer-focus:ring-2 ring-indigo-400 transition-all duration-200" aria-hidden="true" />
          </div>
        </div>

        {/* Syllabus Upload */}
        <div id="syllabus-upload-section" className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5" id="upload-label">
            <span className="text-base" aria-hidden="true">📎</span> Upload Syllabus
            <span className="text-xs font-normal text-slate-700 ml-1">(optional)</span>
          </label>
          <div
            id="syllabus-drop-zone"
            role="button" tabIndex={isPending ? -1 : 0}
            aria-labelledby="upload-label" aria-describedby="upload-hint" aria-disabled={isPending}
            onDragOver={isPending ? undefined : handleDragOver}
            onDragLeave={isPending ? undefined : handleDragLeave}
            onDrop={isPending ? undefined : handleDrop}
            onClick={() => !isPending && fileInputRef.current?.click()}
            onKeyDown={(e) => { if (!isPending && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); fileInputRef.current?.click(); } }}
            className={["relative rounded-2xl border-2 border-dashed p-6 flex flex-col items-center gap-3", "cursor-pointer select-none transition-all duration-200 outline-none", "focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2",
              isPending ? "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed" : isDragging ? "border-indigo-500 bg-indigo-50 scale-[1.01]" : dragError ? "border-red-400 bg-red-50" : "border-gray-200 bg-white hover:border-indigo-400 hover:bg-indigo-50/50"].join(" ")}
          >
            {isDragging && !isPending && <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ background: "radial-gradient(ellipse at center, rgba(99,102,241,0.08) 0%, transparent 70%)" }} aria-hidden="true" />}
            <div className={["w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200", isDragging ? "bg-indigo-100 scale-110" : dragError ? "bg-red-100" : "bg-gray-50"].join(" ")} aria-hidden="true">
              <UploadIcon className={["w-7 h-7 transition-colors duration-200", isDragging ? "text-indigo-500" : dragError ? "text-red-400" : "text-slate-700"].join(" ")} />
            </div>
            <div className="text-center">
              <p className={["text-sm font-semibold transition-colors duration-150", isDragging ? "text-indigo-600" : dragError ? "text-red-500" : "text-gray-700"].join(" ")}>
                {isDragging ? "Drop it right here!" : dragError ? "Wrong file type" : "Tap to browse or drag & drop"}
              </p>
              <p id="upload-hint" className="text-xs text-slate-700 mt-0.5">{dragError ?? `${ACCEPTED_LABEL} · Max 20 MB`}</p>
            </div>
            <input ref={fileInputRef} id="syllabus-file-input" type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={handleInputChange} disabled={isPending} />
          </div>
          {uploadedFile && <FilePill file={uploadedFile} onRemove={() => { setUploadedFile(null); setDragError(null); }} disabled={isPending} />}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3" aria-hidden="true">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-xs text-gray-300 font-medium">ready to go?</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        {/* Submit error */}
        {submitError && (
          <div role="alert" aria-live="polite" className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 animate-fade-in">
            <span className="text-base flex-shrink-0" aria-hidden="true">⚠️</span>
            <p className="leading-snug">{submitError}</p>
          </div>
        )}

        {/* Generate button */}
        <button
          id="generate-plan-btn" type="submit" disabled={isPending}
          className="ep-btn-primary group"
          aria-label={isPending ? "Generating your study plan…" : "Generate personalised study plan"}
          style={isPending ? { opacity: 0.85, cursor: "not-allowed", transform: "none" } : {}}
        >
          {!isPending && (
            <span className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none" aria-hidden="true">
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </span>
          )}
          {isPending ? (
            <><Spinner /><span className="font-semibold text-base">Generating your plan…</span></>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true">
                <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
                <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" /><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
              </svg>
              <span className="font-semibold text-base">Generate Study Plan</span>
            </>
          )}
        </button>

        {!isPending && <p className="text-center text-xs text-slate-700 -mt-2">AI-powered · Personalised for your exam · Free</p>}
        {isPending && <p className="text-center text-xs text-indigo-400 -mt-2 animate-fade-in">Analysing syllabus and building your schedule — this takes ~15 seconds…</p>}

      </form>
      
      <CreditModal 
        isOpen={showCreditModal} 
        onClose={() => setShowCreditModal(false)} 
      />
    </div>
  );
}
