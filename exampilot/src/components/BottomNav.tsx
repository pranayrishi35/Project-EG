"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarDays, FileCheck2, MessagesSquare, Menu, Newspaper, BookOpen, Settings, User, X } from "lucide-react";

const primaryNavItems = [
  { href: "/",         label: "Home",     Icon: Home },
  { href: "/planner",  label: "Planner",  Icon: CalendarDays },
  { href: "/practice", label: "Practice", Icon: FileCheck2 },
  { href: "/doubts",   label: "Doubts",   Icon: MessagesSquare },
];

export default function BottomNav({ isAdmin }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <nav
        id="bottom-nav"
        className="print:hidden fixed bottom-0 w-full z-40 bg-brand-bg-surface border-t border-brand-border-subtle"
        style={{ 
          paddingBottom: "env(safe-area-inset-bottom)",
          height: "calc(var(--nav-height) + env(safe-area-inset-bottom))" 
        }}
        aria-label="Main navigation"
      >
        <ul className="flex h-full max-w-lg mx-auto" role="list">
          {primaryNavItems.map(({ href, label, Icon }) => {
            const isActive = pathname === href;
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  prefetch={true}
                  id={`nav-${label.toLowerCase()}`}
                  data-testid={`bottom-nav-${label.toLowerCase()}`}
                  onClick={() => setMenuOpen(false)}
                  className={`flex flex-col items-center justify-center w-full h-full min-h-[48px] min-w-[48px] gap-1 text-xs font-medium transition-colors duration-150 ${
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
          
          {/* Menu Button */}
          <li className="flex-1">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className={`flex flex-col items-center justify-center w-full h-full min-h-[48px] min-w-[48px] gap-1 text-xs font-medium transition-colors duration-150 ${
                menuOpen ? "text-brand-accent-500" : "text-brand-ink-muted hover:text-brand-ink-inverse"
              }`}
              aria-label="Open more options"
              aria-expanded={menuOpen}
            >
              <span className={`transition-transform duration-150 ${menuOpen ? "scale-110" : ""}`}>
                <Menu
                  width={22}
                  height={22}
                  strokeWidth={menuOpen ? 2 : 1.75}
                  aria-hidden="true"
                />
              </span>
              <span>More</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* More Menu Drawer */}
      {menuOpen && (
        <div 
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-sm sm:hidden animate-fade-in"
          onClick={() => setMenuOpen(false)}
        >
          <div 
            className="w-full bg-white rounded-t-3xl shadow-2xl p-6 pb-[calc(24px+env(safe-area-inset-bottom))]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-gray-900">More</h2>
              <button 
                type="button" 
                onClick={() => setMenuOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 active:scale-95"
                aria-label="Close menu"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>
            
            <ul className="flex flex-col gap-2">
              <li>
                <Link href="/news" onClick={() => setMenuOpen(false)} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 text-gray-800 font-bold active:bg-gray-100 min-h-[48px]">
                  <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center text-sky-600"><Newspaper size={20} strokeWidth={2} /></div>
                  Defense News
                </Link>
              </li>
              <li>
                <Link href="/booklets" onClick={() => setMenuOpen(false)} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 text-gray-800 font-bold active:bg-gray-100 min-h-[48px]">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600"><BookOpen size={20} strokeWidth={2} /></div>
                  Study Booklets
                </Link>
              </li>
              <li>
                <Link href="/settings" onClick={() => setMenuOpen(false)} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 text-gray-800 font-bold active:bg-gray-100 min-h-[48px]">
                  <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center text-gray-600"><User size={20} strokeWidth={2} /></div>
                  Profile & Settings
                </Link>
              </li>
              {isAdmin && (
                <li>
                  <Link href="/admin" onClick={() => setMenuOpen(false)} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 text-gray-800 font-bold active:bg-gray-100 min-h-[48px]">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600"><Settings size={20} strokeWidth={2} /></div>
                    Admin Dashboard
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
