"use client";
import dayjs from "dayjs";
import Link from "next/link";
import { X } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import confetti from "canvas-confetti";
import Background from "./Background";
import { TimePickerDemo } from "./shadcn-timepicker/timepicker-demo";
import AnimatedTimeDisplay from "./AnimatedTime";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";

function TimeCalculator() {
  const [currentTime, setCurrentTime] = useState(dayjs());
  const [completionTime, setCompletionTime] = useState("");
  const [arrivalTime, setArrivalTime] = useState(undefined);
  const [firstBreak, setFirstBreak] = useState(new Date(0, 0, 0, 0, 0, 0));
  const [breaks, setBreaks] = useState([]);
  const [timeCompleted, setTimeCompleted] = useState(null);

  const workTimeInMinutes = 8 * 60 + 15; // 8 hours 15 minutes

  // const scalar = 2;
  // var timer = confetti.shapeFromText({ text: "⌛", scalar });
  // const watches = confetti.shapeFromText({ text: "⌚", scalar });
  // const faizan = confetti.shapeFromText({ text: "faizan", scalar });
  const triggerConfetti = () => {
    confetti({
      // shapes: [watches, timer, faizan],
      // scalar: 2,
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#a864fd", "#29cdff", "#78ff44", "#ff718d", "#fdff6a"],
      duration: 3000,
    });

    setTimeout(() => {
      confetti.reset();
    }, 7000);
  };

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
    const firstBreakMinutes =
      firstBreak.getHours() * 60 + firstBreak.getMinutes();
    const additionalBreaksMinutes = breaks.reduce((total, breakItem) => {
      return (
        total +
        (breakItem.duration.getHours() * 60 + breakItem.duration.getMinutes())
      );
    }, 0);
    return firstBreakMinutes + additionalBreaksMinutes;
  }, [firstBreak, breaks]);

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
        const timeCompletedText = `${completedHours} hours ${completedMinutes} minutes`;
        setTimeCompleted(timeCompletedText);

        console.log("firstBreak", firstBreak);
        const firstBreakMinutes =
          firstBreak.getHours() * 60 + firstBreak.getMinutes();

        console.log("firstBreakMinutes", firstBreakMinutes);

        // Trigger confetti when work hours are completed
        if (
          completedHours >= 8 &&
          completedMinutes >= 15 &&
          firstBreakMinutes > 0 &&
          breaks.length == 0
        ) {
          triggerConfetti();
        }
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
    firstBreak,
    breaks,
    calculateCompletionTime,
    calculateTimeCompleted,
    currentTime,
  ]);

  return (
    <Background>
      <div className="flex flex-col h-screen justify-center items-center relative z-10 leading-5 tracking-wider gap-10">
        {breaks.length === 0 && (
          <div>
            <h1 className="text-6xl font-bold">
              <AnimatedTimeDisplay currentTime={currentTime} />
            </h1>
          </div>
        )}
        <div className="flex flex-col gap-6 w-full max-w-2xl">
          <div className="flex gap-4 justify-between items-center">
            <div className="font-medium text-white">
              At what time did you come to the office?{" "}
              <div className="text-xs opacity-80">(24-hour time format)</div>
            </div>
            <TimePickerDemo
              date={arrivalTime}
              setDate={setArrivalTime}
              showSeconds={false}
            />
          </div>

          <div className="flex gap-4 justify-between items-center">
            <div className="font-medium text-white">First Break Duration</div>
            <TimePickerDemo
              date={firstBreak}
              setDate={setFirstBreak}
              showMinutes={true}
              showSeconds={false}
            />
          </div>

          <div className="space-y-4">
            {breaks.length > 0 && (
              <ScrollArea className="h-64 w-full rounded-2xl  p-4 bg-transparent backdrop-blur-sm">
                <div className="space-y-3">
                  {breaks.map((breakItem, index) => (
                    <div
                      key={breakItem.id}
                      className="flex items-center justify-between gap-3 bg-transparent backdrop-blur-sm p-3 rounded-lg"
                    >
                      <span className="text-sm font-medium text-white">
                        Break {index + 2}
                      </span>
                      <div className="flex gap-4">
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
                          className="text-red-500 hover:text-red-400 transition-colors duration-200"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            <div className="flex justify-end">
              <Button onClick={addBreak}>Add Break</Button>
            </div>
          </div>
        </div>

        {completionTime && timeCompleted && (
          <div>
            <h1 className="text-2xl text-center font-bold text-white">
              Work Time Completes at: {completionTime}
            </h1>
            <h3 className="text-md text-center font-semibold text-gray-400">
              Total work time you have completed till now: {timeCompleted}
            </h3>
          </div>
        )}

        <div className="absolute bottom-6 text-white">
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
      <div className="absolute bottom-6 left-10 text-gray-400">
        <Link
          href="https://github.com/Faizanahmedsy/work-time-calculator"
          target="_blank"
        >
          Give a Star on Github
        </Link>
      </div>
      <div className="absolute bottom-6 right-10 text-gray-400 text-sm">
        ⚠️ Note: Please do not blindly trust this tool. <br /> The developer has
        failed maths 5 times till now
      </div>
    </Background>
  );
}

export default TimeCalculator;
