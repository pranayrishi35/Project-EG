import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden text-center animate-fade-in relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-300 to-slate-400" aria-hidden="true" />
        
        <div className="p-8 pb-6">
          <div className="w-16 h-16 bg-slate-50 text-slate-500 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 shadow-sm border border-slate-100">
            🧭
          </div>
          
          <h2 className="text-6xl font-black text-slate-200 tracking-tighter mb-2">
            404
          </h2>
          
          <h3 className="text-xl font-bold text-slate-800 mb-2">
            Lost in the syllabus?
          </h3>
          
          <p className="text-slate-500 text-sm leading-relaxed font-medium px-4">
            We couldn&apos;t find the study plan or page you were looking for. It might have been deleted or the link is incorrect.
          </p>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100">
          <Link
            href="/"
            className="flex items-center justify-center w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-[0_4px_14px_rgba(79,70,229,0.3)] transition-all active:scale-[0.98]"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
