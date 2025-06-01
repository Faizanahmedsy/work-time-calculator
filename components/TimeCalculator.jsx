"use client";
import confetti from "canvas-confetti";
import dayjs from "dayjs";
import { Settings, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import AnimatedTimeDisplay from "./AnimatedTime";
import Background from "./Background";
import { TimePicker12Demo } from "./shadcn-timepicker/12-h-time-picker";
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
import { ScrollArea } from "./ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { ScratchToReveal } from "./magicui/scratch-to-reveal";

function TimeCalculator() {
  const [currentTime, setCurrentTime] = useState(dayjs());
  const [completionTime, setCompletionTime] = useState("");
  // Set default start time to 10:00 AM
  const [arrivalTime, setArrivalTime] = useState(new Date(0, 0, 0, 10, 0, 0));
  const [estimatedEndTime, setEstimatedEndTime] = useState(undefined);
  const [firstBreak, setFirstBreak] = useState(new Date(0, 0, 0, 0, 0, 0));
  const [breaks, setBreaks] = useState([]);
  const [timeCompleted, setTimeCompleted] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [workMode, setWorkMode] = useState("full"); // "full" or "half"
  const [calculationVariant, setCalculationVariant] =
    useState("duration-based"); // "duration-based" or "time-based"
  const [showSettings, setShowSettings] = useState(false);
  const [workTimeStatus, setWorkTimeStatus] = useState(null); // For time-based variant

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

  // Helper function to convert Date to dayjs with proper handling
  const convertToTodaysDate = (timeDate) => {
    if (!timeDate) return null;

    const today = dayjs();
    const hours = timeDate.getHours();
    const minutes = timeDate.getMinutes();
    const seconds = timeDate.getSeconds();

    return today.hour(hours).minute(minutes).second(seconds).millisecond(0);
  };

  // Helper function to format time in 12-hour format
  const formatTime12Hour = (date) => {
    if (!date) return "";
    const dayjsDate = dayjs.isDayjs(date) ? date : dayjs(date);
    return dayjsDate.format("hh:mm A");
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
    if (arrivalTime && calculationVariant === "duration-based") {
      const totalBreakMinutes = calculateTotalBreakMinutes();
      const workTimeInMinutes = getWorkTimeInMinutes();
      const adjustedWorkTimeInMinutes = workTimeInMinutes + totalBreakMinutes;

      // Convert arrivalTime to dayjs object properly
      const arrivalDayjs = convertToTodaysDate(arrivalTime);
      if (!arrivalDayjs) return;

      const completion = arrivalDayjs.add(adjustedWorkTimeInMinutes, "minute");
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
    calculationVariant,
  ]);

  const calculateTimeBasedStatus = useCallback(() => {
    if (
      arrivalTime &&
      estimatedEndTime &&
      calculationVariant === "time-based"
    ) {
      const totalBreakMinutes = calculateTotalBreakMinutes();

      // Convert both times to dayjs objects properly
      const arrivalDayjs = convertToTodaysDate(arrivalTime);
      const endDayjs = convertToTodaysDate(estimatedEndTime);

      if (!arrivalDayjs || !endDayjs) return;

      // Handle case where end time is next day (crosses midnight)
      let adjustedEndTime = endDayjs;
      if (endDayjs.isBefore(arrivalDayjs)) {
        adjustedEndTime = endDayjs.add(1, "day");
      }

      const availableWorkMinutes =
        adjustedEndTime.diff(arrivalDayjs, "minute") - totalBreakMinutes;
      const requiredWorkMinutes = getWorkTimeInMinutes();

      const availableHours = Math.floor(availableWorkMinutes / 60);
      const availableMins = availableWorkMinutes % 60;
      const requiredHours = Math.floor(requiredWorkMinutes / 60);
      const requiredMins = requiredWorkMinutes % 60;

      const isCompleted = availableWorkMinutes >= requiredWorkMinutes;
      const difference = Math.abs(requiredWorkMinutes - availableWorkMinutes);
      const diffHours = Math.floor(difference / 60);
      const diffMins = difference % 60;

      setWorkTimeStatus({
        isCompleted,
        availableTime: `${availableHours}h ${availableMins}m`,
        requiredTime: `${requiredHours}h ${requiredMins}m`,
        difference: `${diffHours}h ${diffMins}m`,
        surplus: availableWorkMinutes > requiredWorkMinutes,
      });
    }
  }, [
    arrivalTime,
    estimatedEndTime,
    calculateTotalBreakMinutes,
    workMode,
    fullDayHours,
    fullDayMinutes,
    halfDayHours,
    halfDayMinutes,
    calculationVariant,
  ]);

  const calculateTimeCompletedAndRemaining = useCallback(() => {
    if (arrivalTime && calculationVariant === "duration-based") {
      const totalBreakMinutes = calculateTotalBreakMinutes();

      // Convert arrivalTime to dayjs object properly
      const arrivalDayjs = convertToTodaysDate(arrivalTime);
      if (!arrivalDayjs) return;

      const elapsedMinutes =
        currentTime.diff(arrivalDayjs, "minute") - totalBreakMinutes;
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
    calculationVariant,
  ]);

  useEffect(() => {
    if (calculationVariant === "duration-based" && arrivalTime) {
      calculateCompletionTime();
      calculateTimeCompletedAndRemaining();
    } else if (
      calculationVariant === "time-based" &&
      arrivalTime &&
      estimatedEndTime
    ) {
      calculateTimeBasedStatus();
    }
  }, [
    arrivalTime,
    estimatedEndTime,
    firstBreak,
    breaks,
    calculateCompletionTime,
    calculateTimeCompletedAndRemaining,
    calculateTimeBasedStatus,
    currentTime,
    workMode,
    fullDayHours,
    fullDayMinutes,
    halfDayHours,
    halfDayMinutes,
    calculationVariant,
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

  const handleVariantChange = (value) => {
    setCalculationVariant(value);
    // Reset relevant states when switching variants
    setCompletionTime("");
    setTimeCompleted(null);
    setTimeRemaining(null);
    setWorkTimeStatus(null);
  };

  return (
    <Background>
      <div className="flex min-h-screen justify-center items-center relative z-10 leading-5 tracking-wider gap-10">
        {/* {breaks.length === 0 && ( */}
        <div className="min-h-[50dvh]">
          <h1 className="text-xl font-bold flex justify-start select-none">
            <AnimatedTimeDisplay currentTime={currentTime} />
          </h1>
          <ScratchToReveal
            width={400}
            height={150}
            minScratchPercentage={70}
            className="flex items-center justify-center overflow-hidden rounded-2xl border-2 bg-slate-800 opacity-65 backdrop-blur-3xl"
            gradientColors={["#A97CF8", "#F38CB8", "#FDCC92"]}
          >
            <p className="text-xl">Kaam per dhyan do</p>
          </ScratchToReveal>
        </div>
        {/* )} */}

        <div>
          <div className="flex flex-col gap-6 w-full max-w-2xl mb-10">
            {/* Top Controls Row */}
            <div className="flex justify-between items-center gap-4">
              <div className="flex gap-4 items-center">
                {/* Calculation Method Select */}
                <div className="flex flex-col">
                  <Label className="text-xs text-gray-300 mb-1">Method</Label>
                  <Select
                    value={calculationVariant}
                    onValueChange={handleVariantChange}
                  >
                    <SelectTrigger className="w-48 bg-gray-800/40 border-gray-600 text-white">
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      <SelectItem
                        value="duration-based"
                        className="text-white focus:bg-gray-700"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">Duration Based</span>
                          <span className="text-xs text-gray-400">
                            When will work end?
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem
                        value="time-based"
                        className="text-white focus:bg-gray-700"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">Time Window</span>
                          <span className="text-xs text-gray-400">
                            Can I finish in time?
                          </span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Work Mode Select */}
                <div className="flex flex-col">
                  <Label className="text-xs text-gray-300 mb-1">
                    Work Mode
                  </Label>
                  <Select value={workMode} onValueChange={setWorkMode}>
                    <SelectTrigger className="w-48 bg-gray-800/40 border-gray-600 text-white">
                      <SelectValue placeholder="Select work mode" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      <SelectItem
                        value="full"
                        className="text-white focus:bg-gray-700"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">Full Day</span>
                          <span className="text-xs text-gray-400">
                            {fullDayHours}h {fullDayMinutes}m
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem
                        value="half"
                        className="text-white focus:bg-gray-700"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">Half Day</span>
                          <span className="text-xs text-gray-400">
                            {halfDayHours}h {halfDayMinutes}m
                          </span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Settings Button */}
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

            <div className="flex gap-4 justify-between items-center">
              <div className="font-medium text-white">
                {calculationVariant === "duration-based"
                  ? "Start Time"
                  : "Start Time"}
                <div className="text-xs opacity-80">
                  When did you start working?
                </div>
              </div>
              <TimePicker12Demo
                date={arrivalTime}
                setDate={setArrivalTime}
                showSeconds={false}
              />
            </div>

            {calculationVariant === "time-based" && (
              <div className="flex gap-4 justify-between items-center">
                <div className="font-medium text-white">
                  Estimated End Time
                  <div className="text-xs opacity-80">
                    When do you plan to leave?
                  </div>
                </div>
                <TimePicker12Demo
                  date={estimatedEndTime}
                  setDate={setEstimatedEndTime}
                  showSeconds={false}
                />
              </div>
            )}

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
                <ScrollArea className="h-32 w-full rounded-2xl p-4 bg-transparent backdrop-blur-sm">
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

          {/* Results Display */}
          {calculationVariant === "duration-based" &&
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

          {calculationVariant === "time-based" && workTimeStatus && (
            <div className="space-y-2">
              <h1
                className={`text-2xl text-center font-bold ${
                  workTimeStatus.isCompleted ? "text-green-400" : "text-red-400"
                }`}
              >
                {workTimeStatus.isCompleted
                  ? "✅ Work Time Can Be Completed!"
                  : "❌ Work Time Cannot Be Completed"}
              </h1>
              <h3 className="text-md text-center font-semibold text-gray-400">
                Available work time: {workTimeStatus.availableTime}
              </h3>
              <h3 className="text-md text-center font-semibold text-gray-400">
                Required work time: {workTimeStatus.requiredTime}
              </h3>
              <h3
                className={`text-md text-center font-semibold ${
                  workTimeStatus.surplus ? "text-green-400" : "text-red-400"
                }`}
              >
                {workTimeStatus.surplus ? "Extra time: " : "Shortfall: "}
                {workTimeStatus.difference}
              </h3>
            </div>
          )}
        </div>
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
