import RecoverAccountForm from "@/components/RecoverAccountForm";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function RecoverAccountPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("is_deleted, deletion_deadline")
    .eq("id", user.id)
    .single();

  if (!profile?.is_deleted) {
    redirect("/dashboard");
  }

  const deadlineDate = new Date(profile.deletion_deadline);
  const formattedDeadline = deadlineDate.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Account Scheduled for Deletion
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Your account is currently in the 48-hour deletion grace period. 
          If you don't recover it, all your data will be permanently purged on:
        </p>
        
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-8 flex items-center justify-center gap-2 text-gray-700 dark:text-gray-300 font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>{formattedDeadline}</span>
        </div>

        <RecoverAccountForm />
        
        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Changed your mind again? You can sign out and let the deletion process continue.
          </p>
          <form action={async () => {
            "use server";
            const supabase = createClient();
            await supabase.auth.signOut();
            redirect("/login");
          }}>
            <button
              type="submit"
              className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
