"use client";

import * as React from "react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { display12HourValue, setDateByType } from "./timepicker-utils";

export const TimePeriodSelect = React.forwardRef(
  ({ period, setPeriod, date, setDate, onLeftFocus, onRightFocus }, ref) => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") onRightFocus?.();
      if (e.key === "ArrowLeft") onLeftFocus?.();
    };

    const handleValueChange = (value) => {
      setPeriod(value);

      /**
       * trigger an update whenever the user switches between AM and PM;
       * otherwise user must manually change the hour each time
       */
      if (date) {
        const tempDate = new Date(date);
        const hours = display12HourValue(date.getHours());
        setDate(setDateByType(tempDate, hours.toString(), "12hours", value));
      }
    };

    return (
      <div className="flex h-10 items-center">
        <Select
          value={period}
          onValueChange={handleValueChange}
        >
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
  }
);

TimePeriodSelect.displayName = "TimePeriodSelect";
