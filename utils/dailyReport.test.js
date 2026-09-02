import { describe, it, expect } from "@jest/globals";
import {
  buildReportText,
  formatSpent,
  parseSpent,
  formatMinutes,
  getPendingDays,
  parseRmsHours,
  loggedMinutesByDate,
} from "./dailyReport";

describe("formatSpent", () => {
  it("returns empty when both fields are blank", () => {
    expect(formatSpent("", "")).toBe("");
  });

  it("returns empty for zeros", () => {
    expect(formatSpent("0", "0")).toBe("");
    expect(formatSpent(0, 0)).toBe("");
  });

  it("formats hours only", () => {
    expect(formatSpent("2", "")).toBe("2h");
    expect(formatSpent("2", "0")).toBe("2h");
  });

  it("formats minutes only", () => {
    expect(formatSpent("", "45")).toBe("45m");
    expect(formatSpent("0", "45")).toBe("45m");
  });

  it("formats hours and minutes", () => {
    expect(formatSpent("2", "30")).toBe("2h 30m");
  });

  it("accepts numbers as well as strings", () => {
    expect(formatSpent(1, 5)).toBe("1h 5m");
  });

  it("ignores non-numeric input", () => {
    expect(formatSpent("abc", "xyz")).toBe("");
    expect(formatSpent("abc", "30")).toBe("30m");
  });

  it("ignores negative values", () => {
    expect(formatSpent("-3", "-10")).toBe("");
    expect(formatSpent("-3", "20")).toBe("20m");
  });
});

const DAY = new Date(2026, 7, 21); // 21 Aug 2026

const entry = (overrides = {}) => ({
  id: "1",
  date: "2026-08-21",
  projectId: 804,
  projectName: "IntelliWealthVision AI Platform",
  milestoneName: null,
  taskName: null,
  timeSpent: "",
  notes: "Did the thing",
  ...overrides,
});

describe("buildReportText", () => {
  it("returns empty string for no entries", () => {
    expect(buildReportText([], DAY)).toBe("");
    expect(buildReportText(null, DAY)).toBe("");
    expect(buildReportText(undefined, DAY)).toBe("");
  });

  it("renders a heading with the report date", () => {
    const text = buildReportText([entry()], DAY);
    expect(text.split("\n")[0]).toBe("Daily Report — 21 Aug 2026");
  });

  it("renders notes only when there is no milestone or task", () => {
    const text = buildReportText([entry({ notes: "Fixed login" })], DAY);
    expect(text).toContain("  - Fixed login");
    expect(text).not.toContain("[");
  });

  it("prefixes the milestone when present", () => {
    const text = buildReportText(
      [entry({ milestoneName: "DB Design", notes: "Added indexes" })],
      DAY,
    );
    expect(text).toContain("  - [DB Design] Added indexes");
  });

  it("joins milestone and task with a chevron", () => {
    const text = buildReportText(
      [
        entry({
          milestoneName: "DataFeed Synchronize",
          taskName: "CAMS and KFINTECH",
          notes: "Parsed statements",
        }),
      ],
      DAY,
    );
    expect(text).toContain(
      "  - [DataFeed Synchronize › CAMS and KFINTECH] Parsed statements",
    );
  });

  it("renders a task without a milestone", () => {
    const text = buildReportText(
      [entry({ taskName: "Reports Design", notes: "Drafted layout" })],
      DAY,
    );
    expect(text).toContain("  - [Reports Design] Drafted layout");
  });

  it("appends time spent in parentheses when provided", () => {
    const text = buildReportText(
      [entry({ notes: "Refactored service", timeSpent: "2h 30m" })],
      DAY,
    );
    expect(text).toContain("  - Refactored service (2h 30m)");
  });

  it("omits the time segment when timeSpent is empty", () => {
    const text = buildReportText([entry({ timeSpent: "" })], DAY);
    expect(text).not.toContain("()");
  });

  it("groups multiple entries under one project heading", () => {
    const text = buildReportText(
      [
        entry({ id: "1", notes: "First" }),
        entry({ id: "2", notes: "Second" }),
      ],
      DAY,
    );
    const headings = text
      .split("\n")
      .filter((l) => l === "IntelliWealthVision AI Platform:");
    expect(headings).toHaveLength(1);
    expect(text).toContain("  - First");
    expect(text).toContain("  - Second");
  });

  it("separates entries across different projects", () => {
    const text = buildReportText(
      [
        entry({ id: "1", projectName: "HomeWorth", notes: "QA pass" }),
        entry({ id: "2", projectName: "PowerBAK", notes: "Android build" }),
      ],
      DAY,
    );
    expect(text).toContain("HomeWorth:");
    expect(text).toContain("PowerBAK:");
    expect(text.indexOf("HomeWorth:")).toBeLessThan(text.indexOf("PowerBAK:"));
  });

  it("does not leave trailing blank lines", () => {
    const text = buildReportText([entry()], DAY);
    expect(text).toBe(text.trimEnd());
  });

  it("puts every field together in the full form", () => {
    const text = buildReportText(
      [
        entry({
          projectName: "HomeWorth",
          milestoneName: "Prototype",
          taskName: "Required Reports",
          notes: "Wrote the spec",
          timeSpent: "1h",
        }),
      ],
      DAY,
    );
    expect(text).toBe(
      [
        "Daily Report — 21 Aug 2026",
        "",
        "HomeWorth:",
        "  - [Prototype › Required Reports] Wrote the spec (1h)",
      ].join("\n"),
    );
  });
});

