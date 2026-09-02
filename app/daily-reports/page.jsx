"use client";

import Background from "@/components/Background";
import DailyReport from "@/components/DailyReport";

export default function DailyReportsPage() {
  return (
    <Background>
      {/* Wider than the timer pages: the report view is a three-column
          workspace (projects · milestones · composer). */}
      <div className="relative z-10 min-h-screen pt-24 pb-12 px-6">
        <div className="max-w-[1800px] mx-auto">
          <DailyReport />
        </div>
      </div>
    </Background>
  );
}
