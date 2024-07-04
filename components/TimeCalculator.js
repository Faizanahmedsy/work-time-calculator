"use client";

import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { TimePicker, InputNumber, Tooltip } from "antd";
import Background from "./Background";
import { QuestionCircleOutlined } from "@ant-design/icons";
import Link from "next/link";

function TimeCalculator() {
  const [currentTime, setCurrentTime] = useState(dayjs());
  const [completionTime, setCompletionTime] = useState("");
  const [arrivalTime, setArrivalTime] = useState(null);
  const [breakMinutes, setBreakMinutes] = useState(null);
  const [timeCompleted, setTimeCompleted] = useState(null);

  const workTimeInMinutes = 8 * 60 + 15; // Total minutes for 8 hours 15 minutes

  useEffect(() => {
    // Update the time every second
    const intervalId = setInterval(() => {
      const now = dayjs();
      setCurrentTime(now);
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (arrivalTime && breakMinutes !== null) {
      calculateCompletionTime();
      calculateTimeCompleted();
    }
  }, [arrivalTime, breakMinutes, currentTime]);

  const calculateCompletionTime = () => {
    if (arrivalTime && breakMinutes !== null) {
      const start = dayjs(arrivalTime, "HH:mm");
      const adjustedWorkTimeInMinutes = workTimeInMinutes + breakMinutes;
      const completion = start.add(adjustedWorkTimeInMinutes, "minute");
      setCompletionTime(completion.format("hh:mm A"));
    }
  };

  const calculateTimeCompleted = () => {
    if (arrivalTime && breakMinutes !== null) {
      const start = dayjs(arrivalTime, "HH:mm");
      const elapsedMinutes = currentTime.diff(start, "minute") - breakMinutes;

      if (elapsedMinutes <= 0) {
        setTimeCompleted("0 hours 0 minutes");
      } else {
        const completedHours = Math.floor(elapsedMinutes / 60);
        const completedMinutes = elapsedMinutes % 60;
        setTimeCompleted(`${completedHours} hours ${completedMinutes} minutes`);
      }
    }
  };

  return (
    <Background>
      <div className="flex flex-col h-screen justify-center items-center relative z-10 leading-5 tracking-wider gap-14">
        <div>
          <h1 className="text-6xl font-bold">
            {currentTime.format("hh:mm:ss a")}
          </h1>
        </div>
        <div className="flex flex-col gap-5">
          <div className="flex   gap-4">
            <div className="font-bold w-full">When did you come to office?</div>
            <TimePicker
              showSecond={false}
              format={"HH:mm"}
              showNow={false}
              placeholder="Enter Arrival Time"
              style={{
                width: "100%",
              }}
              onChange={(time, timeString) => setArrivalTime(timeString)}
            />
          </div>
          <div className="flex   gap-4">
            {/* <div className="flex justify-center items-center gap-4"></div> */}
            {/* <div className="flex justify-center items-center gap-4"> */}
            <div className="font-bold w-full">
              How many minutes did you take for break?
            </div>

            <InputNumber
              min={0}
              max={480}
              placeholder="Break Minutes"
              style={{
                width: "100%",
              }}
              onChange={(value) => setBreakMinutes(value)}
            />
          </div>
        </div>

        {/* </div> */}

        {completionTime && timeCompleted && (
          <div>
            <h1 className="text-2xl text-center font-bold">
              Work Time Completes at: {completionTime}
            </h1>
            <h3 className="text-md  text-center font-semibold text-zinc-500">
              Total work time you have completed till now: {timeCompleted}
            </h3>
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
      <div className="absolute bottom-6 right-10 text-zinc-500 text-sm">
        ⚠️ Note: Please do not blindly trust this tool. <br /> The developer has
        failed maths 5 times till now
      </div>
    </Background>
  );
}

export default TimeCalculator;