describe("parseSpent", () => {
  it("returns 0 for blank input", () => {
    expect(parseSpent("")).toBe(0);
    expect(parseSpent(null)).toBe(0);
    expect(parseSpent(undefined)).toBe(0);
  });

  it("parses hours only", () => {
    expect(parseSpent("2h")).toBe(120);
  });

  it("parses minutes only", () => {
    expect(parseSpent("45m")).toBe(45);
  });

  it("parses hours and minutes", () => {
    expect(parseSpent("8h 15m")).toBe(495);
  });

  it("round-trips with formatSpent", () => {
    expect(parseSpent(formatSpent("2", "30"))).toBe(150);
    expect(parseSpent(formatSpent("8", "15"))).toBe(495);
    expect(parseSpent(formatSpent("0", "20"))).toBe(20);
  });
});

describe("formatMinutes", () => {
  it("formats zero", () => expect(formatMinutes(0)).toBe("0m"));
  it("formats minutes only", () => expect(formatMinutes(45)).toBe("45m"));
  it("formats whole hours", () => expect(formatMinutes(300)).toBe("5h"));
  it("formats hours and minutes", () => expect(formatMinutes(495)).toBe("8h 15m"));
  it("clamps negatives to zero", () => expect(formatMinutes(-10)).toBe("0m"));
});

