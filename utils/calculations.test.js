import { describe, it, expect } from "vitest";
import dayjs from "dayjs";
import { 
  calculateTotalBreakMinutes, 
  getCompletionTime, 
  getTimeStatus, 
  formatDuration 
} from "./calculations";

describe("Work Time Calculations", () => {
  describe("calculateTotalBreakMinutes", () => {
    it("should calculate duration mode correctly", () => {
      const firstBreak = new Date(2024, 0, 1, 0, 30); // 30 mins
      const additionalBreaks = [
        { id: 1, duration: new Date(2024, 0, 1, 0, 15) }, // 15 mins
        { id: 2, duration: new Date(2024, 0, 1, 1, 0) },  // 1 hour
      ];
      
      const total = calculateTotalBreakMinutes("duration", firstBreak, additionalBreaks, []);
      expect(total).toBe(105); // 30 + 15 + 60 = 105
    });

    it("should calculate range mode correctly", () => {
      const breakRanges = [
        { 
          id: 1, 
          start: dayjs("2024-01-01T12:00:00").toDate(), 
          end: dayjs("2024-01-01T13:00:00").toDate() 
        }, // 60 mins
        { 
          id: 2, 
          start: dayjs("2024-01-01T15:00:00").toDate(), 
          end: dayjs("2024-01-01T15:15:00").toDate() 
        }, // 15 mins
      ];
      
      const total = calculateTotalBreakMinutes("range", null, [], breakRanges);
      expect(total).toBe(75);
    });

    it("should handle empty breaks", () => {
      expect(calculateTotalBreakMinutes("duration", null, [], [])).toBe(0);
      expect(calculateTotalBreakMinutes("range", null, [], [])).toBe(0);
    });
  });

  describe("getCompletionTime", () => {
    it("should calculate completion time correctly", () => {
      const arrivalTime = dayjs("2024-01-01T09:00:00");
      const totalBreakMinutes = 60;
      const requiredWorkMinutes = 480; // 8 hours
      
      const completion = getCompletionTime(arrivalTime, totalBreakMinutes, requiredWorkMinutes);
      
      // 9:00 + 8h + 1h = 18:00 (6:00 PM)
      expect(completion.format("HH:mm")).toBe("18:00");
    });
  });

  describe("getTimeStatus", () => {
    it("should calculate completed and remaining minutes", () => {
      const arrivalTime = dayjs("2024-01-01T09:00:00");
      const currentTime = dayjs("2024-01-01T13:00:00");
      const totalBreakMinutes = 30;
      const requiredWorkMinutes = 480; // 8 hours
      
      // Elapsed: 4 hours (240 mins) - 30 mins break = 210 mins worked
      const { completedMinutes, remainingMinutes } = getTimeStatus(
        arrivalTime, 
        currentTime, 
        totalBreakMinutes, 
        requiredWorkMinutes
      );
      
      expect(completedMinutes).toBe(210);
      expect(remainingMinutes).toBe(270); // 480 - 210 = 270
    });

    it("should not return negative completed minutes if current time is before arrival", () => {
      const arrival = dayjs("2024-01-01T09:00:00");
      const current = dayjs("2024-01-01T08:00:00");
      const { completedMinutes } = getTimeStatus(arrival, current, 0, 480);
      expect(completedMinutes).toBe(0);
    });
  });

  describe("formatDuration", () => {
    it("should format minutes correctly", () => {
      expect(formatDuration(65)).toBe("1 hours 5 minutes");
      expect(formatDuration(120)).toBe("2 hours 0 minutes");
      expect(formatDuration(0)).toBe("0 hours 0 minutes");
    });
  });
});
