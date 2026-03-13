"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { TimePickerInput } from "./timepicker-input";
import { TimePeriodSelect } from "./period-select";

export function TimePicker12hDemo({ date, setDate }) {
  const [period, setPeriod] = React.useState(date ? (date.getHours() >= 12 ? "PM" : "AM") : "AM");

  const minuteRef = React.useRef(null);
  const hourRef = React.useRef(null);
  const secondRef = React.useRef(null);
  const periodRef = React.useRef(null);

  // Sync period with date changes if they happen externally
  React.useEffect(() => {
    if (date) {
      setPeriod(date.getHours() >= 12 ? "PM" : "AM");
    }
  }, [date]);

  return (
    <div className="flex items-end gap-2">
      <div className="grid gap-1 text-center">
        <Label htmlFor="hours" className="text-xs text-white/70">
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
        <Label htmlFor="minutes" className="text-xs text-white/70">
          Minutes
        </Label>
        <TimePickerInput
          picker="minutes"
          id="minutes12"
          date={date}
          setDate={setDate}
          ref={minuteRef}
          onLeftFocus={() => hourRef.current?.focus()}
          onRightFocus={() => secondRef.current?.focus()}
        />
      </div>
      <div className="grid gap-1 text-center">
        <Label htmlFor="period" className="text-xs text-white/70">
          Period
        </Label>
        <TimePeriodSelect
          period={period}
          setPeriod={setPeriod}
          date={date}
          setDate={setDate}
          ref={periodRef}
          onLeftFocus={() => minuteRef.current?.focus()}
        />
      </div>
    </div>
  );
}