describe("getPendingDays", () => {
  // Wed 2026-09-02, so the three prior weekdays are Tue 1st, Mon 31st, Fri 28th.
  const TODAY = new Date(2026, 8, 2);
  const TARGET = 495; // 8h 15m

  const logged = (date, timeSpent) => ({
    id: date,
    date,
    projectName: "P",
    notes: "n",
    timeSpent,
  });

  it("reports a full shift pending for a day with no entries", () => {
    const [first] = getPendingDays([], { today: TODAY, targetMinutes: TARGET });
    expect(first.date).toBe("2026-09-01");
    expect(first.pendingMinutes).toBe(495);
    expect(formatMinutes(first.pendingMinutes)).toBe("8h 15m");
  });

  it("subtracts logged time from the target", () => {
    // 3h 15m logged against 8h 15m leaves 5h.
    const entries = [logged("2026-09-01", "3h 15m")];
    const [first] = getPendingDays(entries, {
      today: TODAY,
      targetMinutes: TARGET,
    });
    expect(first.loggedMinutes).toBe(195);
    expect(formatMinutes(first.pendingMinutes)).toBe("5h");
  });

  it("sums multiple entries on the same day", () => {
    const entries = [
      logged("2026-09-01", "2h"),
      logged("2026-09-01", "1h 15m"),
    ];
    const [first] = getPendingDays(entries, {
      today: TODAY,
      targetMinutes: TARGET,
    });
    expect(first.loggedMinutes).toBe(195);
    expect(formatMinutes(first.pendingMinutes)).toBe("5h");
  });

  it("produces the three-day backlog: 5h, 2h and 8h 15m", () => {
    const entries = [
      logged("2026-09-01", "3h 15m"), // -> 5h pending
      logged("2026-08-31", "6h 15m"), // -> 2h pending
      // 2026-08-28 has nothing -> full 8h 15m pending
    ];

    const result = getPendingDays(entries, {
      today: TODAY,
      targetMinutes: TARGET,
    });

    expect(result.map((d) => d.date)).toEqual([
      "2026-09-01",
      "2026-08-31",
      "2026-08-28",
    ]);
    expect(result.map((d) => formatMinutes(d.pendingMinutes))).toEqual([
      "5h",
      "2h",
      "8h 15m",
    ]);
  });

  it("skips weekends", () => {
    const result = getPendingDays([], { today: TODAY, targetMinutes: TARGET });
    result.forEach((d) => {
      const day = new Date(`${d.date}T00:00:00`).getDay();
      expect(day).not.toBe(0);
      expect(day).not.toBe(6);
    });
    // Sat 29th and Sun 30th are absent between Mon 31st and Fri 28th.
    expect(result.map((d) => d.date)).not.toContain("2026-08-29");
    expect(result.map((d) => d.date)).not.toContain("2026-08-30");
  });

  it("excludes days that already meet the target", () => {
    const entries = [logged("2026-09-01", "8h 15m")];
    const result = getPendingDays(entries, {
      today: TODAY,
      targetMinutes: TARGET,
    });
    expect(result.map((d) => d.date)).not.toContain("2026-09-01");
    expect(result).toHaveLength(3);
  });

  it("excludes days logged beyond the target", () => {
    const entries = [logged("2026-09-01", "10h")];
    const result = getPendingDays(entries, {
      today: TODAY,
      targetMinutes: TARGET,
    });
    expect(result.map((d) => d.date)).not.toContain("2026-09-01");
  });

  it("never includes today", () => {
    const result = getPendingDays([], { today: TODAY, targetMinutes: TARGET });
    expect(result.map((d) => d.date)).not.toContain("2026-09-02");
  });

  it("honours the requested number of days", () => {
    expect(
      getPendingDays([], { today: TODAY, targetMinutes: TARGET, days: 1 }),
    ).toHaveLength(1);
    expect(
      getPendingDays([], { today: TODAY, targetMinutes: TARGET, days: 5 }),
    ).toHaveLength(5);
  });

  it("returns nothing when the whole lookback window is complete", () => {
    const entries = [];
    for (let d = 1; d <= 21; d += 1) {
      const day = new Date(2026, 8, 2);
      day.setDate(day.getDate() - d);
      const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
      entries.push(logged(key, "8h 15m"));
    }
    expect(
      getPendingDays(entries, { today: TODAY, targetMinutes: TARGET }),
    ).toEqual([]);
  });
});

