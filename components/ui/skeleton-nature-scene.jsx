"use client";

import React from "react";
import { motion } from "framer-motion";

const SkeletonNatureScene = () => {
  return (
    <div className="w-full h-full relative overflow-hidden bg-neutral-900/50 border border-white/5 rounded-3xl">
      {/* Grid Overlay for Tech Feel */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />

      {/* --- THE SUN (Radar Style) --- */}
      <div className="absolute top-10 right-20 w-32 h-32">
        {/* Core */}
        <div className="absolute inset-0 m-auto w-16 h-16 rounded-full border-2 border-yellow-500/50 bg-yellow-500/10 shadow-[0_0_30px_rgba(234,179,8,0.2)]" />

        {/* Rotating Dashed Ring 1 */}
        <motion.div
          className="absolute inset-0 w-full h-full rounded-full border border-dashed border-yellow-500/30"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />

        {/* Rotating Dashed Ring 2 (Counter) */}
        <motion.div
          className="absolute inset-2 w-[calc(100%-16px)] h-[calc(100%-16px)] rounded-full border border-dotted border-yellow-500/30"
          animate={{ rotate: -360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        />

        {/* Scanning Line */}
        <motion.div
          className="absolute inset-0 w-full h-full rounded-full overflow-hidden"
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        >
          <div className="w-1/2 h-full bg-gradient-to-r from-transparent to-yellow-500/20 blur-sm" />
        </motion.div>
      </div>

      {/* --- THE MOUNTAINS (Wireframe) --- */}
      <div className="absolute bottom-0 left-0 right-0 h-[70%] z-10">
        <svg
          className="w-full h-full"
          viewBox="0 0 800 400"
          preserveAspectRatio="none"
        >
          {/* Back Mountain (Faded) */}
          <path
            d="M-50 400 L200 150 L450 400 Z"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="1"
            strokeDasharray="4 4"
            className="opacity-30"
          />
          <path
            d="M550 400 L700 250 L850 400 Z"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="1"
            strokeDasharray="4 4"
            className="opacity-30"
          />

          {/* Front Mountain (Main) */}
          <path
            d="M100 400 L400 50 L700 400 Z"
            fill="rgba(15, 23, 42, 0.8)"
            stroke="#06b6d4"
            strokeWidth="2"
          />
          {/* Grid lines on main mountain */}
          <path
            d="M400 50 L400 400"
            stroke="#06b6d4"
            strokeWidth="1"
            className="opacity-30"
          />
          <path
            d="M250 225 L550 225"
            stroke="#06b6d4"
            strokeWidth="1"
            className="opacity-30"
          />
          <path
            d="M325 137 L475 137"
            stroke="#06b6d4"
            strokeWidth="1"
            className="opacity-30"
          />

          {/* Coordinates Label */}
          <text
            x="410"
            y="80"
            fill="#06b6d4"
            fontSize="10"
            fontFamily="monospace"
            className="opacity-70"
          >
            ALT: 4800m
          </text>
        </svg>
      </div>

      {/* --- THE RIVER (Data Stream) --- */}
      <div className="absolute bottom-0 left-0 right-0 h-[25%] z-20 overflow-hidden">
        <svg
          className="w-full h-full"
          viewBox="0 0 800 100"
          preserveAspectRatio="none"
        >
          {/* Stream Lines */}
          {[1, 2, 3, 4].map((i) => (
            <motion.path
              key={i}
              d={`M-100 ${20 + i * 15} Q 200 ${10 + i * 15} 400 ${
                30 + i * 15
              } T 900 ${20 + i * 15}`}
              fill="none"
              stroke={i % 2 === 0 ? "#22d3ee" : "#3b82f6"}
              strokeWidth="2"
              strokeDasharray="10 20"
              initial={{ strokeDashoffset: 0 }}
              animate={{ strokeDashoffset: -1000 }}
              transition={{
                duration: 20 + i * 5,
                repeat: Infinity,
                ease: "linear",
              }}
              className="opacity-60"
            />
          ))}
        </svg>
        {/* Glow */}
        <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/10 to-transparent" />
      </div>

      {/* Tech Overlay Elements */}
      <div className="absolute top-4 left-4 flex gap-2">
        <div className="px-2 py-1 border border-cyan-500/30 rounded text-[10px] text-cyan-500 font-mono bg-cyan-950/20">
          ENV: PRODUCTION
        </div>
        <div className="px-2 py-1 border border-yellow-500/30 rounded text-[10px] text-yellow-500 font-mono bg-yellow-950/20">
          SUN_POS: 45°
        </div>
      </div>
    </div>
  );
};

export default SkeletonNatureScene;
