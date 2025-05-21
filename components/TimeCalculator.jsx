"use client";
import confetti from "canvas-confetti";
import dayjs from "dayjs";
import { Settings, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import AnimatedTimeDisplay from "./AnimatedTime";
import Background from "./Background";
import { TimePickerDemo } from "./shadcn-timepicker/timepicker-demo";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { ScrollArea } from "./ui/scroll-area";

function TimeCalculator() {
  const [currentTime, setCurrentTime] = useState(dayjs());
  const [completionTime, setCompletionTime] = useState("");
  const [arrivalTime, setArrivalTime] = useState(undefined);
  const [firstBreak, setFirstBreak] = useState(new Date(0, 0, 0, 0, 0, 0));
  const [breaks, setBreaks] = useState([]);
  const [timeCompleted, setTimeCompleted] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [workMode, setWorkMode] = useState("full"); // "full" or "half"
  const [showSettings, setShowSettings] = useState(false);

  // Default work times (in minutes)
  const defaultFullDayMinutes = 8 * 60 + 15; // 8h15m
  const defaultHalfDayMinutes = 4 * 60 + 15; // 4h15m

  // Custom work times
  const [fullDayHours, setFullDayHours] = useState(8);
  const [fullDayMinutes, setFullDayMinutes] = useState(15);
  const [halfDayHours, setHalfDayHours] = useState(4);
  const [halfDayMinutes, setHalfDayMinutes] = useState(15);

  // Work time based on selected mode
  const getWorkTimeInMinutes = () => {
    if (workMode === "full") {
      return fullDayHours * 60 + fullDayMinutes;
    } else {
      return halfDayHours * 60 + halfDayMinutes;
    }
  };

  const triggerConfetti = () => {
    confetti({
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
      const workTimeInMinutes = getWorkTimeInMinutes();
      const adjustedWorkTimeInMinutes = workTimeInMinutes + totalBreakMinutes;
      const completion = dayjs(arrivalTime).add(
        adjustedWorkTimeInMinutes,
        "minute"
      );
      setCompletionTime(completion.format("hh:mm A"));
    }
  }, [
    arrivalTime,
    calculateTotalBreakMinutes,
    workMode,
    fullDayHours,
    fullDayMinutes,
    halfDayHours,
    halfDayMinutes,
  ]);

  const calculateTimeCompletedAndRemaining = useCallback(() => {
    if (arrivalTime) {
      const totalBreakMinutes = calculateTotalBreakMinutes();
      const elapsedMinutes =
        currentTime.diff(arrivalTime, "minute") - totalBreakMinutes;
      const workTimeInMinutes = getWorkTimeInMinutes();

      // Calculate time completed
      if (elapsedMinutes <= 0) {
        setTimeCompleted("0 hours 0 minutes");
        setTimeRemaining(
          `${Math.floor(workTimeInMinutes / 60)} hours ${
            workTimeInMinutes % 60
          } minutes`
        );
      } else {
        const completedHours = Math.floor(elapsedMinutes / 60);
        const completedMinutes = elapsedMinutes % 60;
        const timeCompletedText = `${completedHours} hours ${completedMinutes} minutes`;
        setTimeCompleted(timeCompletedText);

        // Calculate time remaining
        const remainingMinutes = Math.max(
          0,
          workTimeInMinutes - elapsedMinutes
        );
        const remainingHours = Math.floor(remainingMinutes / 60);
        const remainingMins = remainingMinutes % 60;
        const timeRemainingText =
          remainingMinutes > 0
            ? `${remainingHours} hours ${remainingMins} minutes`
            : "0 hours 0 minutes (Completed!)";
        setTimeRemaining(timeRemainingText);

        const firstBreakMinutes =
          firstBreak.getHours() * 60 + firstBreak.getMinutes();
        const requiredHours = Math.floor(workTimeInMinutes / 60);
        const requiredMinutes = workTimeInMinutes % 60;

        // Trigger confetti when work hours are completed
        if (
          (completedHours > requiredHours ||
            (completedHours === requiredHours &&
              completedMinutes >= requiredMinutes)) &&
          firstBreakMinutes > 0 &&
          breaks.length == 0
        ) {
          triggerConfetti();
        }
      }
    }
  }, [
    arrivalTime,
    calculateTotalBreakMinutes,
    currentTime,
    workMode,
    fullDayHours,
    fullDayMinutes,
    halfDayHours,
    halfDayMinutes,
  ]);

  useEffect(() => {
    if (arrivalTime) {
      calculateCompletionTime();
      calculateTimeCompletedAndRemaining();
    }
  }, [
    arrivalTime,
    firstBreak,
    breaks,
    calculateCompletionTime,
    calculateTimeCompletedAndRemaining,
    currentTime,
    workMode,
    fullDayHours,
    fullDayMinutes,
    halfDayHours,
    halfDayMinutes,
  ]);

  const handleFullDayHoursChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    setFullDayHours(value);
  };

  const handleFullDayMinutesChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    setFullDayMinutes(Math.min(59, value));
  };

  const handleHalfDayHoursChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    setHalfDayHours(value);
  };

  const handleHalfDayMinutesChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    setHalfDayMinutes(Math.min(59, value));
  };

  const resetToDefaults = () => {
    setFullDayHours(8);
    setFullDayMinutes(15);
    setHalfDayHours(4);
    setHalfDayMinutes(15);
  };

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
          {/* Settings Button */}
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(true)}
              className="text-white hover:bg-gray-700/40"
            >
              <Settings className="h-5 w-5" />
              <span className="sr-only">Settings</span>
            </Button>
          </div>

          {/* Settings Dialog */}
          <Dialog
            open={showSettings}
            onOpenChange={setShowSettings}
            className="rounded-full"
          >
            <DialogContent className="bg-gray-800/10 backdrop-blur-md border border-gray-700 text-white rounded-3xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-white">
                  Work Time Settings
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-200 mb-2">
                    Full Day Work Time
                  </h4>
                  <div className="flex gap-3 items-center">
                    <div className="flex flex-col">
                      <Label
                        htmlFor="fullDayHours"
                        className="text-xs text-gray-300 mb-1"
                      >
                        Hours
                      </Label>
                      <Input
                        id="fullDayHours"
                        type="number"
                        min="0"
                        max="24"
                        value={fullDayHours}
                        onChange={handleFullDayHoursChange}
                        className="w-20 bg-gray-700/50 border-gray-600"
                      />
                    </div>
                    <span className="text-white mt-6">:</span>
                    <div className="flex flex-col">
                      <Label
                        htmlFor="fullDayMinutes"
                        className="text-xs text-gray-300 mb-1"
                      >
                        Minutes
                      </Label>
                      <Input
                        id="fullDayMinutes"
                        type="number"
                        min="0"
                        max="59"
                        value={fullDayMinutes}
                        onChange={handleFullDayMinutesChange}
                        className="w-20 bg-gray-700/50 border-gray-600"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-200 mb-2">
                    Half Day Work Time
                  </h4>
                  <div className="flex gap-3 items-center">
                    <div className="flex flex-col">
                      <Label
                        htmlFor="halfDayHours"
                        className="text-xs text-gray-300 mb-1"
                      >
                        Hours
                      </Label>
                      <Input
                        id="halfDayHours"
                        type="number"
                        min="0"
                        max="24"
                        value={halfDayHours}
                        onChange={handleHalfDayHoursChange}
                        className="w-20 bg-gray-700/50 border-gray-600"
                      />
                    </div>
                    <span className="text-white mt-6">:</span>
                    <div className="flex flex-col">
                      <Label
                        htmlFor="halfDayMinutes"
                        className="text-xs text-gray-300 mb-1"
                      >
                        Minutes
                      </Label>
                      <Input
                        id="halfDayMinutes"
                        type="number"
                        min="0"
                        max="59"
                        value={halfDayMinutes}
                        onChange={handleHalfDayMinutesChange}
                        className="w-20 bg-gray-700/50 border-gray-600"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={resetToDefaults}
                  className="text-gray-300 border-gray-600 hover:bg-gray-700 rounded-full"
                >
                  Reset to Defaults
                </Button>
                <Button
                  onClick={() => setShowSettings(false)}
                  className="bg-cyan-900 hover:bg-cyan-600 text-cyan-200 rounded-full"
                >
                  Save Settings
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Work Mode Selection */}
          <div className="flex gap-4 justify-between items-center">
            <div className="font-medium text-white">Work Mode</div>
            <RadioGroup
              defaultValue="full"
              value={workMode}
              onValueChange={setWorkMode}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="full" id="full" />
                <Label htmlFor="full" className="text-white">
                  Full Day ({fullDayHours}h {fullDayMinutes}m)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="half" id="half" />
                <Label htmlFor="half" className="text-white">
                  Half Day ({halfDayHours}h {halfDayMinutes}m)
                </Label>
              </div>
            </RadioGroup>
          </div>

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
              <ScrollArea className="h-64 w-full rounded-2xl p-4 bg-transparent backdrop-blur-sm">
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
              <Button onClick={addBreak} className="rounded-full">
                Add Break
              </Button>
            </div>
          </div>
        </div>

        {completionTime && timeCompleted && (
          <div className="space-y-2">
            <h1 className="text-2xl text-center font-bold text-white">
              Work Time Completes at: {completionTime}
            </h1>
            <h3 className="text-md text-center font-semibold text-gray-400">
              Total work time you have completed till now: {timeCompleted}
            </h3>
            <h3 className="text-md text-center font-semibold text-green-400">
              Remaining work time: {timeRemaining}
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
        failed maths 7 times till now
      </div>
    </Background>
  );
}

export default TimeCalculator;
