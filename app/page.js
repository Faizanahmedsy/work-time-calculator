"use client";

import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { TimePicker } from "antd";

export default function Home() {
  const [currentTime, setCurrentTime] = useState("");
  const [completedTime, setCompletedTime] = useState("");
  const [remainingTime, setRemainingTime] = useState("");

  const workTimeInMinutes = 8 * 60 + 15; // Total minutes for 8 hours 15 minutes

  useEffect(() => {
    // Update the time every second
    const intervalId = setInterval(() => {
      setCurrentTime(dayjs().format("HH:mm:ss"));
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const calculateRemainingTime = (timeString) => {
    if (timeString) {
      const [hours, minutes] = timeString.split(":");
      const completedTimeInMinutes = parseInt(hours) * 60 + parseInt(minutes);
      const remaining = workTimeInMinutes - completedTimeInMinutes;

      const remainingHours = Math.floor(remaining / 60);
      const remainingMinutes = remaining % 60;

      setRemainingTime(`${remainingHours} hours ${remainingMinutes} minutes`);
    }
  };

  return (
    <>
      <div className="flex flex-col h-screen justify-center items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">{currentTime}</h1>
        </div>
        <div>
          <TimePicker
            showSecond={false}
            onChange={(time, timeString) => calculateRemainingTime(timeString)}
          />
        </div>
        <div>
          <h1 className="text-3xl font-bold">
            Remaining Time: {remainingTime}
          </h1>
        </div>
      </div>
    </>
  );
}
