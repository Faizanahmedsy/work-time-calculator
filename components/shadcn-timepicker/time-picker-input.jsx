import { Input } from "@/components/ui/input";

import { cn } from "@/lib/utils";
import React from "react";
import {
  Period,
  TimePickerType,
  getArrowByType,
  getDateByType,
  setDateByType,
} from "./time-picker-utils";

const TimePickerInput = React.forwardRef(function TimePickerInput(
  {
    className,
    type = "tel",
    value,
    id,
    name,
    date = new Date(new Date().setHours(0, 0, 0, 0)),
    setDate,
    onChange,
    onKeyDown,
    picker,
    period,
    onLeftFocus,
    onRightFocus,
    ...props
  },
  ref
) {
  const [flag, setFlag] = React.useState(false);
  const [prevIntKey, setPrevIntKey] = React.useState("0");

  React.useEffect(() => {
    if (flag) {
      const timer = setTimeout(() => {
        setFlag(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [flag]);

  const calculatedValue = React.useMemo(() => {
    return getDateByType(date, picker);
  }, [date, picker]);

  const calculateNewValue = (key) => {
    if (picker === "12hours") {
      if (flag && calculatedValue.slice(1, 2) === "1" && prevIntKey === "0")
        return "0" + key;
    }

    return !flag ? "0" + key : calculatedValue.slice(1, 2) + key;
  };

  const handleKeyDown = (e) => {
    if (e.key === "Tab") return;
    e.preventDefault();
    if (e.key === "ArrowRight") onRightFocus?.();
    if (e.key === "ArrowLeft") onLeftFocus?.();
    if (["ArrowUp", "ArrowDown"].includes(e.key)) {
      const step = e.key === "ArrowUp" ? 1 : -1;
      const newValue = getArrowByType(calculatedValue, step, picker);
      if (flag) setFlag(false);
      const tempDate = new Date(date);
      setDate(setDateByType(tempDate, newValue, picker, period));
    }
    if (e.key >= "0" && e.key <= "9") {
      if (picker === "12hours") setPrevIntKey(e.key);

      const newValue = calculateNewValue(e.key);
      if (flag) onRightFocus?.();
      setFlag((prev) => !prev);
      const tempDate = new Date(date);
      setDate(setDateByType(tempDate, newValue, picker, period));
    }
  };

  return React.createElement(Input, {
    ref: ref,
    id: id || picker,
    name: name || picker,
    className: cn(
      "w-[48px] text-center font-mono text-base tabular-nums caret-transparent focus:bg-accent focus:text-accent-foreground [&::-webkit-inner-spin-button]:appearance-none",
      className
    ),
    value: value || calculatedValue,
    onChange: (e) => {
      e.preventDefault();
      onChange?.(e);
    },
    type: type,
    inputMode: "decimal",
    onKeyDown: (e) => {
      onKeyDown?.(e);
      handleKeyDown(e);
    },
    ...props,
  });
});

TimePickerInput.displayName = "TimePickerInput";

export { TimePickerInput };
