"use client";
import { Arrow } from "@radix-ui/react-dropdown-menu";
import { ArrowRight, SquareArrowOutUpRight, Unlink2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const NavLink = ({ href, children }) => {
    const isActive = pathname === href;

    return (
      <Link
        href={href}
        className={`
          relative 
          text-sm 
          font-medium 
          transition-colors 
          group
          ${
            isActive
              ? "text-blue-200 dark:text-zinc-100"
              : "text-zinc-200 hover:text-zinc-400 dark:text-zinc-400 dark:hover:text-zinc-100"
          }
        `}
      >
        {children}
        <span
          className={`
            absolute 
            bottom-[-4px] 
            left-0 
            w-full 
            h-0.5 
            bg-slate-600 
            dark:bg-zinc-100 
            scale-x-0 
            group-hover:scale-x-100 
            transition-transform 
            duration-300 
            origin-left
            ${isActive ? "scale-x-100" : ""}
          `}
        />
      </Link>
    );
  };

  return (
    <nav className="h-14 bg-transparent backdrop-blur-sm fixed w-full z-50">
      <div className="h-full max-w-7xl mx-auto px-4 flex items-center justify-between">
        <div className="font-mono text-lg font-semibold text-zinc-100 dark:text-zinc-100">
          work-watch
        </div>
        <div className="flex items-center gap-8">
          <NavLink href="/">Timer</NavLink>
          <NavLink href="/your-day">Your Day</NavLink>
          <NavLink href="/kanban">Kanban</NavLink>
          <NavLink href="/home">Home</NavLink>
          <NavLink href="/changelog">Changelog</NavLink>
        </div>
      </div>
    </nav>
  );
}
