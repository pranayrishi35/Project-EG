"use client";

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

interface AdminLoginProps {
  email: string;
  errorMessage?: string;
  errorDetails?: string;
}

export default function AdminLogin({ email, errorMessage, errorDetails }: AdminLoginProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleRetry = () => {
    // Force a hard reload to re-run the layout.tsx server checks
    window.location.reload();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <div className="bg-slate-900 border border-rose-900/50 p-8 rounded-3xl max-w-lg w-full shadow-2xl relative overflow-hidden">
        {/* Security Tape Decoration */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-600 via-rose-500 to-rose-600"></div>
        
        <div className="flex items-center gap-4 mb-6">
          <span className="text-4xl" aria-hidden="true">🔒</span>
          <div>
            <h2 className="text-2xl font-black text-white">Access Denied</h2>
            <p className="text-sm font-bold text-rose-500 uppercase tracking-widest">Restricted Area</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Authenticated As</p>
            <p className="text-sm text-slate-200 font-mono">{email}</p>
          </div>

          <div className="bg-rose-950/30 p-4 rounded-xl border border-rose-900/50">
            <p className="text-xs text-rose-400 font-bold uppercase tracking-wider mb-1">Authorization Error</p>
            <p className="text-sm text-rose-200 font-medium">
              {errorMessage || "Your email was not found in the admin_whitelist table."}
            </p>
            {errorDetails && (
              <p className="text-xs text-rose-300 mt-2 font-mono p-2 bg-rose-950/50 rounded-lg">
                Details: {errorDetails}
              </p>
            )}
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <button 
              onClick={handleRetry}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <span>🔄</span> Retry Authorization
            </button>
            <button 
              onClick={handleSignOut}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 px-4 rounded-xl transition-all"
            >
              Switch Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
