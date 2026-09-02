import { format } from "date-fns";

/**
 * Turns the hour/minute picker fields into "2h 30m".
 * Returns "" when nothing meaningful was entered, so the report omits the segment.
 */
export function formatSpent(hours, minutes) {
  const h = parseInt(hours, 10) || 0;
  const m = parseInt(minutes, 10) || 0;
  if (h <= 0 && m <= 0) return "";
  if (m <= 0) return `${h}h`;
  if (h <= 0) return `${m}m`;
  return `${h}h ${m}m`;
}

/** Inverse of formatSpent: "2h 30m" -> 150 minutes. */
export function parseSpent(text) {
  if (!text) return 0;
  const hours = /(\d+)\s*h/i.exec(text);
  const minutes = /(\d+)\s*m/i.exec(text);
  return (hours ? Number(hours[1]) : 0) * 60 + (minutes ? Number(minutes[1]) : 0);
}

/** 150 -> "2h 30m". Always renders something, including "0m". */
export function formatMinutes(total) {
  const safe = Math.max(0, Math.round(total || 0));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  if (!h) return `${m}m`;
  if (!m) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * RMS stores `timeSpent` as HH.MM, not decimal hours — "7.30" is 7h30m, and
 * "0.45" is 45m. Verified against production: 2026-08-26 holds 0.45 + 7.30,
 * which is exactly one 8h15m shift (decimal would give a meaningless 7.75).
 */
export function parseRmsHours(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 0;
  const hours = Math.floor(n);
  // Guard against float noise: 7.3 -> 30, 0.45 -> 45.
  const minutes = Math.round((n - hours) * 100);
  return hours * 60 + minutes;
}

/** Totals RMS daily-report rows into { "yyyy-MM-dd": minutes }. */
export function loggedMinutesByDate(reports) {
  return (reports || []).reduce((acc, row) => {
    const key = (row?.reportingDate || "").slice(0, 10);
    if (!key) return acc;
    acc[key] = (acc[key] || 0) + parseRmsHours(row.timeSpent);
    return acc;
  }, {});
}

/** Minutes already logged for a given yyyy-MM-dd. */
export function loggedMinutesFor(entries, dateKey) {
  return (entries || [])
    .filter((e) => e.date === dateKey)
    .reduce((sum, e) => sum + parseSpent(e.timeSpent), 0);
}

/**
 * Past days that still owe time against the shift target.
 *
 * Walks backwards from yesterday, skipping weekends, and collects days whose
 * logged total is below `targetMinutes`. Stops once `days` are found or the
 * lookback window is exhausted.
 */
export function getPendingDays(
  entries,
  {
    targetMinutes = 8 * 60 + 15,
    days = 3,
    today = new Date(),
    skipWeekends = true,
    lookbackDays = 21,
    // When supplied, RMS is the source of truth for what has been logged and
    // the local draft entries are ignored for the pending maths.
    loggedByDate = null,
  } = {},
) {
  const pending = [];
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  cursor.setDate(cursor.getDate() - 1);

  for (let i = 0; i < lookbackDays && pending.length < days; i += 1) {
    const day = cursor.getDay();
    const isWeekend = day === 0 || day === 6;

    if (!(skipWeekends && isWeekend)) {
      const dateKey = format(cursor, "yyyy-MM-dd");
      const loggedMinutes = loggedByDate
        ? loggedByDate[dateKey] || 0
        : loggedMinutesFor(entries, dateKey);
      const pendingMinutes = targetMinutes - loggedMinutes;

      if (pendingMinutes > 0) {
        pending.push({
          date: dateKey,
          label: format(cursor, "d MMM"),
          weekday: format(cursor, "EEE"),
          loggedMinutes,
          pendingMinutes,
          targetMinutes,
        });
      }
    }

    cursor.setDate(cursor.getDate() - 1);
  }

  return pending;
}

/**
 * Builds the copyable daily-report text from a day's entries.
 * Entries are grouped by project, in first-seen order.
 */
export function buildReportText(entries, reportDate) {
  if (!entries || !entries.length) return "";

  const lines = [`Daily Report — ${format(reportDate, "dd MMM yyyy")}`, ""];

  const grouped = entries.reduce((acc, entry) => {
    acc[entry.projectName] = acc[entry.projectName] || [];
    acc[entry.projectName].push(entry);
    return acc;
  }, {});

  Object.entries(grouped).forEach(([projectName, items]) => {
    lines.push(`${projectName}:`);
    items.forEach((item) => {
      const parts = [];
      const scope = [item.milestoneName, item.taskName]
        .filter(Boolean)
        .join(" › ");
      if (scope) parts.push(`[${scope}]`);
      parts.push(item.notes);
      if (item.timeSpent) parts.push(`(${item.timeSpent})`);
      lines.push(`  - ${parts.join(" ")}`);
    });
    lines.push("");
  });

  return lines.join("\n").trim();
}