describe("parseRmsHours (RMS stores HH.MM, not decimal)", () => {
  it("reads whole hours", () => {
    expect(parseRmsHours("7.00")).toBe(420);
    expect(parseRmsHours("1.00")).toBe(60);
  });

  it("reads minutes-only values", () => {
    expect(parseRmsHours("0.45")).toBe(45);
    expect(parseRmsHours("0.30")).toBe(30);
  });

  it("reads hours and minutes", () => {
    expect(parseRmsHours("7.30")).toBe(450);
    expect(parseRmsHours("8.15")).toBe(495);
  });

  it("matches the real 2026-08-26 record: 0.45 + 7.30 is exactly one shift", () => {
    expect(parseRmsHours("0.45") + parseRmsHours("7.30")).toBe(495);
  });

  it("does not treat the fraction as decimal hours", () => {
    // Decimal would make 7.30 into 7h18m; HH.MM makes it 7h30m.
    expect(parseRmsHours("7.30")).not.toBe(438);
  });

  it("survives float noise", () => {
    expect(parseRmsHours(7.3)).toBe(450);
    expect(parseRmsHours(0.45)).toBe(45);
  });

  it("returns 0 for junk or empty values", () => {
    expect(parseRmsHours(null)).toBe(0);
    expect(parseRmsHours("")).toBe(0);
    expect(parseRmsHours("abc")).toBe(0);
    expect(parseRmsHours("-3.00")).toBe(0);
  });
});

describe("loggedMinutesByDate", () => {
  it("returns an empty map for no rows", () => {
    expect(loggedMinutesByDate([])).toEqual({});
    expect(loggedMinutesByDate(null)).toEqual({});
  });

  it("sums several rows on one date", () => {
    const rows = [
      { reportingDate: "2026-08-26", timeSpent: "0.45" },
      { reportingDate: "2026-08-26", timeSpent: "7.30" },
    ];
    expect(loggedMinutesByDate(rows)).toEqual({ "2026-08-26": 495 });
  });

  it("keys separate dates apart", () => {
    const rows = [
      { reportingDate: "2026-08-26", timeSpent: "8.15" },
      { reportingDate: "2026-08-25", timeSpent: "7.30" },
    ];
    expect(loggedMinutesByDate(rows)).toEqual({
      "2026-08-26": 495,
      "2026-08-25": 450,
    });
  });

  it("trims an ISO timestamp down to the date", () => {
    const rows = [
      { reportingDate: "2026-08-26T00:00:00.000Z", timeSpent: "8.15" },
    ];
    expect(loggedMinutesByDate(rows)).toEqual({ "2026-08-26": 495 });
  });

  it("ignores rows with no date", () => {
    expect(loggedMinutesByDate([{ timeSpent: "8.15" }])).toEqual({});
  });
});

describe("getPendingDays with RMS totals", () => {
  const TODAY = new Date(2026, 8, 2); // Wed 2 Sep
  const TARGET = 495;

  it("uses RMS totals instead of local drafts", () => {
    // The exact bug reported: a full shift logged in RMS, nothing stored locally.
    const result = getPendingDays([], {
      today: TODAY,
      targetMinutes: TARGET,
      loggedByDate: { "2026-09-01": 495 },
    });
    expect(result.map((d) => d.date)).not.toContain("2026-09-01");
  });

  it("shows the shortfall when RMS has a partial day", () => {
    const [first] = getPendingDays([], {
      today: TODAY,
      targetMinutes: TARGET,
      loggedByDate: { "2026-09-01": 195 }, // 3h 15m
    });
    expect(first.date).toBe("2026-09-01");
    expect(formatMinutes(first.pendingMinutes)).toBe("5h");
  });

  it("ignores local drafts once RMS totals are supplied", () => {
    const drafts = [
      { date: "2026-09-01", timeSpent: "8h 15m", projectName: "P", notes: "n" },
    ];
    const [first] = getPendingDays(drafts, {
      today: TODAY,
      targetMinutes: TARGET,
      loggedByDate: {}, // RMS says nothing was submitted
    });
    expect(first.date).toBe("2026-09-01");
    expect(first.pendingMinutes).toBe(495);
  });

  it("falls back to local drafts when RMS totals are unavailable", () => {
    const drafts = [
      { date: "2026-09-01", timeSpent: "8h 15m", projectName: "P", notes: "n" },
    ];
    const result = getPendingDays(drafts, {
      today: TODAY,
      targetMinutes: TARGET,
      loggedByDate: null,
    });
    expect(result.map((d) => d.date)).not.toContain("2026-09-01");
  });
});
