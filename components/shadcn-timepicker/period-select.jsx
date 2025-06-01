"use client";

import React, { forwardRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { display12HourValue, setDateByType } from "./time-picker-utils";

export const TimePeriodSelect = forwardRef(function TimePeriodSelect(
  { period, setPeriod, date, setDate, onLeftFocus, onRightFocus },
  ref
) {
  const handleKeyDown = (e) => {
    if (e.key === "ArrowRight" && onRightFocus) onRightFocus();
    if (e.key === "ArrowLeft" && onLeftFocus) onLeftFocus();
  };

  const handleValueChange = (value) => {
    setPeriod(value);

    // Trigger an update whenever the user switches between AM and PM
    if (date) {
      const tempDate = new Date(date);
      const hours = display12HourValue(date.getHours());
      setDate(
        setDateByType(
          tempDate,
          hours.toString(),
          "12hours",
          value === "AM" ? "PM" : "AM"
        )
      );
    }
  };

  return (
    <div className="flex h-10 items-center">
      <Select value={period} onValueChange={handleValueChange}>
        <SelectTrigger
          ref={ref}
          className="w-[65px] focus:bg-accent focus:text-accent-foreground"
          onKeyDown={handleKeyDown}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="AM">AM</SelectItem>
          <SelectItem value="PM">PM</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
});

TimePeriodSelect.displayName = "TimePeriodSelect";
