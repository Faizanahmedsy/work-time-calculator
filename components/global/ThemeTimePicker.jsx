"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock } from "lucide-react";

/**
 * ThemeTimePicker - Production-ready time picker for Your Day page
 * Features:
 * - 12-hour format with AM/PM
 * - 5-minute intervals
 * - Glassmorphic design matching work-watch theme
 */
export function ThemeTimePicker({ value, onChange, className = "" }) {
  // Parse the 24-hour time (HH:mm) to 12-hour format
  const parseTime = (time24) => {
    if (!time24) return { hours: "09", minutes: "00", period: "AM" };

    const [hours24, minutes] = time24.split(":");
    const h = parseInt(hours24);
    const period = h >= 12 ? "PM" : "AM";
    const hours12 = h === 0 ? 12 : h > 12 ? h - 12 : h;

    return {
      hours: hours12.toString().padStart(2, "0"),
      minutes,
      period,
    };
  };

  // Convert 12-hour format back to 24-hour (HH:mm)
  const formatTime = (hours12, minutes, period) => {
    let hours24 = parseInt(hours12);

    if (period === "AM" && hours24 === 12) {
      hours24 = 0;
    } else if (period === "PM" && hours24 !== 12) {
      hours24 += 12;
    }

    return `${hours24.toString().padStart(2, "0")}:${minutes}`;
  };

  const currentTime = parseTime(value);

  // Generate hours (1-12)
  const hours = Array.from({ length: 12 }, (_, i) => {
    const hour = i + 1;
    return hour.toString().padStart(2, "0");
  });

  // Generate minutes with 5-minute intervals
  const minutes = Array.from({ length: 12 }, (_, i) => {
    const minute = i * 5;
    return minute.toString().padStart(2, "0");
  });

  const handleHourChange = (newHour) => {
    const newTime = formatTime(
      newHour,
      currentTime.minutes,
      currentTime.period
    );
    onChange(newTime);
  };

  const handleMinuteChange = (newMinute) => {
    const newTime = formatTime(
      currentTime.hours,
      newMinute,
      currentTime.period
    );
    onChange(newTime);
  };

  const handlePeriodChange = (newPeriod) => {
    const newTime = formatTime(
      currentTime.hours,
      currentTime.minutes,
      newPeriod
    );
    onChange(newTime);
  };

  return (
    <div className={`flex items-center ${className}`}>
      <div className="flex items-center gap-0.5 bg-gray-800/50 border border-gray-700 rounded-lg px-2 py-1.5 backdrop-blur-sm">
        <Clock className="w-3 h-3 text-gray-400 mr-0.5" />

        {/* Hours */}
        <Select value={currentTime.hours} onValueChange={handleHourChange}>
          <SelectTrigger className="w-[45px] h-7 border-0 bg-transparent text-white text-sm focus:ring-0 focus:ring-offset-0 px-0.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700 text-white max-h-[200px]">
            {hours.map((hour) => (
              <SelectItem
                key={hour}
                value={hour}
                className="text-white hover:bg-gray-700 focus:bg-gray-700 text-sm"
              >
                {hour}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-gray-400 font-medium text-sm">:</span>

        {/* Minutes */}
        <Select value={currentTime.minutes} onValueChange={handleMinuteChange}>
          <SelectTrigger className="w-[45px] h-7 border-0 bg-transparent text-white text-sm focus:ring-0 focus:ring-offset-0 px-0.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700 text-white max-h-[200px]">
            {minutes.map((minute) => (
              <SelectItem
                key={minute}
                value={minute}
                className="text-white hover:bg-gray-700 focus:bg-gray-700 text-sm"
              >
                {minute}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* AM/PM */}
        <Select value={currentTime.period} onValueChange={handlePeriodChange}>
          <SelectTrigger className="w-[45px] h-7 border-0 bg-transparent text-white text-sm focus:ring-0 focus:ring-offset-0 px-0.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700 text-white">
            <SelectItem
              value="AM"
              className="text-white hover:bg-gray-700 focus:bg-gray-700 text-sm"
            >
              AM
            </SelectItem>
            <SelectItem
              value="PM"
              className="text-white hover:bg-gray-700 focus:bg-gray-700 text-sm"
            >
              PM
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
