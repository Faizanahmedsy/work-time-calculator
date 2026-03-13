"use client";
import confetti from "canvas-confetti";
import dayjs from "dayjs";
import { Settings, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import AnimatedTimeDisplay from "./AnimatedTime";
import Background from "./Background";
import { TimePicker12hDemo } from "./shadcn-timepicker/timepicker-12h-demo";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { ScrollArea } from "./ui/scroll-area";
import { ThemeDialog } from "./global/ThemeDialog";
import { ThemeButton } from "./global/ThemeButton";
import { useWorkTimeStore } from "@/store/workTimeStore";
import { 
  calculateTotalBreakMinutes, 
  getCompletionTime, 
  getTimeStatus, 
  formatDuration 
} from "@/utils/calculations";

function TimeCalculator() {
  // Zustand store
  const {
    arrivalTime,
    workMode,
    firstBreak,
    breaks,
    breakMode,
    breakRanges,
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
    setBreakMode,
    addBreakRange,
    updateBreakRange,
    removeBreakRange,
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

  const calculateResults = useCallback(() => {
    if (!arrivalTime) return;

    const workTimeInMinutes = getWorkTimeInMinutes();
    const totalBreakMinutes = calculateTotalBreakMinutes(
      breakMode,
      firstBreak,
      breaks,
      breakRanges
    );

    const completion = getCompletionTime(
      arrivalTime,
      totalBreakMinutes,
      workTimeInMinutes
    );
    
    const { completedMinutes, remainingMinutes } = getTimeStatus(
      arrivalTime,
      currentTime,
      totalBreakMinutes,
      workTimeInMinutes
    );

    const timeCompletedFormatted = formatDuration(completedMinutes);
    let timeRemainingFormatted = formatDuration(remainingMinutes);

    if (remainingMinutes === 0) {
      timeRemainingFormatted = "0 hours 0 minutes (Completed!)";
    }

    setCalculationResults({
      completionTime: completion ? completion.format("hh:mm A") : "",
      timeCompleted: timeCompletedFormatted,
      timeRemaining: timeRemainingFormatted,
    });
  }, [
    arrivalTime,
    breakMode,
    firstBreak,
    breaks,
    breakRanges,
    currentTime,
    getWorkTimeInMinutes,
    setCalculationResults,
  ]);

  useEffect(() => {
    calculateResults();
  }, [calculateResults]);

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
      <div className="flex flex-col h-screen justify-center items-center relative z-10 leading-5 tracking-wider gap-10 max-w-xl mx-auto">
        {/* {breaks.length === 0 && (
          <div>
            <h1 className="text-6xl font-bold">
              <AnimatedTimeDisplay currentTime={currentTime} />
            </h1>
          </div>
        )} */}

        {/* Feature Announcement Banner - Only show when no meaningful time input */}
        {/* {(!arrivalTime ||
          (arrivalTime.getHours() === 0 && arrivalTime.getMinutes() === 0)) && (
          <Link
            href="/your-day"
            className="group max-w-2xl w-full bg-cyan-950/10 backdrop-blur-sm border border-cyan-700/40 rounded-2xl p-5  transition-all duration-300 cursor-pointer mb-6"
          >
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <p className="text-base font-bold text-cyan-100 group-hover:text-white mb-2">
                  New Features: Save Locally + Plan Your Day!
                </p>
                <div className="space-y-1.5">
                  <div className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">✨</span>
                    <p className="text-xs text-gray-300">
                      Your time data now <strong>saves locally</strong> - never
                      lose your work again
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-purple-400 mt-0.5">🗓️</span>
                    <p className="text-xs text-gray-300">
                      Plan your entire day with the new{" "}
                      <strong>Your Day calendar</strong> - drag, drop &amp;
                      schedule
                    </p>
                  </div>
                </div>
                <p className="text-xs text-cyan-400 mt-3 font-medium group-hover:text-cyan-300">
                  Click to explore Your Day →
                </p>
              </div>
            </div>
          </Link>
        )} */}
        <div className="flex flex-col gap-6 w-full">
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
              <div className="text-xs opacity-80">(12-hour format with AM/PM)</div>
            </div>
            <TimePicker12hDemo
              date={safeArrivalTime}
              setDate={setArrivalTime}
            />
          </div>

          <div className="flex gap-4 justify-between items-center">
            <div className="font-medium text-white">Break Mode</div>
            <RadioGroup
              value={breakMode}
              onValueChange={setBreakMode}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="duration" id="duration" />
                <Label htmlFor="duration" className="text-white">
                  Duration
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="range" id="range" />
                <Label htmlFor="range" className="text-white">
                  Range (IN/OUT)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {breakMode === "duration" ? (
            <>
              <div className="flex gap-4 justify-between items-center">
                <div className="font-medium text-white">First Break Duration</div>
                <TimePicker12hDemo
                  date={safeFirstBreak}
                  setDate={setFirstBreak}
                />
              </div>

              <div className="space-y-4">
                {breaks.length > 0 && (
                  <ScrollArea className="h-48 w-full rounded-2xl p-4 bg-transparent backdrop-blur-sm">
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
                            <TimePicker12hDemo
                              date={breakItem.duration}
                              setDate={(newBreakDuration) =>
                                updateBreak(breakItem.id, newBreakDuration)
                              }
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
            </>
          ) : (
            <div className="space-y-4">
              <ScrollArea className={`${breakRanges.length > 0 ? "h-64" : "h-auto"} w-full rounded-2xl p-4 bg-transparent backdrop-blur-sm`}>
                <div className="space-y-6">
                  {breakRanges.map((range, index) => (
                    <div
                      key={range.id}
                      className="flex flex-col gap-3 bg-gray-800/20 backdrop-blur-sm p-4 rounded-xl border border-white/5"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-cyan-400">
                          Break Range {index + 1}
                        </span>
                        <button
                          onClick={() => removeBreakRange(range.id)}
                          className="text-red-500 hover:text-red-400 transition-colors duration-200"
                        >
                          <X size={18} />
                        </button>
                      </div>
                      <div className="flex gap-4 items-center justify-between">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] uppercase text-gray-400 font-bold ml-1">OUT (Break Start)</span>
                          <TimePicker12hDemo
                            date={range.start}
                            setDate={(newStart) =>
                              updateBreakRange(range.id, { start: newStart })
                            }
                          />
                        </div>
                        <div className="h-px bg-gray-600 w-4 mt-4"></div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] uppercase text-gray-400 font-bold ml-1">IN (Break End)</span>
                          <TimePicker12hDemo
                            date={range.end}
                            setDate={(newEnd) =>
                              updateBreakRange(range.id, { end: newEnd })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {breakRanges.length === 0 && (
                    <div className="text-center py-8 text-gray-500 text-sm italic">
                      No break ranges added yet.
                    </div>
                  )}
                </div>
              </ScrollArea>
              <div className="flex justify-end">
                <Button onClick={addBreakRange} className="rounded-full">
                  Add Break Range
                </Button>
              </div>
            </div>
          )}
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
        failed maths 7 times till now <br /> 🔃 Update: he has passed now
      </div>
    </Background>
  );
}

export default TimeCalculator;
