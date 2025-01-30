"use client";
import React from "react";
import Background from "../Background";
import { Construction } from "lucide-react"; // Lucide's Construction icon
import { motion } from "framer-motion"; // For animations

export default function HomeLayout() {
  return (
    <Background>
      <div className="flex flex-col h-screen justify-center items-center relative z-10 leading-5 tracking-wider gap-14">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center"
        >
          <Construction className="w-16 h-16 text-blue-500 mb-4 mx-auto animate-spin-slow" />{" "}
          {/* Spinning construction icon */}
          <h1 className="text-4xl font-bold text-white mb-2">
            Work in Progress
          </h1>
          <p className="text-lg text-gray-400">
            We&apos;re currently working on something amazing!
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center"
        >
          <p className="text-sm text-gray-500">
            Stay tuned for updates. We&apos;ll be launching soon.
          </p>
        </motion.div>

        {/* Optional: Add a progress bar or countdown timer */}
        {/* <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden mt-4"
        >
          <div
            className="h-full bg-blue-500 rounded-full"
            style={{ width: "60%" }} // Example progress
          ></div>
        </motion.div> */}
      </div>
    </Background>
  );
}
