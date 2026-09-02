import { assets } from "@/utils/assets";
import { cn } from "@/utils/cn";
import { frameworks } from "@/utils/frameworks";
import React, { useEffect, useRef, useState } from "react";

const Background = ({ children }) => {
  const [currentFramework, setCurrentFramework] = useState(frameworks[0]);
  const [showBackground, setShowBackground] = useState(false);
  const buttonRef = useRef(null);

  useEffect(() => {
    let currentIndex = 0;
    const rotateFrameworks = () => {
      setCurrentFramework(frameworks[currentIndex]);
      currentIndex = (currentIndex + 1) % frameworks.length;
    };
    const intervalId = setInterval(rotateFrameworks, 2000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    setShowBackground(true);
  }, []);

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 transition-color delay-100 duration-700 opacity-25 pointer-events-none",
          {
            "bg-purple-300": currentFramework === "qwik",
            "bg-sky-300": currentFramework === "safari",
            "bg-yellow-300": currentFramework === "chrome",
            "bg-teal-300": currentFramework === "tailwind",
            "bg-blue-300": currentFramework === "react",
            "bg-green-300": currentFramework === "vue",
            "bg-orange-400": currentFramework === "svelte",
            "bg-red-300": currentFramework === "mobile",
            "bg-neutral-300": currentFramework === "desktop",
          }
        )}
      />
      <div
        className="fixed inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: `url(${assets.square})`,
          backgroundSize: "30px",
        }}
      />
      {/* Was a remote SVG through next/image; the optimizer rejected it and the
          browser painted the alt text in the corner. A CSS gradient keeps the
          same depth with nothing to fetch and nothing to fail. */}
      <div
        aria-hidden
        className="fixed inset-0 w-screen h-screen pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(60% 50% at 20% 0%, rgba(99,102,241,0.16), transparent 70%)," +
            "radial-gradient(50% 45% at 85% 15%, rgba(56,189,248,0.10), transparent 70%)," +
            "radial-gradient(70% 60% at 50% 100%, rgba(0,0,0,0.55), transparent 70%)",
        }}
      />

      <div
        className={cn(
          "bg-black fixed inset-0 transition-opacity duration-[1500ms] pointer-events-none",
          !showBackground ? "opacity-100" : "opacity-0"
        )}
      ></div>

      {children}
    </>
  );
};

export default Background;
