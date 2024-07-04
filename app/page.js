"use client";

import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { TimePicker, InputNumber, Tooltip } from "antd";
import Background from "./Background";
import { QuestionCircleOutlined } from "@ant-design/icons";
import Link from "next/link";

export default function Home() {
  const [currentTime, setCurrentTime] = useState("");
  const [completionTime, setCompletionTime] = useState("");
  const [arrivalTime, setArrivalTime] = useState(null);
  const [breakMinutes, setBreakMinutes] = useState(null);

  const workTimeInMinutes = 8 * 60 + 15; // Total minutes for 8 hours 15 minutes

  useEffect(() => {
    // Update the time every second
    const intervalId = setInterval(() => {
      setCurrentTime(dayjs().format("hh:mm:ss a"));
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (arrivalTime && breakMinutes !== null) {
      calculateCompletionTime();
    }
  }, [arrivalTime, breakMinutes]);

  const calculateCompletionTime = () => {
    if (arrivalTime && breakMinutes !== null) {
      const start = dayjs(arrivalTime, "HH:mm");
      const adjustedWorkTimeInMinutes = workTimeInMinutes + breakMinutes;
      const completion = start.add(adjustedWorkTimeInMinutes, "minute");
      setCompletionTime(completion.format("hh:mm A"));
    }
  };

  return (
    <Background>
      <div className="flex flex-col h-screen justify-center items-center relative z-10 leading-5 tracking-wider gap-14">
        <div>
          <h1 className="text-3xl font-bold">{currentTime}</h1>
        </div>
        <div className="flex items-center gap-4 flex-col">
          <div className="font-bold">When did you come to office?</div>
          <TimePicker
            showSecond={false}
            format={"HH:mm"}
            showNow={false}
            placeholder="Enter Arrival Time"
            style={{
              width: 200,
            }}
            onChange={(time, timeString) => setArrivalTime(timeString)}
          />
          <div className="font-bold">
            How many minutes did you took the break?
          </div>

          <InputNumber
            min={0}
            max={480}
            placeholder="Break Minutes"
            style={{
              width: 200,
            }}
            onChange={(value) => setBreakMinutes(value)}
          />
        </div>

        {completionTime && (
          <div>
            <h1 className="text-2xl font-bold">
              Work Time Completes at: {completionTime}
            </h1>
          </div>
        )}

        <div className="absolute bottom-6">
          Developed with ❤️‍🔥 by{" "}
          <Link
            href="https://faizansaiyed.vercel.app/v-2"
            className="font-bold"
            target="_blank"
          >
            Faizan
          </Link>
        </div>
      </div>
      <div className="absolute bottom-6 left-10 text-zinc-500">
        <Link
          href="https://github.com/Faizanahmedsy/work-time-calculator"
          target="_blank"
        >
          Give a Star on Github
        </Link>
      </div>
    </Background>
  );
}
