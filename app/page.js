"use client";

import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { TimePicker, Tooltip } from "antd";
import Background from "./Background";
import { QuestionCircleOutlined } from "@ant-design/icons";

export default function Home() {
  const [currentTime, setCurrentTime] = useState("");
  const [remainingTime, setRemainingTime] = useState("");
  const [completionTime, setCompletionTime] = useState("");

  const workTimeInMinutes = 8 * 60 + 15; // Total minutes for 8 hours 15 minutes

  useEffect(() => {
    // Update the time every second
    const intervalId = setInterval(() => {
      setCurrentTime(dayjs().format("hh:mm:ss a"));
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const calculateRemainingTime = (timeString) => {
    if (timeString) {
      const current = dayjs();
      const completed = dayjs(timeString, "HH:mm");

      const completedTimeInMinutes = completed.hour() * 60 + completed.minute();
      const remaining = workTimeInMinutes - completedTimeInMinutes;

      if (remaining >= 0) {
        const remainingHours = Math.floor(remaining / 60);
        const remainingMinutes = remaining % 60;

        setRemainingTime(`${remainingHours} hours ${remainingMinutes} minutes`);

        const completion = current
          .add(remainingHours, "hour")
          .add(remainingMinutes, "minute");
        setCompletionTime(completion.format("hh:mm A"));
      } else {
        setRemainingTime("Work completed!");
        setCompletionTime("");
      }
    }
  };

  return (
    <Background>
      <div className="flex flex-col h-screen justify-center items-center relative z-10 font-mono gap-14">
        <div>
          <h1 className="text-3xl font-bold">{currentTime}</h1>
        </div>
        <div className="flex items-center gap-4">
          <TimePicker
            showSecond={false}
            format={"HH:mm"}
            showNow={false}
            placeholder="Select Completed Time"
            style={{
              width: 200,
            }}
            onChange={(time, timeString) => calculateRemainingTime(timeString)}
          />

          <div>
            <Tooltip title="Enter the hours you have completed" color="black">
              <QuestionCircleOutlined />
            </Tooltip>
          </div>
        </div>
        {/* <div>
          <h1 className="text-2xl font-bold">
            Remaining Time: {remainingTime}
          </h1>
        </div> */}
        {completionTime && (
          <div>
            <h1 className="text-2xl font-bold">
              Work Time Completes at: {completionTime}
            </h1>
          </div>
        )}

        <div className="absolute bottom-6">Developed with ❤️‍🔥 by Faizan</div>
      </div>
    </Background>
  );
}
