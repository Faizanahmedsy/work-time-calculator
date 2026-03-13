"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import TimePickerInput from "./timepicker-input";

const TimePickerDuration = ({ date, setDate }) => {
  const minuteRef = React.useRef(null);
  const hourRef = React.useRef(null);

  return (
    <div className="flex items-end gap-2">
      <div className="grid gap-1 text-center">
        <Label htmlFor="duration-hours" className="text-[10px] text-white/50 uppercase font-bold tracking-tighter">
          Hours
        </Label>
        <TimePickerInput
          picker="hours"
          date={date}
          setDate={setDate}
          id="duration-hours"
          ref={hourRef}
          onRightFocus={() => minuteRef.current?.focus()}
          className="bg-black/20 border-white/5 text-white focus:border-orange-500/50 rounded-lg h-10 w-12"
        />
      </div>
      <div className="flex items-center font-bold text-white/20 h-10 pt-4">:</div>
      <div className="grid gap-1 text-center">
        <Label htmlFor="duration-minutes" className="text-[10px] text-gray-500 uppercase font-bold tracking-tight">
          Minutes
        </Label>
        <TimePickerInput
          picker="minutes"
          date={date}
          setDate={setDate}
          id="duration-minutes"
          ref={minuteRef}
          onLeftFocus={() => hourRef.current?.focus()}
          className="bg-black/20 border-white/5 text-white focus:border-orange-500/50 rounded-lg h-10 w-12"
        />
      </div>
    </div>
  );
}

export default TimePickerDuration;
