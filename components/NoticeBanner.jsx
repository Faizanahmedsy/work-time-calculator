"use client";

import Link from "next/link";
import { Info } from "lucide-react";

export default function NoticeBanner() {
  return (
    <div className="w-full bg-slate-900 text-white py-3 px-4 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-start justify-center gap-3 text-center">
        <Info className="h-5 w-5 mt-0.5 shrink-0 text-blue-400" />

        <p className="text-sm md:text-base font-medium leading-relaxed">
          Thank you for being a part of this project. Over the last{" "}
          <span className="font-semibold">3 years</span>, it has served more
          than <span className="font-semibold">100 active users every day</span>
          . We are truly grateful for your love.
          <br />
          As our employer has transitioned to a new time-tracking system, this
          project will now be sunset in favor of a better alternative. <br />{" "}
          For a smoother and more reliable experience, we recommend using{" "}
          <Link
            href="https://time-wise-v1.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-semibold text-blue-400 hover:text-blue-300 transition-colors"
          >
            Time Wise
          </Link>
          , built by AI Engineer{" "}
          <span className="whitespace-nowrap">Mitual Parmar</span>.
        </p>
      </div>
    </div>
  );
}
