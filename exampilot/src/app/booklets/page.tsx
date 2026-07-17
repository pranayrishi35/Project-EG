import Link from "next/link";
import { Suspense } from "react";
import { getBookletDirectory } from "@/app/actions/getBooklets";

export const metadata = { title: "Study Booklets | ExamPilot" };
export const revalidate = 3600;

async function DirectoryContent() {
  const booklets = await getBookletDirectory();

  if (Object.keys(booklets).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
        <span className="text-4xl mb-3 opacity-50" aria-hidden="true">📭</span>
        <p className="text-sm font-bold text-gray-500">No booklets available</p>
        <p className="text-xs text-slate-700 mt-1">Generate some questions in the Admin panel first.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-12">
      {Object.entries(booklets).map(([examTarget, subjects]) => (
        <div key={examTarget} className="flex flex-col gap-6">
          <h2 className="text-3xl font-bold border-b border-slate-700 pb-2 text-gray-900 tracking-tight">{examTarget} Booklets</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(subjects).map(([subject, count]) => (
              <Link
                key={subject}
                href={`/booklets/${encodeURIComponent(examTarget)}/${encodeURIComponent(subject)}`}
                className="group flex flex-col justify-between p-6 rounded-3xl bg-white border border-gray-100 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all active:scale-[0.98] min-h-[160px] relative overflow-hidden"
              >
                {/* Subtle gradient flair */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-50 to-transparent rounded-bl-full opacity-50 group-hover:scale-110 transition-transform" />
                
                <div className="relative z-10">
                  <h3 className="text-xl font-black text-gray-900 tracking-tight group-hover:text-indigo-600 transition-colors">
                    {subject} Practice Booklet
                  </h3>
                  <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 mt-1">
                    {examTarget} Mock
                  </p>
                </div>
                
                <div className="relative z-10 flex items-center justify-between mt-6 pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-gray-500">
                    <span aria-hidden="true">📝</span> {count} Questions
                  </div>
                  <span className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm font-bold group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function DirectorySkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="h-[160px] bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between">
          <div className="h-6 w-32 bg-gray-100 rounded-md" />
          <div className="h-10 w-full bg-gray-50 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export default function BookletsPage() {
  return (
    <div className="flex flex-col gap-6 p-4 pt-6 pb-24 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Study Booklets</h1>
        <p className="text-sm text-gray-500 font-medium mt-1">Access curated defense exam materials for offline reading.</p>
      </div>

      {/* Standalone Current Affairs Section */}
      <section className="mb-6">
        <Link
          href="/booklets/Current%20Affairs/General"
          className="group relative flex flex-col justify-between p-8 rounded-3xl bg-slate-900 overflow-hidden shadow-lg hover:shadow-xl transition-all active:scale-[0.99] border border-slate-800"
        >
          {/* Background Gradient & Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#818cf815_1px,transparent_1px),linear-gradient(to_bottom,#818cf815_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl group-hover:bg-indigo-500/30 transition-colors pointer-events-none" />
          
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2 flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-3xl shrink-0 backdrop-blur-sm border border-indigo-500/30">
                📰
              </div>
              <div>
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="px-3 py-1 bg-indigo-950/50 text-indigo-400 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-indigo-500/30">
                    Time-Sensitive Resource
                  </span>
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight mb-1">
                  Current Affairs Bulletins
                </h2>
                <p className="text-sm text-slate-700 font-medium max-w-md">
                  High-yield defense, tech, and sports news compiled into a printable revision booklet.
                </p>
              </div>
            </div>
            
            <div className="md:col-span-1 flex items-center gap-3 justify-start md:justify-end">
              <span className="px-4 py-2 bg-indigo-500/10 text-indigo-300 text-sm font-bold rounded-xl border border-indigo-500/20">
                Auto-Updating
              </span>
              <div className="w-12 h-12 rounded-xl bg-white text-slate-900 flex items-center justify-center font-bold text-lg group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                →
              </div>
            </div>
          </div>
        </Link>
      </section>
      
      <div className="flex items-center gap-3 mb-2">
        <h2 className="text-lg font-bold text-gray-900">Standard Mock Booklets</h2>
        <div className="h-px bg-gray-200 flex-1" />
      </div>

      <Suspense fallback={<DirectorySkeleton />}>
        <DirectoryContent />
      </Suspense>
    </div>
  );
}
