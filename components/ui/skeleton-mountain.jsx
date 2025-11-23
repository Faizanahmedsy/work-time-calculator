"use client";

import React from "react";
import { motion } from "framer-motion";
import SkeletonNatureScene from "./skeleton-nature-scene";

export function SkeletonMountain({ children }) {
  return (
    <div className="relative min-h-screen bg-black overflow-hidden flex items-center justify-center">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

        {/* The Nature Scene Visualizer (Background) */}
        <div className="absolute inset-x-4 bottom-4 top-20 opacity-100">
          <SkeletonNatureScene />
        </div>
      </div>

      {/* Main Content Wrapper */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 flex flex-col items-center justify-center min-h-screen">
        {/* The Timer Form (Children) */}
        <div className="w-full max-w-lg relative">
          {/* Glow Effect behind form */}
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-3xl blur opacity-20" />
          {children}
        </div>
      </div>
    </div>
  );
}

export default SkeletonMountain;
