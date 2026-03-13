import dayjs from "dayjs";

/**
 * Calculates the total break minutes based on the selected mode.
 * 
 * @param {string} mode - "duration" or "range"
 * @param {Date} firstBreak - First break duration (for duration mode)
 * @param {Array} additionalBreaks - List of additional break durations (for duration mode)
 * @param {Array} breakRanges - List of break ranges { start, end } (for range mode)
 * @returns {number} - Total break time in minutes
 */
export const calculateTotalBreakMinutes = (mode, firstBreak, additionalBreaks, breakRanges) => {
  if (mode === "duration") {
    const firstBreakMinutes = firstBreak ? (firstBreak.getHours() * 60 + firstBreak.getMinutes()) : 0;
    const additionalBreaksMinutes = (additionalBreaks || []).reduce((total, breakItem) => {
      const duration = breakItem.duration;
      return total + (duration ? (duration.getHours() * 60 + duration.getMinutes()) : 0);
    }, 0);
    return firstBreakMinutes + additionalBreaksMinutes;
  } else {
    return (breakRanges || []).reduce((total, range) => {
      if (!range.start || !range.end) return total;
      const start = dayjs(range.start);
      const end = dayjs(range.end);
      let diff = end.diff(start, "minute");
      
      // Handle overnight breaks if they exist, though unlikely in this app context
      if (diff < 0) diff += 24 * 60; 
      
      return total + diff;
    }, 0);
  }
};

/**
 * Calculates the expected completion time.
 * 
 * @param {Date|dayjs.Dayjs} arrivalTime - When the user started work
 * @param {number} totalBreakMinutes - Total break time in minutes
 * @param {number} requiredWorkMinutes - Required work time in minutes
 * @returns {dayjs.Dayjs|null} - Completion time as dayjs object
 */
export const getCompletionTime = (arrivalTime, totalBreakMinutes, requiredWorkMinutes) => {
  if (!arrivalTime) return null;
  
  const totalMinutesToSpend = requiredWorkMinutes + totalBreakMinutes;
  return dayjs(arrivalTime).add(totalMinutesToSpend, "minute");
};

/**
 * Calculates elapsed work time and remaining work time.
 * 
 * @param {Date|dayjs.Dayjs} arrivalTime - When the user started work
 * @param {Date|dayjs.Dayjs} currentTime - Current time
 * @param {number} totalBreakMinutes - Total break time in minutes
 * @param {number} requiredWorkMinutes - Required work time in minutes
 * @returns {object} - { completedMinutes, remainingMinutes }
 */
export const getTimeStatus = (arrivalTime, currentTime, totalBreakMinutes, requiredWorkMinutes) => {
  if (!arrivalTime) return { completedMinutes: 0, remainingMinutes: requiredWorkMinutes };

  const arrival = dayjs(arrivalTime);
  const now = dayjs(currentTime);
  
  // Total minutes elapsed since arrival, minus breaks
  const elapsedMinutes = now.diff(arrival, "minute") - totalBreakMinutes;
  
  const completedMinutes = Math.max(0, elapsedMinutes);
  const remainingMinutes = Math.max(0, requiredWorkMinutes - completedMinutes);
  
  return {
    completedMinutes,
    remainingMinutes
  };
};

/**
 * Formats minutes into "X hours Y minutes" string.
 * 
 * @param {number} totalMinutes - Total minutes
 * @returns {string} - Formatted string
 */
export const formatDuration = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours} hours ${minutes} minutes`;
};
