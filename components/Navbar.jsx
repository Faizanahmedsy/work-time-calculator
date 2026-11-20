"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * A floating, rounded bar: the brand on the left, the pages as pills on the
 * right. The current page is a filled pill; the rest light up on hover.
 */
export default function Navbar() {
  const pathname = usePathname();

  const NavLink = ({ href, children, badge }) => {
    const isActive = pathname === href;
    return (
      <Link
        href={href}
        aria-current={isActive ? "page" : undefined}
        className={`relative flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 ${
          isActive
            ? "bg-white/[0.09] text-zinc-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
            : "text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-100"
        }`}
      >
        {children}
        {badge && (
          <span className="rounded-full bg-cyan-500/15 px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide text-cyan-300">
            {badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <nav className="fixed inset-x-0 top-3 z-50 px-4">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between rounded-full border border-white/[0.07] bg-[#0f1217]/75 pl-5 pr-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_20px_40px_-28px_rgba(0,0,0,0.9)] backdrop-blur-md">
        <Link
          href="/"
          className="font-mono text-[17px] font-semibold tracking-tight text-zinc-100"
        >
          work-watch
        </Link>
        <div className="flex items-center gap-1">
          <NavLink href="/">Timer</NavLink>
          <NavLink href="/your-day" badge="New">
            Your Day
          </NavLink>
          <NavLink href="/kanban">Kanban</NavLink>
          <NavLink href="/prompt-generator">Prompt Generator</NavLink>
          <NavLink href="/changelog">Changelog</NavLink>
          {/* <NavLink href="/daily-reports">Daily Report</NavLink> */}
        </div>
      </div>
    </nav>
  );
}
