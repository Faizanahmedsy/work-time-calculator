"use client";
import React from "react";
import Link from "next/link";
import { Grid } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  return (
    <nav className="h-14 bg-transparent backdrop-blur-sm fixed w-full z-50">
      <div className="h-full max-w-7xl mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link 
            href="/" 
            className="text-sm font-medium hover:text-zinc-600 transition-colors"
          >
            Home
          </Link>
          <Link 
            href="/about"
            className="text-sm font-medium hover:text-zinc-600 transition-colors"
          >
            About
          </Link>
          <Link 
            href="/contact"
            className="text-sm font-medium hover:text-zinc-600 transition-colors"
          >
            Contact
          </Link>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="p-2 rounded-full hover:bg-zinc-100 transition-colors"
            >
              <Grid size={24} className="text-zinc-700" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80 rounded-lg border border-zinc-700 bg-zinc-900/70 backdrop-blur-xl shadow-lg ring-1 ring-zinc-700 ring-opacity-5">
            <div className="grid grid-cols-3 gap-2 p-4">
              <button className="flex flex-col items-center justify-center rounded-lg p-4 hover:bg-zinc-800/50 transition-colors">
                <div className="h-12 w-12 rounded-full bg-blue-900/30 flex items-center justify-center">
                  <span className="text-blue-400 text-xl">C</span>
                </div>
                <span className="mt-2 text-sm text-zinc-300">Calendar</span>
              </button>
              <button className="flex flex-col items-center justify-center rounded-lg p-4 hover:bg-zinc-800/50 transition-colors">
                <div className="h-12 w-12 rounded-full bg-green-900/30 flex items-center justify-center">
                  <span className="text-green-400 text-xl">D</span>
                </div>
                <span className="mt-2 text-sm text-zinc-300">Drive</span>
              </button>
              <button className="flex flex-col items-center justify-center rounded-lg p-4 hover:bg-zinc-800/50 transition-colors">
                <div className="h-12 w-12 rounded-full bg-yellow-900/30 flex items-center justify-center">
                  <span className="text-yellow-400 text-xl">K</span>
                </div>
                <span className="mt-2 text-sm text-zinc-300">Keep</span>
              </button>
              <button className="flex flex-col items-center justify-center rounded-lg p-4 hover:bg-zinc-800/50 transition-colors">
                <div className="h-12 w-12 rounded-full bg-purple-900/30 flex items-center justify-center">
                  <span className="text-purple-400 text-xl">M</span>
                </div>
                <span className="mt-2 text-sm text-zinc-300">Maps</span>
              </button>
              <button className="flex flex-col items-center justify-center rounded-lg p-4 hover:bg-zinc-800/50 transition-colors">
                <div className="h-12 w-12 rounded-full bg-red-900/30 flex items-center justify-center">
                  <span className="text-red-400 text-xl">G</span>
                </div>
                <span className="mt-2 text-sm text-zinc-300">Gmail</span>
              </button>
              <button className="flex flex-col items-center justify-center rounded-lg p-4 hover:bg-zinc-800/50 transition-colors">
                <div className="h-12 w-12 rounded-full bg-indigo-900/30 flex items-center justify-center">
                  <span className="text-indigo-400 text-xl">P</span>
                </div>
                <span className="mt-2 text-sm text-zinc-300">Photos</span>
              </button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
