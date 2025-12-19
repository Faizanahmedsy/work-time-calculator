"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import dayjs from "dayjs";

/**
 * Work Time Store
 *
 * Manages work time calculator state with daily reset functionality.
 * Data persists in localStorage throughout the day and resets at midnight.
 */

const STORE_NAME = "work-time-calculator-store";

/**
 * Checks if stored data is from today
 * @param {string} storedDate - ISO date string from storage
 * @returns {boolean} - True if data is from today
 */
const isToday = (storedDate) => {
  if (!storedDate) return false;
  return dayjs(storedDate).isSame(dayjs(), "day");
};

/**
 * Initial state for the work time calculator
 */
const initialState = {
  // User inputs
  arrivalTime: null,
  workMode: "full", // "full" or "half"
  firstBreak: new Date(0, 0, 0, 0, 0, 0),
  breaks: [],

  // Custom work time settings
  fullDayHours: 8,
  fullDayMinutes: 15,
  halfDayHours: 4,
  halfDayMinutes: 15,

  // Calculated results
  completionTime: "",
  timeCompleted: null,
  timeRemaining: null,

  // Metadata
  lastUpdated: new Date().toISOString(),
};

export const useWorkTimeStore = create(
  persist(
    (set, get) => ({
      ...initialState,

      /**
       * Set arrival time
       * @param {Date} time - Arrival time
       */
      setArrivalTime: (time) => {
        set({ arrivalTime: time, lastUpdated: new Date().toISOString() });
      },

      /**
       * Set work mode (full day or half day)
       * @param {string} mode - "full" or "half"
       */
      setWorkMode: (mode) => {
        set({ workMode: mode, lastUpdated: new Date().toISOString() });
      },

      /**
       * Set first break duration
       * @param {Date} duration - Break duration
       */
      setFirstBreak: (duration) => {
        set({ firstBreak: duration, lastUpdated: new Date().toISOString() });
      },

      /**
       * Add a new break
       */
      addBreak: () => {
        const newBreak = {
          id: Date.now(),
          duration: new Date(0, 0, 0, 0, 0, 0),
        };
        set((state) => ({
          breaks: [...state.breaks, newBreak],
          lastUpdated: new Date().toISOString(),
        }));
      },

      /**
       * Update a break duration
       * @param {number} id - Break ID
       * @param {Date} duration - New duration
       */
      updateBreak: (id, duration) => {
        set((state) => ({
          breaks: state.breaks.map((breakItem) =>
            breakItem.id === id ? { ...breakItem, duration } : breakItem
          ),
          lastUpdated: new Date().toISOString(),
        }));
      },

      /**
       * Remove a break
       * @param {number} id - Break ID
       */
      removeBreak: (id) => {
        set((state) => ({
          breaks: state.breaks.filter((breakItem) => breakItem.id !== id),
          lastUpdated: new Date().toISOString(),
        }));
      },

      /**
       * Set custom work time for full day
       * @param {number} hours - Hours
       * @param {number} minutes - Minutes
       */
      setFullDayTime: (hours, minutes) => {
        set({
          fullDayHours: hours,
          fullDayMinutes: minutes,
          lastUpdated: new Date().toISOString(),
        });
      },

      /**
       * Set custom work time for half day
       * @param {number} hours - Hours
       * @param {number} minutes - Minutes
       */
      setHalfDayTime: (hours, minutes) => {
        set({
          halfDayHours: hours,
          halfDayMinutes: minutes,
          lastUpdated: new Date().toISOString(),
        });
      },

      /**
       * Update calculated results
       * @param {object} results - Calculation results
       */
      setCalculationResults: (results) => {
        set({
          completionTime: results.completionTime,
          timeCompleted: results.timeCompleted,
          timeRemaining: results.timeRemaining,
          lastUpdated: new Date().toISOString(),
        });
      },

      /**
       * Reset all settings to defaults
       */
      resetToDefaults: () => {
        set({
          fullDayHours: 8,
          fullDayMinutes: 15,
          halfDayHours: 4,
          halfDayMinutes: 15,
          lastUpdated: new Date().toISOString(),
        });
      },

      /**
       * Reset state for a new day
       * Keeps custom work time settings but clears daily data
       */
      resetForNewDay: () => {
        const currentState = get();
        set({
          ...initialState,
          // Preserve custom work time settings
          fullDayHours: currentState.fullDayHours,
          fullDayMinutes: currentState.fullDayMinutes,
          halfDayHours: currentState.halfDayHours,
          halfDayMinutes: currentState.halfDayMinutes,
          lastUpdated: new Date().toISOString(),
        });
      },

      /**
       * Check if data needs to be reset for a new day
       * Call this on app initialization
       */
      checkAndResetIfNewDay: () => {
        const state = get();
        if (!isToday(state.lastUpdated)) {
          state.resetForNewDay();
        }
      },
    }),
    {
      name: STORE_NAME,
      // Custom storage with serialization for Date objects
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;

          const { state } = JSON.parse(str);

          // Deserialize Date objects with proper null checks
          if (state.arrivalTime) {
            state.arrivalTime = new Date(state.arrivalTime);
          }

          // Ensure firstBreak is always a valid Date object
          if (state.firstBreak) {
            state.firstBreak = new Date(state.firstBreak);
          } else {
            state.firstBreak = new Date(0, 0, 0, 0, 0, 0);
          }

          if (state.breaks && Array.isArray(state.breaks)) {
            state.breaks = state.breaks.map((br) => ({
              ...br,
              duration: br.duration
                ? new Date(br.duration)
                : new Date(0, 0, 0, 0, 0, 0),
            }));
          } else {
            state.breaks = [];
          }

          return { state };
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        },
      },
      // Ensure proper initialization after rehydration
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Ensure firstBreak is always a valid Date object
          if (!state.firstBreak || !(state.firstBreak instanceof Date)) {
            state.firstBreak = new Date(0, 0, 0, 0, 0, 0);
          }
          // Ensure breaks array exists
          if (!state.breaks) {
            state.breaks = [];
          }
        }
      },
    }
  )
);
