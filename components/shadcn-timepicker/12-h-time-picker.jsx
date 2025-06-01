"use client";

import React, { useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { TimePeriodSelect } from "./period-select";
import { TimePickerInput } from "./time-picker-input";

export function TimePicker12Demo({ date, setDate, showSeconds = true }) {
  const [period, setPeriod] = useState("AM");

  const minuteRef = useRef(null);
  const hourRef = useRef(null);
  const secondRef = useRef(null);
  const periodRef = useRef(null);

  return (
    <div className="flex items-end gap-2">
      <div className="grid gap-1 text-center">
        <Label htmlFor="hours" className="text-xs">
          Hours
        </Label>
        <TimePickerInput
          picker="12hours"
          period={period}
          date={date}
          setDate={setDate}
          ref={hourRef}
          onRightFocus={() => minuteRef.current?.focus()}
        />
      </div>
      <div className="grid gap-1 text-center">
        <Label htmlFor="minutes" className="text-xs">
          Minutes
        </Label>
        <TimePickerInput
          picker="minutes"
          id="minutes12"
          date={date}
          setDate={setDate}
          ref={minuteRef}
          onLeftFocus={() => hourRef.current?.focus()}
          onRightFocus={() =>
            showSeconds
              ? secondRef.current?.focus()
              : periodRef.current?.focus()
          }
        />
      </div>
      {showSeconds && (
        <div className="grid gap-1 text-center">
          <Label htmlFor="seconds" className="text-xs">
            Seconds
          </Label>
          <TimePickerInput
            picker="seconds"
            id="seconds12"
            date={date}
            setDate={setDate}
            ref={secondRef}
            onLeftFocus={() => minuteRef.current?.focus()}
            onRightFocus={() => periodRef.current?.focus()}
          />
        </div>
      )}
      <div className="grid gap-1 text-center">
        <Label htmlFor="period" className="text-xs">
          Period
        </Label>
        <TimePeriodSelect
          period={period}
          setPeriod={setPeriod}
          date={date}
          setDate={setDate}
          ref={periodRef}
          onLeftFocus={() =>
            showSeconds
              ? secondRef.current?.focus()
              : minuteRef.current?.focus()
          }
        />
      </div>
    </div>
  );
}
