import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import SignOutButton from "@/components/SignOutButton";
import DeleteAccountForm from "@/components/DeleteAccountForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings — ExamPilot",
  description: "Manage your ExamPilot account and preferences.",
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Returns initials from a name or email (up to 2 chars). */
function getInitials(name: string | null, email: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return (email?.[0] ?? "U").toUpperCase();
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-700 px-1">
        {title}
      </p>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {children}
      </div>
    </div>
  );
}

// ─── Info row ─────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-800 text-right max-w-[55%] truncate">
        {value}
      </span>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function SettingsPage() {
  const supabase = createClient();

  // ── Auth check ────────────────────────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/settings");
  }

  // ── Profile data from the user_profiles table (created by DB trigger on signup)
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .single();

  const fullName: string | null = profile?.full_name ?? null;
  const avatarUrl: string | null = profile?.avatar_url ?? null;
  const email = user.email ?? "—";
  const initials = getInitials(fullName, email);
  const memberSince = new Date(user.created_at).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // ── Plan count ────────────────────────────────────────────────────────────
  const { count: planCount } = await supabase
    .from("study_plans")
    .select("id", { count: "exact", head: true });

  return (
    <div className="flex flex-col gap-6 p-4 pt-6 pb-24">

      {/* ── Page header ───────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-0.5">
          Account
        </p>
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
      </div>

      {/* ── Profile card ──────────────────────────────────────────────── */}
      <div
        className="relative rounded-2xl p-6 flex flex-col items-center gap-4 text-center overflow-hidden"
        style={{ background: "linear-gradient(135deg, #4F46E5 0%, #6D28D9 100%)" }}
      >
        {/* Decorative orb */}
        <div
          className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20 pointer-events-none"
          style={{ background: "radial-gradient(circle, #A5B4FC, transparent 70%)" }}
          aria-hidden="true"
        />

        {/* Avatar */}
        {avatarUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <Image
            src={avatarUrl}
            alt={fullName ?? email}
            width={80}
            height={80}
            priority={true}
            className="relative w-20 h-20 rounded-full object-cover border-4 border-white/30 shadow-xl"
          />
        ) : (
          <div
            className="relative w-20 h-20 rounded-full flex items-center justify-center border-4 border-white/30 shadow-xl"
            style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}
            aria-label={`Avatar for ${fullName ?? email}`}
          >
            <span className="text-white text-2xl font-black">{initials}</span>
          </div>
        )}

        {/* Name + email */}
        <div className="relative">
          {fullName && (
            <p className="text-white text-lg font-bold leading-tight">{fullName}</p>
          )}
          <p className="text-white/70 text-sm">{email}</p>
        </div>

        {/* Stats pills */}
        <div className="relative flex items-center gap-3">
          <div className="bg-white/15 rounded-xl px-3 py-1.5 text-center">
            <p className="text-white text-base font-black tabular-nums">{planCount ?? 0}</p>
            <p className="text-white/60 text-[10px] font-medium uppercase tracking-wider">Plans</p>
          </div>
          <div className="w-px h-8 bg-white/20" aria-hidden="true" />
          <div className="bg-white/15 rounded-xl px-3 py-1.5 text-center">
            <p className="text-white text-base font-black">
              {new Date(user.created_at).toLocaleDateString("en-IN", { month: "short", year: "2-digit" })}
            </p>
            <p className="text-white/60 text-[10px] font-medium uppercase tracking-wider">Joined</p>
          </div>
        </div>
      </div>

      {/* ── Account details ───────────────────────────────────────────── */}
      <Section title="Account Details">
        <InfoRow label="Email" value={email} />
        {fullName && <InfoRow label="Name" value={fullName} />}
        <InfoRow label="Member Since" value={memberSince} />
      </Section>

      {/* ── App info ──────────────────────────────────────────────────── */}
      <Section title="App">
        <InfoRow label="Version" value="1.0.0" />
        <div className="flex items-center justify-between px-4 py-3.5">
          <span className="text-sm text-gray-500">Study Plans</span>
          <Link
            href="/planner"
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            View all →
          </Link>
        </div>
      </Section>

      {/* ── Danger zone ───────────────────────────────────────────────── */}
      <Section title="Danger Zone">
        <DeleteAccountForm />
      </Section>

      {/* ── Session ───────────────────────────────────────────────────── */}
      <Section title="Session">
        <div className="p-4">
          <SignOutButton fullWidth />
        </div>
      </Section>

      <p className="text-center text-xs text-slate-700 -mt-2">
        ExamPilot · Powered by Google Gemini
      </p>
    </div>
  );
}
