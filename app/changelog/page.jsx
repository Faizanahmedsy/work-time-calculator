"use client";
import { Rocket, Database, Calendar, Sparkles } from "lucide-react";
import Link from "next/link";

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 to-gray-900 text-white pt-20 pb-10">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-cyan-900/20 border border-cyan-700/30 rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-6 h-6 text-cyan-400" />
            <span className="text-2xl font-medium text-cyan-300  ">
              What&apos;s New
            </span>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-8">
          {/* Latest Update - Your Day */}
          <div className="relative pl-8 border-l-2 border-cyan-500/30">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-cyan-500 ring-4 ring-slate-900"></div>

            <div className="mb-2 flex items-center gap-3">
              <span className="text-xs font-mono text-gray-500">
                December 19, 2024
              </span>
              <span className="text-xs px-2 py-1 bg-green-900/30 text-green-400 rounded-full border border-green-700/30">
                Latest
              </span>
            </div>

            <div className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 shadow-xl">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-cyan-900/30 rounded-xl border border-cyan-700/30">
                  <Calendar className="w-6 h-6 text-cyan-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2">
                    Your Day - Calendar Planner 🗓️
                  </h3>
                  <p className="text-gray-400 mb-4">
                    Plan your entire work day with our beautiful new calendar
                    interface!
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Rocket className="w-4 h-4 text-cyan-400" />
                    What&apos;s New?
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="text-cyan-400 mt-1">•</span>
                      <span>
                        <strong>Visual Calendar:</strong> Plan your day with a
                        beautiful timeline view showing all your tasks and
                        breaks
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-cyan-400 mt-1">•</span>
                      <span>
                        <strong>Drag & Drop:</strong> Easily reschedule events
                        by dragging them to new times
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-cyan-400 mt-1">•</span>
                      <span>
                        <strong>12-Hour Format:</strong> Professional time
                        picker with 5-minute intervals and AM/PM
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-cyan-400 mt-1">•</span>
                      <span>
                        <strong>Batch Creation:</strong> Add multiple events at
                        once with the multiple entry mode
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-cyan-400 mt-1">•</span>
                      <span>
                        <strong>Smart Layout:</strong> Events adapt their layout
                        based on duration for optimal readability
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-cyan-400 mt-1">•</span>
                      <span>
                        <strong>Auto-Save:</strong> All your events persist in
                        localStorage - never lose your schedule
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span>Try it now:</span>
                  <Link
                    href="/your-day"
                    className="text-cyan-400 hover:text-cyan-300 font-medium underline underline-offset-2"
                  >
                    Open Your Day →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Previous Update - Local Storage */}
          <div className="relative pl-8 border-l-2 border-gray-700/30">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-gray-600 ring-4 ring-slate-900"></div>

            <div className="mb-2 flex items-center gap-3">
              <span className="text-xs font-mono text-gray-500">
                December 19, 2024
              </span>
            </div>

            <div className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 shadow-xl">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-cyan-900/30 rounded-xl border border-cyan-700/30">
                  <Database className="w-6 h-6 text-cyan-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2">
                    Local Storage Persistence 🎉
                  </h3>
                  <p className="text-gray-400 mb-4">
                    Your work time data now automatically saves to your browser!
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Rocket className="w-4 h-4 text-cyan-400" />
                    What&apos;s New?
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="text-cyan-400 mt-1">•</span>
                      <span>
                        <strong>Auto-save:</strong> All your inputs (arrival
                        time, breaks, work mode) are automatically saved as you
                        type
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-cyan-400 mt-1">•</span>
                      <span>
                        <strong>Persist on refresh:</strong> Refresh the page
                        anytime without losing your data
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-cyan-400 mt-1">•</span>
                      <span>
                        <strong>Daily reset:</strong> Data automatically clears
                        at midnight for a fresh start each day
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-cyan-400 mt-1">•</span>
                      <span>
                        <strong>Settings preserved:</strong> Your custom work
                        time settings are saved across days
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-700/30">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    How It Works
                  </h4>
                  <p className="text-sm text-gray-300">
                    Your data is stored locally in your browser using advanced
                    state management (Zustand). It stays with you throughout the
                    day and automatically resets at midnight, so you start fresh
                    every workday!
                  </p>
                </div>

                <div className="bg-green-900/20 rounded-lg p-4 border border-green-700/30">
                  <h4 className="font-semibold mb-2 text-green-400">
                    ✓ Benefits for You
                  </h4>
                  <ul className="space-y-1 text-sm text-gray-300">
                    <li>✓ No more re-entering data after refreshing</li>
                    <li>✓ Access your work time across browser tabs</li>
                    <li>✓ Privacy-first: All data stays on your device</li>
                    <li>✓ Works offline once loaded</li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-gray-700/30">
                  <p className="text-xs text-gray-500">
                    💡 <strong>Pro tip:</strong> Your calculations update in
                    real-time and save automatically. Just set your arrival time
                    and breaks once - we&apos;ll remember it for the whole day!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Future placeholder */}
          <div className="relative pl-8 border-l-2 border-gray-700/30">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-gray-600 ring-4 ring-slate-900"></div>
            <div className="mb-2">
              <span className="text-xs font-mono text-gray-600">
                More updates coming soon...
              </span>
            </div>
          </div>
        </div>

        {/* Back to Timer */}
        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-900 hover:bg-cyan-700 text-cyan-100 rounded-full font-semibold transition-colors"
          >
            Back to Timer
          </Link>
        </div>
      </div>
    </div>
  );
}
