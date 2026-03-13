// Migrated to Jest for better environment compatibility
import { describe, it, expect } from "@jest/globals";
import dayjs from "dayjs";
import { 
  calculateTotalBreakMinutes, 
  getCompletionTime, 
  getTimeStatus, 
  formatDuration 
} from "./calculations";

describe("Work Time Calculations - Comprehensive Test Suite (100+ Scenarios)", () => {
  
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

    it("should correctly handle durations like 01:30 as 90 minutes", () => {
      // 01:30 as a duration
      const firstBreak = new Date(2024, 0, 1, 1, 30); 
      const total = calculateTotalBreakMinutes("duration", firstBreak, [], []);
      expect(total).toBe(90); 
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

  describe("getCompletionTime - 100 Scenarios", () => {
    const generateTestCases = () => {
      const testCases = [];
      
      // Category 1: Standard Morning Starts (06:00 AM - 11:00 AM)
      for (let h = 6; h <= 11; h++) {
        for (let m of [0, 15, 30, 45]) {
          testCases.push({
            arrival: `2024-01-01T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`,
            work: 495, // 8h 15m
            breaks: 60, // 1h
            expected: dayjs(`2024-01-01T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`).add(495 + 60, "minute").format("hh:mm A")
          });
        }
      }

      // Category 2: Afternoon & Late Starts (12:00 PM - 06:00 PM)
      for (let h = 12; h <= 18; h++) {
        testCases.push({
          arrival: `2024-01-01T${String(h).padStart(2, '0')}:00:00`,
          work: 255, // 4h 15m (Half Day)
          breaks: 30, // 30m
          expected: dayjs(`2024-01-01T${String(h).padStart(2, '0')}:00:00`).add(255 + 30, "minute").format("hh:mm A")
        });
      }

      // Category 3: Varying Break Durations (0m to 180m)
      for (let b = 0; b <= 180; b += 10) {
        testCases.push({
          arrival: `2024-01-01T09:00:00`,
          work: 480, // 8h
          breaks: b,
          expected: dayjs(`2024-01-01T09:00:00`).add(480 + b, "minute").format("hh:mm A")
        });
      }

      // Category 4: Crossing Midnight
      for (let h = 20; h <= 23; h++) {
        testCases.push({
          arrival: `2024-01-01T${h}:30:00`,
          work: 495, // 8h 15m
          breaks: 45, // 45m
          expected: dayjs(`2024-01-01T${h}:30:00`).add(495 + 45, "minute").format("hh:mm A")
        });
      }

      // Category 5: Edge Cases (Midnight, Noon)
      testCases.push({ arrival: `2024-01-01T00:00:00`, work: 480, breaks: 60, expected: "09:00 AM" });
      testCases.push({ arrival: `2024-01-01T12:00:00`, work: 480, breaks: 60, expected: "09:00 PM" });
      testCases.push({ arrival: `2024-01-01T11:59:00`, work: 1, breaks: 0, expected: "12:00 PM" }); // Mid-day check
      testCases.push({ arrival: `2024-01-01T23:59:00`, work: 1, breaks: 0, expected: "12:00 AM" }); // Midnight check

      // Ensure we hit exactly 100 or more
      while (testCases.length < 100) {
        const h = Math.floor(Math.random() * 24);
        const m = Math.floor(Math.random() * 60);
        const w = Math.floor(Math.random() * 600);
        const b = Math.floor(Math.random() * 120);
        testCases.push({
          arrival: `2024-01-01T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`,
          work: w,
          breaks: b,
          expected: dayjs(`2024-01-01T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`).add(w + b, "minute").format("hh:mm A")
        });
      }

      return testCases;
    };

    const cases = generateTestCases();
    
    it.each(cases)('should calculate completion for $arrival with $work work and $breaks breaks as $expected', ({ arrival, work, breaks, expected }) => {
      const completion = getCompletionTime(dayjs(arrival), breaks, work);
      expect(completion.format("hh:mm A")).toBe(expected);
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

  describe("Edge Case Scenarios (Aggressive Testing)", () => {
    it("should handle start at 11:59 PM and finish next day", () => {
      const arrival = dayjs("2024-01-01T23:59:00");
      const required = 10; // 10 mins
      const completion = getCompletionTime(arrival, 0, required);
      expect(completion.format("YYYY-MM-DD HH:mm")).toBe("2024-01-02 00:09");
    });

    it("should handle a massive 24h+ duration (though unlikely)", () => {
      const arrival = dayjs("2024-01-01T09:00:00");
      const required = 1440; // 24 hours
      const completion = getCompletionTime(arrival, 0, required);
      expect(completion.format("hh:mm A")).toBe("09:00 AM");
      expect(completion.date()).toBe(2);
    });

    it("should handle 12:50 PM Arrival + 8h 15m Work + 1h 30m Break = 10:35 PM", () => {
      const arrival = dayjs("2024-01-01T12:50:00"); // 12:50 PM
      const work = 495; // 8h 15m
      const breaks = 90; // 1h 30m
      const completion = getCompletionTime(arrival, breaks, work);
      expect(completion.format("hh:mm A")).toBe("10:35 PM");
    });

    it("should correctly handle 00:30 as a duration of 30 mins", () => {
      // Internal date for duration of 30 mins is 00:30
      const breakDate = new Date(2024, 0, 1, 0, 30);
      const total = calculateTotalBreakMinutes("duration", breakDate, [], []);
      expect(total).toBe(30);
    });

    it("should correctly handle 05:30 as a duration of 5.5 hours", () => {
      // Internal date for duration of 5h 30m is 05:30
      const breakDate = new Date(2024, 0, 1, 5, 30);
      const total = calculateTotalBreakMinutes("duration", breakDate, [], []);
      expect(total).toBe(330);
    });
  });
});
