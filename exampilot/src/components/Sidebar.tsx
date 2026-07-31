"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarDays, FileCheck2, Newspaper, BookOpen, ShieldCheck } from "lucide-react";

const navItems = [
  { href: "/",         label: "Home",     Icon: Home },
  { href: "/planner",  label: "Planner",  Icon: CalendarDays },
  { href: "/practice", label: "Practice", Icon: FileCheck2 },
  { href: "/news",     label: "News",     Icon: Newspaper },
  { href: "/booklets", label: "Booklets", Icon: BookOpen },
  { href: "/admin",    label: "Admin",    Icon: ShieldCheck },
];

export default function Sidebar({ isAdmin }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const visibleNavItems = navItems.filter((item) => item.href !== "/admin" || isAdmin);

  return (
    <aside className="hidden md:flex flex-col sticky top-0 h-screen w-64 shrink-0 bg-brand-bg-surface border-r border-brand-border-subtle z-40 pt-6">
      <div className="flex-1 px-4 py-6 overflow-y-auto hide-scrollbar">
        <ul data-testid="sidebar-nav" className="space-y-1">
          {visibleNavItems.map(({ href, label, Icon }) => {
            const isActive = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-brand-accent-500/10 text-brand-accent-500"
                      : "text-brand-ink-muted hover:text-brand-ink-inverse hover:bg-brand-bg-elevated"
                  }`}
                >
                  <Icon
                    width={20}
                    height={20}
                    strokeWidth={isActive ? 2 : 1.75}
                    aria-hidden="true"
                  />
                  <span className="font-semibold text-sm">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="p-6 border-t border-brand-border-subtle">
        <div className="flex items-center gap-3 opacity-60">
          <div className="w-8 h-8 rounded-lg bg-brand-accent-500/20 flex items-center justify-center">
            <span className="text-brand-accent-500 font-black text-xs">J</span>
          </div>
          <span className="text-sm font-bold tracking-widest text-brand-ink-inverse uppercase">Jishnu</span>
        </div>
      </div>
    </aside>
  );
}
