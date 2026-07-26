"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarDays, FileCheck2, Newspaper, BookOpen } from "lucide-react";

const navItems = [
  { href: "/",         label: "Home",     Icon: Home },
  { href: "/planner",  label: "Planner",  Icon: CalendarDays },
  { href: "/practice", label: "Practice", Icon: FileCheck2 },
  { href: "/news",     label: "News",     Icon: Newspaper },
  { href: "/booklets", label: "Booklets", Icon: BookOpen },
];

export default function BottomNav({ isAdmin }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const visibleNavItems = navItems.filter((item) => item.href !== "/admin" || isAdmin);

  return (
    <nav
      id="bottom-nav"
      className="print:hidden fixed bottom-0 w-full z-50 bg-brand-bg-surface border-t border-brand-border-subtle pb-[env(safe-area-inset-bottom)]"
      style={{ height: "calc(var(--nav-height) + env(safe-area-inset-bottom))" }}
      aria-label="Main navigation"
    >
      <ul className="flex h-full max-w-lg mx-auto" role="list">
        {visibleNavItems.map(({ href, label, Icon }) => {
          const isActive = pathname === href;
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                prefetch={true}
                id={`nav-${label.toLowerCase()}`}
                data-testid={`bottom-nav-${label.toLowerCase()}`}
                className={`flex flex-col items-center justify-center w-full h-full min-h-[44px] min-w-[44px] gap-1 text-xs font-medium transition-colors duration-150 ${
                  isActive
                    ? "text-brand-accent-500"
                    : "text-brand-ink-muted hover:text-brand-ink-inverse"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <span className={`transition-transform duration-150 ${isActive ? "scale-110" : ""}`}>
                  <Icon
                    width={22}
                    height={22}
                    strokeWidth={isActive ? 2 : 1.75}
                    aria-hidden="true"
                  />
                </span>
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
