"use client";
import dayjs from "dayjs";
import {
  Settings,
  X,
  Clock,
  Calendar,
  Coffee,
  Timer,
  Building,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import AnimatedTimeDisplay from "./AnimatedTime";
import Background from "./Background";
import TimePicker12hDemo from "./shadcn-timepicker/timepicker-12h-demo";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { ScrollArea } from "./ui/scroll-area";
import { ThemeDialog } from "./global/ThemeDialog";
import { ThemeButton } from "./global/ThemeButton";
import TimePickerDuration from "./shadcn-timepicker/timepicker-duration";
import MewurkLogs from "./MewurkLogs";
import { useWorkTimeStore } from "@/store/workTimeStore";
import {
  calculateTotalBreakMinutes,
  getCompletionTime,
  getTimeStatus,
  formatDuration,
} from "@/utils/calculations";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { cn } from "@/lib/utils";

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

  const [currentTime, setCurrentTime] = useState(dayjs());
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState("mewurk"); // "manual" or "mewurk"

  useEffect(() => {
    checkAndResetIfNewDay();
  }, [checkAndResetIfNewDay]);

  const safeArrivalTime = arrivalTime || undefined;
  const safeFirstBreak = firstBreak || new Date(0, 0, 0, 0, 0, 0);

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
      breakRanges,
    );

    const completion = getCompletionTime(
      arrivalTime,
      totalBreakMinutes,
      workTimeInMinutes,
    );

    const { completedMinutes, remainingMinutes } = getTimeStatus(
      arrivalTime,
      currentTime,
      totalBreakMinutes,
      workTimeInMinutes,
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
      <div className="relative z-10 min-h-screen pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex bg-gray-800/40 backdrop-blur-md p-1.5 rounded-2xl border border-white/5 shadow-xl">
              <button
                onClick={() => setActiveTab("manual")}
                className={cn(
                  "px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                  activeTab === "manual"
                    ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/20"
                    : "text-gray-400 hover:text-white",
                )}
              >
                <Timer size={16} />
                Manual Tracker
              </button>
              <button
                onClick={() => setActiveTab("mewurk")}
                className={cn(
                  "px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                  activeTab === "mewurk"
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                    : "text-gray-400 hover:text-white",
                )}
              >
                <Building size={16} />
                Mewurk Logs
              </button>
            </div>

            <div className="flex items-center gap-6">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowSettings(true)}
                className="bg-gray-800/50 border-gray-700 text-white hover:bg-gray-700/40 rounded-full w-full px-4"
              >
                <Settings className="h-5 w-5" />
                Settings
              </Button>
            </div>
          </div>

          {activeTab === "manual" ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Card 1: Shift config */}
                <Card className="bg-gray-800/30 backdrop-blur-md border-gray-700 shadow-xl rounded-3xl overflow-hidden border-t-white/10 h-[600px] flex flex-col">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-base flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-cyan-400" />
                      Shift config
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 flex-1 overflow-y-auto pt-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm text-gray-400">
                          Arrival time
                        </Label>
                        <span className="text-[10px] text-gray-600 font-bold tracking-widest uppercase">
                          12h format
                        </span>
                      </div>
                      <div className="flex justify-center py-8 bg-white/5 rounded-2xl border border-white/5">
                        <TimePicker12hDemo
                          date={safeArrivalTime}
                          setDate={setArrivalTime}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm text-gray-400">Work mode</Label>
                      <RadioGroup
                        value={workMode}
                        onValueChange={setWorkMode}
                        className="grid grid-cols-1 gap-2"
                      >
                        <div
                          className={cn(
                            "flex items-center space-x-3 p-4 rounded-xl border transition-all cursor-pointer",
                            workMode === "full"
                              ? "bg-cyan-500/10 border-cyan-500/50 text-white"
                              : "bg-transparent border-white/10 text-gray-400 hover:border-white/20",
                          )}
                          onClick={() => setWorkMode("full")}
                        >
                          <RadioGroupItem value="full" id="full" />
                          <Label
                            htmlFor="full"
                            className="text-xs cursor-pointer"
                          >
                            Full Day ({fullDayHours}h {fullDayMinutes}m)
                          </Label>
                        </div>
                        <div
                          className={cn(
                            "flex items-center space-x-3 p-4 rounded-xl border transition-all cursor-pointer",
                            workMode === "half"
                              ? "bg-cyan-500/10 border-cyan-500/50 text-white"
                              : "bg-transparent border-white/10 text-gray-400 hover:border-white/20",
                          )}
                          onClick={() => setWorkMode("half")}
                        >
                          <RadioGroupItem value="half" id="half" />
                          <Label
                            htmlFor="half"
                            className="text-xs cursor-pointer"
                          >
                            Half Day ({halfDayHours}h {halfDayMinutes}m)
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </CardContent>
                </Card>

                {/* Card 2: Break Management */}
                <Card className="bg-gray-800/30 backdrop-blur-md border-gray-700 shadow-xl rounded-3xl overflow-hidden border-t-white/10 h-[600px] flex flex-col">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-base flex items-center gap-2">
                      <Coffee className="w-4 h-4 text-orange-400" />
                      Break management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 flex-1 flex flex-col overflow-hidden pb-6">
                    <div className="flex items-center justify-between p-1 bg-white/5 rounded-xl border border-white/5">
                      <button
                        onClick={() => setBreakMode("duration")}
                        className={cn(
                          "flex-1 text-[10px] font-bold uppercase tracking-widest py-2 rounded-lg transition-all",
                          breakMode === "duration"
                            ? "bg-orange-500/20 text-orange-400"
                            : "text-gray-500 hover:text-gray-300",
                        )}
                      >
                        Duration
                      </button>
                      <button
                        onClick={() => setBreakMode("range")}
                        className={cn(
                          "flex-1 text-[10px] font-bold uppercase tracking-widest py-2 rounded-lg transition-all",
                          breakMode === "range"
                            ? "bg-orange-500/20 text-orange-400"
                            : "text-gray-500 hover:text-gray-300",
                        )}
                      >
                        Range
                      </button>
                    </div>

                    <div className="flex-1 overflow-hidden flex flex-col gap-4">
                      {breakMode === "duration" ? (
                        <div className="space-y-4 h-full flex flex-col">
                          <div className="flex flex-col gap-2 p-3 rounded-xl bg-white/5 border border-white/5">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-400">
                                Default break
                              </span>
                              <TimePickerDuration
                                date={safeFirstBreak}
                                setDate={setFirstBreak}
                              />
                            </div>
                          </div>

                          <ScrollArea className="flex-1 w-full rounded-2xl bg-black/20 p-2 border border-white/5">
                            <div className="space-y-2 p-1">
                              {breaks.map((breakItem, index) => (
                                <div
                                  key={breakItem.id}
                                  className="flex items-center justify-between gap-3 bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/5 group"
                                >
                                  <span className="text-[10px] font-bold text-gray-500 uppercase">
                                    Break {index + 2}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <TimePickerDuration
                                      date={breakItem.duration}
                                      setDate={(newBreakDuration) =>
                                        updateBreak(
                                          breakItem.id,
                                          newBreakDuration,
                                        )
                                      }
                                    />
                                    <button
                                      onClick={() => removeBreak(breakItem.id)}
                                      className="text-red-500/30 hover:text-red-400 transition-colors p-1"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                          <Button
                            onClick={addBreak}
                            variant="outline"
                            className="w-full text-xs font-bold uppercase tracking-wider rounded-xl border-orange-500/30 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 py-6 transition-all"
                          >
                            + Add another break
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4 h-full flex flex-col">
                          <ScrollArea className="flex-1 w-full rounded-2xl bg-black/20 p-2 border border-white/5">
                            <div className="space-y-3 p-1">
                              {breakRanges.map((range, index) => (
                                <div
                                  key={range.id}
                                  className="flex flex-col gap-4 bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/5"
                                >
                                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                    <span className="text-[10px] font-bold text-cyan-400/70 tracking-widest uppercase">
                                      Range {index + 1}
                                    </span>
                                    <button
                                      onClick={() => removeBreakRange(range.id)}
                                      className="text-red-500/30 hover:text-red-400 transition-colors"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                  <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] text-gray-500 font-bold uppercase">
                                        Start
                                      </span>
                                      <TimePicker12hDemo
                                        date={range.start}
                                        setDate={(s) =>
                                          updateBreakRange(range.id, {
                                            start: s,
                                          })
                                        }
                                      />
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] text-gray-500 font-bold uppercase">
                                        End
                                      </span>
                                      <TimePicker12hDemo
                                        date={range.end}
                                        setDate={(e) =>
                                          updateBreakRange(range.id, { end: e })
                                        }
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                          <Button
                            onClick={addBreakRange}
                            variant="outline"
                            className="w-full text-xs font-bold uppercase tracking-wider rounded-xl border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 py-6 transition-all"
                          >
                            + Add break range
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Card 3: Results */}
                <Card className="bg-gray-800/30 backdrop-blur-md border-gray-700 shadow-xl rounded-3xl overflow-hidden border-t-white/10 h-[600px] flex flex-col">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-base flex items-center gap-2">
                      <Clock className="w-4 h-4 text-cyan-400" />
                      Work results
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 flex-1 flex flex-col">
                    {arrivalTime ? (
                      <div className="space-y-10 text-center flex-1 flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="text-[10px] font-bold text-gray-500 tracking-widest">
                            Work completion time
                          </div>
                          <h1 className="text-6xl font-black text-white tracking-tight">
                            {completionTime}
                          </h1>
                        </div>

                        <div className="space-y-4 text-left">
                          <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                            <div className="text-[9px] font-bold text-gray-500 tracking-widest uppercase">
                              Completed
                            </div>
                            <div className="text-lg font-bold text-white tracking-tight">
                              {timeCompleted}
                            </div>
                          </div>
                          <div className="p-5 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 space-y-1">
                            <div className="text-[9px] font-bold text-cyan-400 tracking-widest uppercase">
                              Remaining
                            </div>
                            <div className="text-lg font-bold text-cyan-300 tracking-tight">
                              {timeRemaining}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-cyan-500 rounded-full transition-all duration-1000"
                                style={{
                                  width: arrivalTime
                                    ? `${Math.min(100, (currentTime.diff(arrivalTime, "minute") / getWorkTimeInMinutes()) * 100)}%`
                                    : "0%",
                                }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-[9px] font-medium text-gray-400">
                              <span>
                                Start: {dayjs(arrivalTime).format("hh:mm A")}
                              </span>
                              <span>Goal: {completionTime}</span>
                            </div>
                          </div>

                          <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-[9px] font-bold text-gray-600 tracking-wider">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50"></div>
                              System operational
                            </div>
                            <div className="text-[9px] font-medium text-gray-500">
                              developed by{" "}
                              <Link
                                href="https://faizansaiyed.vercel.app/v-2"
                                className="text-gray-400 hover:text-cyan-400 transition-colors"
                                target="_blank"
                              >
                                Faizan
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                        <Timer className="w-12 h-12" />
                        <div className="space-y-1">
                          <h3 className="text-lg font-bold text-white">
                            No arrival time
                          </h3>
                          <p className="text-gray-500 text-xs max-w-[180px]">
                            Set your start time to see your results.
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-between items-center px-2">
                <Link
                  href="https://github.com/Faizanahmedsy/work-time-calculator"
                  target="_blank"
                  className="text-sm text-gray-600 hover:text-gray-400 transition-colors flex items-center gap-2"
                >
                  Developed with ❤️‍🔥 by Faizan <br />
                  Give a Star on Github
                </Link>
                <div className="text-sm text-gray-700 text-right">
                  ⚠️ Note: Please do not blindly trust this tool. The developer
                  has failed maths 7 times till now <br /> 🔃 Update: he has
                  passed now
                </div>
              </div>
            </>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <MewurkLogs />
            </div>
          )}
        </div>
      </div>

      <ThemeDialog open={showSettings} onOpenChange={setShowSettings}>
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-6">Shift Settings</h2>
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label className="text-xs text-gray-400 uppercase font-bold tracking-widest px-1">
                Full shift
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="number"
                  value={fullDayHours}
                  onChange={handleFullDayHoursChange}
                  className="bg-gray-900 border-gray-700 text-white"
                  placeholder="Hrs"
                />
                <Input
                  type="number"
                  value={fullDayMinutes}
                  onChange={handleFullDayMinutesChange}
                  className="bg-gray-900 border-gray-700 text-white"
                  placeholder="Min"
                />
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-xs text-gray-400 uppercase font-bold tracking-widest px-1">
                Half shift
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="number"
                  value={halfDayHours}
                  onChange={handleHalfDayHoursChange}
                  className="bg-gray-900 border-gray-700 text-white"
                />
                <Input
                  type="number"
                  value={halfDayMinutes}
                  onChange={handleHalfDayMinutesChange}
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-8">
            <ThemeButton
              variant="outline"
              onClick={resetToDefaults}
              className="flex-1"
            >
              Reset
            </ThemeButton>
            <ThemeButton
              variant="primary"
              onClick={() => setShowSettings(false)}
              className="flex-1"
            >
              Save
            </ThemeButton>
          </div>
        </div>
      </ThemeDialog>
    </Background>
  );
}

export default TimeCalculator;
