import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { checkIsAdmin } from "@/lib/adminAuth";
import AdminLogin from "@/components/AdminLogin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !user.email) {
    redirect("/");
  }

  // Strict zero-day verification on route request
  const isAuthorized = await checkIsAdmin(user.email);

  if (!isAuthorized) {
    redirect("/");
  }

  return (
    <div className="min-h-screen w-full bg-slate-950 overflow-y-auto text-slate-200 font-sans">
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             <span className="text-2xl" aria-hidden="true">🛡️</span>
             <div>
               <h1 className="text-xl font-black text-white tracking-tight">Admin Command Center</h1>
               <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest">Restricted Access</p>
             </div>
          </div>
          <div className="flex items-center gap-4">
             <span className="text-xs font-semibold px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
               Verified: {user.email}
             </span>
             <a href="/" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">
               Return to App
             </a>
          </div>
        </div>
      </div>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        {children}
      </main>
    </div>
  );
}
