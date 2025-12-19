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
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { ScrollArea } from "./ui/scroll-area";
import { ThemeDialog } from "./global/ThemeDialog";
import { ThemeButton } from "./global/ThemeButton";
import { useWorkTimeStore } from "@/store/workTimeStore";

function TimeCalculator() {
  // Zustand store
  const {
    arrivalTime,
    workMode,
    firstBreak,
    breaks,
    fullDayHours,
    fullDayMinutes,
    halfDayHours,
    halfDayMinutes,
    completionTime,
    timeCompleted,
    timeRemaining,
    setArrivalTime,
    setWorkMode,
    setFirstBreak,
    addBreak,
    updateBreak,
    removeBreak,
    setFullDayTime,
    setHalfDayTime,
    setCalculationResults,
    resetToDefaults,
    checkAndResetIfNewDay,
  } = useWorkTimeStore();

  // Local UI state
  const [currentTime, setCurrentTime] = useState(dayjs());
  const [showSettings, setShowSettings] = useState(false);

  // Check and reset if new day on mount
  useEffect(() => {
    checkAndResetIfNewDay();
  }, [checkAndResetIfNewDay]);

  // Ensure dates are properly initialized (convert null to undefined for TimePicker)
  const safeArrivalTime = arrivalTime || undefined;
  const safeFirstBreak = firstBreak || new Date(0, 0, 0, 0, 0, 0);

  // Work time based on selected mode
  const getWorkTimeInMinutes = useCallback(() => {
    if (workMode === "full") {
      return fullDayHours * 60 + fullDayMinutes;
    } else {
      return halfDayHours * 60 + halfDayMinutes;
    }
  }, [workMode, fullDayHours, fullDayMinutes, halfDayHours, halfDayMinutes]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(dayjs());
    }, 1000);
    return () => clearInterval(intervalId);
  }, []);

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
      return completion.format("hh:mm A");
    }
    return "";
  }, [arrivalTime, calculateTotalBreakMinutes, getWorkTimeInMinutes]);

  const calculateTimeCompletedAndRemaining = useCallback(() => {
    if (arrivalTime) {
      const totalBreakMinutes = calculateTotalBreakMinutes();
      const elapsedMinutes =
        currentTime.diff(arrivalTime, "minute") - totalBreakMinutes;
      const workTimeInMinutes = getWorkTimeInMinutes();

      let timeCompletedText;
      let timeRemainingText;

      // Calculate time completed
      if (elapsedMinutes <= 0) {
        timeCompletedText = "0 hours 0 minutes";
        timeRemainingText = `${Math.floor(workTimeInMinutes / 60)} hours ${
          workTimeInMinutes % 60
        } minutes`;
      } else {
        const completedHours = Math.floor(elapsedMinutes / 60);
        const completedMinutes = elapsedMinutes % 60;
        timeCompletedText = `${completedHours} hours ${completedMinutes} minutes`;

        // Calculate time remaining
        const remainingMinutes = Math.max(
          0,
          workTimeInMinutes - elapsedMinutes
        );
        const remainingHours = Math.floor(remainingMinutes / 60);
        const remainingMins = remainingMinutes % 60;
        timeRemainingText =
          remainingMinutes > 0
            ? `${remainingHours} hours ${remainingMins} minutes`
            : "0 hours 0 minutes (Completed!)";
      }

      return {
        timeCompleted: timeCompletedText,
        timeRemaining: timeRemainingText,
      };
    }
    return { timeCompleted: null, timeRemaining: null };
  }, [
    arrivalTime,
    calculateTotalBreakMinutes,
    currentTime,

    getWorkTimeInMinutes,
  ]);

  useEffect(() => {
    if (arrivalTime) {
      const newCompletionTime = calculateCompletionTime();
      const {
        timeCompleted: newTimeCompleted,
        timeRemaining: newTimeRemaining,
      } = calculateTimeCompletedAndRemaining();

      // Save results to store
      setCalculationResults({
        completionTime: newCompletionTime,
        timeCompleted: newTimeCompleted,
        timeRemaining: newTimeRemaining,
      });
    }
  }, [
    arrivalTime,
    firstBreak,
    breaks,
    calculateCompletionTime,
    calculateTimeCompletedAndRemaining,
    currentTime,
    setCalculationResults,
  ]);

  const handleFullDayHoursChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    setFullDayTime(value, fullDayMinutes);
  };

  const handleFullDayMinutesChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    setFullDayTime(fullDayHours, Math.min(59, value));
  };

  const handleHalfDayHoursChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    setHalfDayTime(value, halfDayMinutes);
  };

  const handleHalfDayMinutesChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    setHalfDayTime(halfDayHours, Math.min(59, value));
  };

  return (
    <Background>
      <div className="flex flex-col h-screen justify-center items-center relative z-10 leading-5 tracking-wider gap-10">
        {/* {breaks.length === 0 && (
          <div>
            <h1 className="text-6xl font-bold">
              <AnimatedTimeDisplay currentTime={currentTime} />
            </h1>
          </div>
        )} */}

        {/* Feature Announcement Banner */}
        <Link
          href="/changelog"
          className="group max-w-2xl w-full bg-gradient-to-r from-cyan-900/30 to-blue-900/30 backdrop-blur-sm border border-cyan-700/30 rounded-2xl p-4 hover:from-cyan-900/40 hover:to-blue-900/40 transition-all duration-300 cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center border border-cyan-500/30">
                <span className="text-xl">✨</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-cyan-200 group-hover:text-cyan-100">
                New Feature: Time saved locally!
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Your data now persists across refreshes. Click to learn more →
              </p>
            </div>
          </div>
        </Link>
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
          <ThemeDialog
            open={showSettings}
            onOpenChange={setShowSettings}
            title="Work Time Settings"
            footer={
              <>
                <ThemeButton variant="outline" onClick={resetToDefaults}>
                  Reset to Defaults
                </ThemeButton>
                <ThemeButton
                  variant="primary"
                  onClick={() => setShowSettings(false)}
                >
                  Save Settings
                </ThemeButton>
              </>
            }
          >
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
          </ThemeDialog>

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
              date={safeArrivalTime}
              setDate={setArrivalTime}
              showSeconds={false}
            />
          </div>

          <div className="flex gap-4 justify-between items-center">
            <div className="font-medium text-white">First Break Duration</div>
            <TimePickerDemo
              date={safeFirstBreak}
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

        {/* Calculation Results - Only show if arrival time is set */}
        {arrivalTime &&
          (arrivalTime.getHours() !== 0 || arrivalTime.getMinutes() !== 0) &&
          completionTime &&
          timeCompleted && (
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
        <div className="absolute bottom-6 text-white max-w-7xl mx-auto">
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
