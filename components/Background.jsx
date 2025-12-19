import { assets } from "@/utils/assets";
import { cn } from "@/utils/cn";
import { frameworks } from "@/utils/frameworks";
import Image from "next/image";
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
      <Image
        width={1200}
        height={1200}
        role="presentation"
        alt="gradiant background"
        className="fixed inset-0 w-screen h-screen object-cover pointer-events-none"
        src={assets.gradient}
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
