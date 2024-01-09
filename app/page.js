"use client";

import { useState, useEffect } from "react";
import dayjs from "dayjs";

export default function Home() {
  const [currentTime, setCurrentTime] = useState(dayjs().format("HH:mm:ss"));

  useEffect(() => {
    // Update the time every second
    const intervalId = setInterval(() => {
      setCurrentTime(dayjs().format("HH:mm:ss"));
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <>
      <div className="flex flex-col h-screen justify-center items-center">
        <h1 className="text-3xl font-bold">{currentTime}</h1>
      </div>
    </>
  );
}
