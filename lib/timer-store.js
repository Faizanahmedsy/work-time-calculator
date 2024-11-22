import { create } from "zustand";
import { persist } from "zustand/middleware";
import dayjs from "dayjs";

export const useTimeCalculatorStore = create(
  persist(
    (set, get) => ({
      arrivalTime: undefined,
      firstBreak: new Date(0, 0, 0, 0, 0, 0),
      breaks: [],
      lastResetDate: new Date(),

      setArrivalTime: (time) => set({ arrivalTime: time }),

      setFirstBreak: (time) => set({ firstBreak: time }),

      addBreak: () =>
        set((state) => ({
          breaks: [
            ...state.breaks,
            {
              id: Date.now(),
              duration: new Date(0, 0, 0, 0, 0, 0),
            },
          ],
        })),

      updateBreak: (id, newBreakDuration) =>
        set((state) => ({
          breaks: state.breaks.map((breakItem) =>
            breakItem.id === id
              ? { ...breakItem, duration: newBreakDuration }
              : breakItem
          ),
        })),

      removeBreak: (id) =>
        set((state) => ({
          breaks: state.breaks.filter((breakItem) => breakItem.id !== id),
        })),

      resetState: () =>
        set({
          arrivalTime: undefined,
          firstBreak: new Date(0, 0, 0, 0, 0, 0),
          breaks: [],
          lastResetDate: new Date(),
        }),
    }),
    {
      name: "work-time-calculator-storage",
      onRehydrateStorage: () => (state) => {
        // Check if it's past 6 AM and reset if needed
        if (state) {
          const now = dayjs();
          const lastReset = dayjs(state.lastResetDate);
          const resetTime = lastReset
            .set("hour", 6)
            .set("minute", 0)
            .set("second", 0);

          if (now.isAfter(resetTime)) {
            state.resetState();
          }
        }
      },
    }
  )
);
