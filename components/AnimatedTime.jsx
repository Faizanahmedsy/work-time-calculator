import React from "react";
import { motion } from "framer-motion";
import dayjs from "dayjs";

const AnimatedTimeDisplay = ({ currentTime }) => {
  const timeUnits = {
    hours: currentTime.format("hh"),
    minutes: currentTime.format("mm"),
    seconds: currentTime.format("ss"),
    period: currentTime.format("A"),
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1,
      },
    },
  };

  const numberVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24,
      },
    },
  };

  const separatorVariants = {
    animate: {
      scale: [1, 1.2, 1],
      opacity: [1, 0.5, 1],
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  const periodVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 20,
      },
    },
  };

  return (
    <motion.div
      className="flex items-center justify-center gap-2"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        className="flex items-center bg-black/10 backdrop-blur-md rounded-2xl p-8 shadow-xl"
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      >
        <motion.span
          className="text-6xl font-bold tabular-nums"
          variants={numberVariants}
        >
          {timeUnits.hours}
        </motion.span>

        <motion.span
          className="text-6xl font-bold mx-2"
          variants={separatorVariants}
          animate="animate"
        >
          :
        </motion.span>

        <motion.span
          className="text-6xl font-bold tabular-nums"
          variants={numberVariants}
        >
          {timeUnits.minutes}
        </motion.span>

        <motion.span
          className="text-6xl font-bold mx-2"
          variants={separatorVariants}
          animate="animate"
        >
          :
        </motion.span>

        <motion.span
          className="text-6xl font-bold tabular-nums"
          variants={numberVariants}
        >
          {timeUnits.seconds}
        </motion.span>

        <motion.span
          className="text-2xl font-bold ml-4 text-gray-600"
          variants={periodVariants}
        >
          {timeUnits.period}
        </motion.span>
      </motion.div>
    </motion.div>
  );
};

export default AnimatedTimeDisplay;
