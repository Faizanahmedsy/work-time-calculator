"use client";

import React from "react";
import { motion } from "framer-motion";

const Star = ({ x, y, size = 1, delay = 0 }) => (
  <motion.div
    className="absolute rounded-full bg-white"
    style={{ left: x, top: y, width: size, height: size }}
    animate={{ opacity: [0.2, 1, 0.2], scale: [1, 1.2, 1] }}
    transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, delay }}
  />
);

const Cloud = ({ x, y, scale = 1, delay = 0, duration = 20 }) => (
  <motion.div
    className="absolute opacity-40"
    style={{ left: x, top: y, scale }}
    animate={{ x: [0, 50, 0] }}
    transition={{ duration, repeat: Infinity, ease: "linear", delay }}
  >
    <svg
      width="100"
      height="60"
      viewBox="0 0 100 60"
      className="text-pink-200/60 fill-none stroke-current"
    >
      <path
        d="M10 40 Q 25 20 40 40 Q 55 10 70 40 Q 85 30 95 45 Q 100 60 80 60 L 20 60 Q 0 60 10 40 Z"
        strokeDasharray="4 4"
        strokeWidth="1.5"
      />
    </svg>
  </motion.div>
);

const RoundTree = ({ x, y, scale = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    {/* Trunk (Brown) */}
    <rect x="-2" y="-5" width="4" height="15" fill="#78350f" opacity="0.8" />
    <rect
      x="-2"
      y="-5"
      width="4"
      height="15"
      fill="none"
      stroke="#92400e"
      strokeWidth="0.5"
    />

    {/* Foliage (Rounded Bush - Green Wireframe) */}
    <circle
      cx="0"
      cy="-20"
      r="15"
      fill="rgba(34, 197, 94, 0.15)"
      stroke="#22c55e"
      strokeWidth="1.5"
      opacity="0.7"
    />
    <circle
      cx="-8"
      cy="-18"
      r="10"
      fill="rgba(34, 197, 94, 0.1)"
      stroke="#22c55e"
      strokeWidth="1"
      opacity="0.6"
    />
    <circle
      cx="8"
      cy="-18"
      r="10"
      fill="rgba(34, 197, 94, 0.1)"
      stroke="#22c55e"
      strokeWidth="1"
      opacity="0.6"
    />
    <circle
      cx="0"
      cy="-28"
      r="8"
      fill="rgba(34, 197, 94, 0.12)"
      stroke="#22c55e"
      strokeWidth="1"
      opacity="0.65"
    />
  </g>
);

const Bird = ({ x, y, delay = 0 }) => (
  <motion.div
    className="absolute w-4 h-4"
    style={{ left: x, top: y }}
    initial={{ x: -50, opacity: 0 }}
    animate={{
      x: ["-10vw", "110vw"],
      y: [0, -20, 10, -10],
      opacity: [0, 1, 1, 0],
    }}
    transition={{
      duration: 35,
      repeat: Infinity,
      delay,
      ease: "linear",
    }}
  >
    <svg
      viewBox="0 0 24 24"
      className="w-full h-full text-pink-300/70 fill-none stroke-current"
    >
      <path d="M2 12 Q 8 8 12 12 Q 16 8 22 12" strokeWidth="2" />
    </svg>
  </motion.div>
);

const SkeletonNatureScene = () => {
  return (
    <div className="w-full h-full relative overflow-hidden rounded-3xl bg-gradient-to-b from-neutral-950 via-neutral-900 to-purple-950/30">
      {/* Grid Overlay (Tech Feel) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f472b61a_1px,transparent_1px),linear-gradient(to_bottom,#f472b61a_1px,transparent_1px)] bg-[size:40px_40px]" />

      {/* --- STARS --- */}
      {[...Array(30)].map((_, i) => (
        <Star
          key={i}
          x={`${Math.random() * 100}%`}
          y={`${Math.random() * 60}%`}
          size={Math.random() * 2 + 1}
          delay={Math.random() * 5}
        />
      ))}

      {/* --- CLOUDS (Wireframe) --- */}
      <Cloud x="10%" y="15%" scale={1.2} duration={40} />
      <Cloud x="60%" y="10%" scale={0.8} delay={10} duration={50} />
      <Cloud x="80%" y="25%" scale={1.5} delay={5} duration={45} />

      {/* --- THE SUN (Wireframe with Glow) --- */}
      <motion.div
        className="absolute bottom-32 left-1/2 -translate-x-1/2 w-32 h-32 z-0"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Core Sun (Dashed Circle) */}
        <div className="absolute inset-0 m-auto w-24 h-24 rounded-full border-2 border-dashed border-orange-400/60 shadow-[0_0_50px_rgba(251,191,36,0.25)]" />

        {/* Inner Ring */}
        <motion.div
          className="absolute inset-0 m-auto w-16 h-16 rounded-full border border-orange-400/50"
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Rays (Dashed Lines) */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute top-1/2 left-1/2 h-0.5 bg-orange-400/30"
            style={{
              rotate: `${i * 45}deg`,
              transformOrigin: "center",
              width: "140%",
              marginLeft: "-70%",
            }}
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
          />
        ))}
      </motion.div>

      {/* --- BIRDS (Wireframe) --- */}
      <Bird x="10%" y="20%" delay={2} />
      <Bird x="5%" y="25%" delay={5} />
      <Bird x="15%" y="18%" delay={8} />

      {/* --- THE MOUNTAINS (Background - Taller) --- */}
      <div className="absolute bottom-0 left-0 right-0 h-[75%] z-10">
        <svg
          className="w-full h-full"
          viewBox="0 0 800 500"
          preserveAspectRatio="none"
        >
          {/* Far Back Mountains (Very Faded) */}
          <path
            d="M-50 500 L100 320 L200 370 L300 280 L400 350 L500 250 L600 330 L700 290 L850 500 Z"
            fill="rgba(244, 114, 182, 0.03)"
            stroke="#f472b6"
            strokeWidth="1"
            strokeDasharray="8 8"
            className="opacity-15"
          />

          {/* Back Mountains Layer 1 */}
          <path
            d="M-50 500 L80 350 L180 400 L280 320 L380 380 L480 300 L580 360 L680 310 L780 380 L900 500 Z"
            fill="rgba(244, 114, 182, 0.05)"
            stroke="#f472b6"
            strokeWidth="1"
            strokeDasharray="6 6"
            className="opacity-25"
          />

          {/* Back Mountains Layer 2 */}
          <path
            d="M-50 500 L50 380 L150 430 L250 340 L350 410 L450 320 L550 390 L650 330 L750 410 L850 500 Z"
            fill="rgba(244, 114, 182, 0.06)"
            stroke="#f472b6"
            strokeWidth="1.5"
            strokeDasharray="5 5"
            className="opacity-30"
          />

          {/* Middle Mountains (More Visible) */}
          <path
            d="M-100 500 Q 100 280 200 450 Q 300 230 400 430 Q 500 200 600 450 Q 700 260 900 500"
            fill="rgba(244, 114, 182, 0.08)"
            stroke="#f472b6"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            className="opacity-40"
          />

          {/* Front Mountain Range (Most Prominent - Taller Peaks) */}
          <path
            d="M-50 500 L150 320 L250 400 L350 220 L450 360 L550 180 L650 330 L750 270 L900 500 Z"
            fill="rgba(244, 114, 182, 0.1)"
            stroke="#f472b6"
            strokeWidth="2"
            className="opacity-60"
          />

          {/* Contour Lines on Main Peak */}
          <path
            d="M480 300 Q 550 220 620 300"
            stroke="#f472b6"
            strokeWidth="1"
            strokeDasharray="3 3"
            className="opacity-20"
            fill="none"
          />

          {/* Tech Label */}
          <text
            x="360"
            y="90"
            fill="#f472b6"
            fontSize="10"
            fontFamily="monospace"
            className="opacity-40"
          >
            MOUNTAIN_RANGE_v3.0
          </text>
        </svg>
      </div>

      {/* --- THE RIVER (At ground level, below mountains) --- */}
      <div className="absolute bottom-0 left-0 right-0 h-[20%] z-20 overflow-hidden">
        <svg
          className="w-full h-full"
          viewBox="0 0 800 100"
          preserveAspectRatio="none"
        >
          {/* Stream Lines (Dashed) */}
          {[1, 2, 3, 4, 5].map((i) => (
            <motion.path
              key={i}
              d={`M-100 ${20 + i * 12} C 200 ${5 + i * 12}, 400 ${
                35 + i * 12
              }, 900 ${20 + i * 12}`}
              fill="none"
              stroke={i % 2 === 0 ? "#f472b6" : "#fbbf24"}
              strokeWidth="1.5"
              strokeDasharray="15 25"
              initial={{ strokeDashoffset: 0 }}
              animate={{ strokeDashoffset: -1000 }}
              transition={{
                duration: 30 + i * 5,
                repeat: Infinity,
                ease: "linear",
              }}
              className="opacity-30"
            />
          ))}
        </svg>
        {/* Subtle Glow */}
        <div className="absolute inset-0 bg-gradient-to-t from-pink-500/5 to-transparent" />
      </div>

      {/* --- FOREGROUND TREES (Around the river, on ground) --- */}
      <div className="absolute bottom-0 left-0 right-0 h-[25%] z-30">
        <svg
          className="w-full h-full"
          viewBox="0 0 800 150"
          preserveAspectRatio="none"
        >
          {/* Trees scattered around the river */}
          <RoundTree x="50" y="130" scale="1.2" />
          <RoundTree x="120" y="135" scale="1" />
          <RoundTree x="180" y="125" scale="1.3" />
          <RoundTree x="280" y="140" scale="0.9" />
          <RoundTree x="350" y="130" scale="1.1" />
          <RoundTree x="450" y="135" scale="1.2" />
          <RoundTree x="520" y="125" scale="1" />
          <RoundTree x="620" y="140" scale="1.3" />
          <RoundTree x="700" y="130" scale="1.1" />
          <RoundTree x="750" y="135" scale="0.9" />
        </svg>
      </div>

      {/* Tech Overlay */}
      <div className="absolute top-6 left-6 flex gap-2 opacity-50 z-40">
        <div className="px-2 py-1 border border-pink-500/30 rounded-full text-[10px] text-pink-400 font-mono bg-pink-950/10">
          WIREFRAME_MODE
        </div>
      </div>
    </div>
  );
};

export default SkeletonNatureScene;
