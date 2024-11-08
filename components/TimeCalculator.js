"use client";

import dayjs from "dayjs";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import Background from "./Background";
import { TimePickerDemo } from "./shadcn-timepicker/timepicker-demo";
import AnimatedTimeDisplay from "./AnimatedTime";

function TimeCalculator() {
  const [currentTime, setCurrentTime] = useState(dayjs());
  const [completionTime, setCompletionTime] = useState("");
  const [arrivalTime, setArrivalTime] = useState(undefined);
  const [breakDuration, setBreakDuration] = useState(
    new Date(0, 0, 0, 0, 0, 0)
  );
  const [timeCompleted, setTimeCompleted] = useState(null);

  const workTimeInMinutes = 8 * 60 + 15; // 8 hours 15 minutes

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(dayjs());
    }, 1000);
    return () => clearInterval(intervalId);
  }, []);



  const calculateCompletionTime = useCallback(() => {
    if (arrivalTime && breakDuration) {
      const breakMinutes =
        breakDuration.getHours() * 60 + breakDuration.getMinutes();
      const adjustedWorkTimeInMinutes = workTimeInMinutes + breakMinutes;
      const completion = dayjs(arrivalTime).add(
        adjustedWorkTimeInMinutes,
        "minute"
      );
      setCompletionTime(completion.format("hh:mm A"));
    }
  }, [arrivalTime, breakDuration, workTimeInMinutes]);

  const calculateTimeCompleted = useCallback(() => {
    if (arrivalTime && breakDuration) {
      const breakMinutes =
        breakDuration.getHours() * 60 + breakDuration.getMinutes();
      const elapsedMinutes =
        currentTime.diff(arrivalTime, "minute") - breakMinutes;

      if (elapsedMinutes <= 0) {
        setTimeCompleted("0 hours 0 minutes");
      } else {
        const completedHours = Math.floor(elapsedMinutes / 60);
        const completedMinutes = elapsedMinutes % 60;
        setTimeCompleted(`${completedHours} hours ${completedMinutes} minutes`);
      }
    }
  }, [arrivalTime, breakDuration, currentTime]);

    useEffect(() => {
    if (arrivalTime) {
      calculateCompletionTime();
      calculateTimeCompleted();
    }
  }, [arrivalTime, breakDuration, calculateCompletionTime, calculateTimeCompleted, currentTime]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
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

  return (
    <Background>
      <div className="flex flex-col h-screen justify-center items-center relative z-10 leading-5 tracking-wider gap-14">
        <div>
          <h1 className="text-6xl font-bold">
            {/* {currentTime.format("hh:mm:ss a")} */}
            <AnimatedTimeDisplay currentTime={currentTime} />
          </h1>
        </div>
        <div className="flex flex-col gap-5">
          <div className="flex gap-4 justify-center items-center">
            <div className="font-medium w-full">
              At what time did you come to the office?
            </div>
            <TimePickerDemo
              date={arrivalTime}
              setDate={setArrivalTime}
              showSeconds={false} // Show only hours and minutes
            />
          </div>
          <div className="flex gap-4 justify-center items-center">
            <div className="font-medium w-full">How long was your break?</div>
            <TimePickerDemo
              date={breakDuration}
              setDate={setBreakDuration}
              showMinutes={true} // Show hours and minutes only
              showSeconds={false} // Hide seconds
            />
          </div>
        </div>

        {completionTime && timeCompleted && (
          <div>
            <h1 className="text-2xl text-center font-bold">
              Work Time Completes at: {completionTime}
            </h1>
            <h3 className="text-md text-center font-semibold text-zinc-500">
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
