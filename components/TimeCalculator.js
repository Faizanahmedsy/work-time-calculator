"use client";
import dayjs from "dayjs";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import Background from "./Background";
import { TimePickerDemo } from "./shadcn-timepicker/timepicker-demo";
import AnimatedTimeDisplay from "./AnimatedTime";
import { ScrollArea } from "./ui/scroll-area";

function TimeCalculator() {
  const [currentTime, setCurrentTime] = useState(dayjs());
  const [completionTime, setCompletionTime] = useState("");
  const [arrivalTime, setArrivalTime] = useState(undefined);
  const [breaks, setBreaks] = useState([]);
  const [timeCompleted, setTimeCompleted] = useState(null);

  const workTimeInMinutes = 8 * 60 + 15; // 8 hours 15 minutes

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(dayjs());
    }, 1000);
    return () => clearInterval(intervalId);
  }, []);

  const addBreak = () => {
    setBreaks([
      ...breaks,
      {
        id: Date.now(),
        duration: new Date(0, 0, 0, 0, 0, 0),
      },
    ]);
  };

  const updateBreak = (id, newBreakDuration) => {
    const updatedBreaks = breaks.map((breakItem) =>
      breakItem.id === id
        ? { ...breakItem, duration: newBreakDuration }
        : breakItem
    );
    setBreaks(updatedBreaks);
  };

  const removeBreak = (id) => {
    const updatedBreaks = breaks.filter((breakItem) => breakItem.id !== id);
    setBreaks(updatedBreaks);
  };

  const calculateTotalBreakMinutes = useCallback(() => {
    return breaks.reduce((total, breakItem) => {
      return (
        total +
        (breakItem.duration.getHours() * 60 + breakItem.duration.getMinutes())
      );
    }, 0);
  }, [breaks]);

  const calculateCompletionTime = useCallback(() => {
    if (arrivalTime) {
      const totalBreakMinutes = calculateTotalBreakMinutes();
      const adjustedWorkTimeInMinutes = workTimeInMinutes + totalBreakMinutes;
      const completion = dayjs(arrivalTime).add(
        adjustedWorkTimeInMinutes,
        "minute"
      );
      setCompletionTime(completion.format("hh:mm A"));
    }
  }, [arrivalTime, calculateTotalBreakMinutes, workTimeInMinutes]);

  const calculateTimeCompleted = useCallback(() => {
    if (arrivalTime) {
      const totalBreakMinutes = calculateTotalBreakMinutes();
      const elapsedMinutes =
        currentTime.diff(arrivalTime, "minute") - totalBreakMinutes;

      if (elapsedMinutes <= 0) {
        setTimeCompleted("0 hours 0 minutes");
      } else {
        const completedHours = Math.floor(elapsedMinutes / 60);
        const completedMinutes = elapsedMinutes % 60;
        setTimeCompleted(`${completedHours} hours ${completedMinutes} minutes`);
      }
    }
  }, [arrivalTime, calculateTotalBreakMinutes, currentTime]);

  useEffect(() => {
    if (arrivalTime) {
      calculateCompletionTime();
      calculateTimeCompleted();
    }
  }, [
    arrivalTime,
    breaks,
    calculateCompletionTime,
    calculateTimeCompleted,
    currentTime,
  ]);

  return (
    <Background>
      <div className="flex flex-col h-screen justify-center items-center relative z-10 leading-5 tracking-wider gap-10">
        <div>
          <h1 className="text-6xl font-bold">
            <AnimatedTimeDisplay currentTime={currentTime} />
          </h1>
        </div>
        <div className="flex flex-col gap-6 w-full max-w-2xl">
          <div className="flex gap-4 justify-between items-center">
            <div className="font-medium">
              At what time did you come to the office?
            </div>
            <TimePickerDemo
              date={arrivalTime}
              setDate={setArrivalTime}
              showSeconds={false}
            />
          </div>
          <div className="space-y-4">
            {breaks.length > 0 && (
              <ScrollArea className="h-64 w-full rounded-md border p-4">
                <div className="space-y-3">
                  {breaks.map((breakItem, index) => (
                    <div
                      key={breakItem.id}
                      className="flex items-center gap-3 bg-gray-900 p-3 rounded-lg"
                    >
                      <span className="text-sm font-medium">
                        Break {index + 1}
                      </span>
                      <TimePickerDemo
                        date={breakItem.duration}
                        setDate={(newBreakDuration) =>
                          updateBreak(breakItem.id, newBreakDuration)
                        }
                        showMinutes={true}
                        showSeconds={false}
                      />
                      <button
                        onClick={() => removeBreak(breakItem.id)}
                        className="bg-red-500 text-white px-2 py-1 rounded text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            <div className="flex justify-end">
              <button
                onClick={addBreak}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Add Break
              </button>
            </div>
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
