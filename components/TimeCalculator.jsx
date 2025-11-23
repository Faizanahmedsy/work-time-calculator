"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Settings } from "lucide-react";
import confetti from "canvas-confetti";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import React, { useEffect, useState } from "react";
import SkeletonMountain from "./ui/skeleton-mountain";

dayjs.extend(customParseFormat);

const TimeCalculator = () => {
  const [arrivalTime, setArrivalTime] = useState("");
  const [arrivalHour, setArrivalHour] = useState("");
  const [arrivalMinute, setArrivalMinute] = useState("");
  const [workMode, setWorkMode] = useState("full"); // "full" or "half"
  const [breakHours, setBreakHours] = useState("00");
  const [breakMinutes, setBreakMinutes] = useState("00");

  const [currentTime, setCurrentTime] = useState(dayjs());
  const [isClient, setIsClient] = useState(false);

  // Configuration
  const [fullDayHours, setFullDayHours] = useState(8);
  const [fullDayMinutes, setFullDayMinutes] = useState(15);
  const [halfDayHours, setHalfDayHours] = useState(4);
  const [halfDayMinutes, setHalfDayMinutes] = useState(15);

  useEffect(() => {
    setIsClient(true);
    const timer = setInterval(() => setCurrentTime(dayjs()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync separate inputs with main state
  useEffect(() => {
    if (arrivalHour && arrivalMinute) {
      setArrivalTime(`${arrivalHour}:${arrivalMinute}`);
    }
  }, [arrivalHour, arrivalMinute]);

  const calculateTimes = () => {
    if (!arrivalTime) return null;

    const [hours, minutes] = arrivalTime.split(":").map(Number);
    const arrival = dayjs()
      .hour(hours)
      .minute(minutes)
      .second(0)
      .millisecond(0);

    const workDurationMinutes =
      workMode === "full"
        ? fullDayHours * 60 + fullDayMinutes
        : halfDayHours * 60 + halfDayMinutes;

    const breakDurationMinutes =
      (parseInt(breakHours) || 0) * 60 + (parseInt(breakMinutes) || 0);

    const totalDuration = workDurationMinutes + breakDurationMinutes;
    const leaveTime = arrival.add(totalDuration, "minute");

    // Calculate progress
    const now = dayjs();
    const totalDayMinutes = leaveTime.diff(arrival, "minute");
    const minutesPassed = now.diff(arrival, "minute");
    const progressPercentage = Math.min(
      Math.max((minutesPassed / totalDayMinutes) * 100, 0),
      100
    );

    const remainingMinutes = leaveTime.diff(now, "minute");
    const isOvertime = remainingMinutes < 0;

    return {
      arrival,
      leaveTime,
      remainingMinutes,
      progressPercentage,
      isOvertime,
      minutesPassed,
    };
  };

  const result = calculateTimes();

  // Trigger confetti on completion
  useEffect(() => {
    if (result?.remainingMinutes === 0) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#22d3ee", "#34d399", "#f472b6"],
      });
    }
  }, [result?.remainingMinutes]);

  const formatDuration = (minutes) => {
    const absMinutes = Math.abs(minutes);
    const h = Math.floor(absMinutes / 60);
    const m = absMinutes % 60;
    return `${h}h ${m}m`;
  };

  if (!isClient) return null;

  return (
    <SkeletonMountain>
      <div className="bg-black/30 backdrop-blur-md border border-white/10 p-8 rounded-3xl shadow-2xl w-full text-white relative z-20">
        {/* Settings Button (Top Right) */}
        <div className="absolute top-4 right-4 z-50">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
              >
                <Settings className="w-6 h-6" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-neutral-900 border-neutral-800 text-white">
              <DialogHeader>
                <DialogTitle>Configuration</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <Label>Full Day Hours</Label>
                  <Input
                    type="number"
                    value={fullDayHours}
                    onChange={(e) => setFullDayHours(Number(e.target.value))}
                    className="bg-neutral-800 border-neutral-700"
                  />
                  <Label>Full Day Minutes</Label>
                  <Input
                    type="number"
                    value={fullDayMinutes}
                    onChange={(e) => setFullDayMinutes(Number(e.target.value))}
                    className="bg-neutral-800 border-neutral-700"
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Work Mode Selection */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Label className="text-lg font-medium">Work Mode</Label>
          </div>
          <RadioGroup
            value={workMode}
            onValueChange={setWorkMode}
            className="flex gap-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value="full"
                id="full"
                className="border-white text-white"
              />
              <Label htmlFor="full" className="cursor-pointer">
                Full Day ({fullDayHours}h {fullDayMinutes}m)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value="half"
                id="half"
                className="border-white text-white"
              />
              <Label htmlFor="half" className="cursor-pointer">
                Half Day ({halfDayHours}h {halfDayMinutes}m)
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Arrival Time Input */}
        <div className="mb-8">
          <Label className="text-lg font-medium mb-2 block">
            At what time did you come to the office?
            <span className="block text-sm text-white/60 font-normal">
              (24-hour time format)
            </span>
          </Label>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label className="text-xs mb-1 block text-center">Hours</Label>
              <Input
                type="number"
                placeholder="00"
                value={arrivalHour}
                onChange={(e) => setArrivalHour(e.target.value)}
                className="bg-black/50 border-white/20 text-center text-2xl h-14 rounded-xl focus:border-white/50 transition-colors"
                maxLength={2}
              />
            </div>
            <div className="flex-1">
              <Label className="text-xs mb-1 block text-center">Minutes</Label>
              <Input
                type="number"
                placeholder="00"
                value={arrivalMinute}
                onChange={(e) => setArrivalMinute(e.target.value)}
                className="bg-black/50 border-white/20 text-center text-2xl h-14 rounded-xl focus:border-white/50 transition-colors"
                maxLength={2}
              />
            </div>
          </div>
        </div>

        {/* Break Duration Input */}
        <div className="mb-8">
          <Label className="text-lg font-medium mb-2 block">
            First Break Duration
          </Label>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label className="text-xs mb-1 block text-center">Hours</Label>
              <Input
                type="number"
                placeholder="00"
                value={breakHours}
                onChange={(e) => setBreakHours(e.target.value)}
                className="bg-black/50 border-white/20 text-center text-2xl h-14 rounded-xl focus:border-white/50 transition-colors"
              />
            </div>
            <div className="flex-1">
              <Label className="text-xs mb-1 block text-center">Minutes</Label>
              <Input
                type="number"
                placeholder="00"
                value={breakMinutes}
                onChange={(e) => setBreakMinutes(e.target.value)}
                className="bg-black/50 border-white/20 text-center text-2xl h-14 rounded-xl focus:border-white/50 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Results Display */}
        {result && (
          <div className="mt-8 pt-8 border-t border-white/10 text-center space-y-4">
            <div>
              <div className="text-sm text-white/60 uppercase tracking-widest">
                Target Leave Time
              </div>
              <div className="text-5xl font-bold mt-1">
                {result.leaveTime.format("HH:mm")}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-xl">
                <div className="text-xs text-white/60 uppercase">Remaining</div>
                <div
                  className={`text-xl font-bold ${
                    result.isOvertime ? "text-red-300" : "text-emerald-300"
                  }`}
                >
                  {formatDuration(result.remainingMinutes)}
                </div>
              </div>
              <div className="bg-white/5 p-4 rounded-xl">
                <div className="text-xs text-white/60 uppercase">Progress</div>
                <div className="text-xl font-bold text-blue-300">
                  {Math.round(result.progressPercentage)}%
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </SkeletonMountain>
  );
};

export default TimeCalculator;
