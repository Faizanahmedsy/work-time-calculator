"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  getRmsAuthStateAction,
  getRmsDailyReportsAction,
  getRmsPendingReportCountAction,
  createRmsDailyReportAction,
  getRmsMilestonesAction,
  getRmsProjectsAction,
  rmsLoginAction,
  rmsLogoutAction,
} from "@/app/rms-actions";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCopy,
  Eye,
  EyeOff,
  Loader2,
  LogOut,
  Search,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  buildReportText,
  formatSpent,
  parseSpent,
  formatMinutes,
  getPendingDays,
  loggedMinutesByDate,
} from "@/utils/dailyReport";
import { logRms } from "@/utils/rmsDebug";
import { useWorkTimeStore } from "@/store/workTimeStore";

const PAGE_LIMIT = 9;
const STORAGE_KEY = "daily-report-entries";

/*
 * Palette — a ledger, not a dashboard.
 * ink   #0e1014  wells and sunken fields      line  #272e3a  hairline rules
 * shell #151920  card surface                 paper #e6e4e0  primary text
 * raise #1e242e  hover and chips              muted #8b93a3  secondary text
 * indigo           selection + primary action
 * amber            time still owed
 * emerald          time settled
 */
const INK = "bg-[#0e1014]";
const SHELL = "bg-[#151920]";
const LINE = "border-[#272e3a]";

// Radix wraps ScrollArea content in a `display: table` div, which shrink-wraps to
// the content width — that defeats `truncate` and forces horizontal overflow.
const scrollFix = "[&_[data-radix-scroll-area-viewport]>div]:!block";

const cardClass = cn(
  SHELL,
  "border",
  LINE,
  "rounded-xl flex flex-col overflow-hidden",
  "h-[calc(100vh-17rem)] min-h-[520px]",
);
const eyebrow =
  "text-[11px] font-semibold uppercase tracking-[0.1em] text-[#5b6473]";
const focusRing =
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500/70";
const fieldClass =
  "bg-[#0e1014] border-[#2d3542] text-[#e6e4e0] rounded-md h-9 text-[15px] focus:border-indigo-500 focus-visible:ring-0";

/** Ratio of logged to estimated, clamped for the meter. */
function meterFor(actual, estimate) {
  const a = Number(actual) || 0;
  const e = Number(estimate) || 0;
  if (e <= 0) return { pct: a > 0 ? 100 : 0, over: a > 0 };
  return { pct: Math.min(100, (a / e) * 100), over: a > e };
}

// A backlog longer than this scrolls in the list but is summarised rather than
// enumerated — see the pendingDays memo.
const MAX_BACKLOG_DAYS = 14;

export default function DailyReport() {
  const { toast } = useToast();
  const { fullDayHours, fullDayMinutes } = useWorkTimeStore();

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Login form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Projects
  const [projects, setProjects] = useState([]);
  const [metadata, setMetadata] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Milestones (own endpoint — the projects payload always ships modules: [])
  const [milestones, setMilestones] = useState([]);
  const [milestonesLoading, setMilestonesLoading] = useState(false);
  const [expandedMilestoneId, setExpandedMilestoneId] = useState(null);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  // Report composer
  const [reportDate, setReportDate] = useState(new Date());
  const [entries, setEntries] = useState([]);
  const [entriesHydrated, setEntriesHydrated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [spentHours, setSpentHours] = useState("");
  const [spentMinutes, setSpentMinutes] = useState("");
  const [notes, setNotes] = useState("");

  // What RMS says is already logged, keyed by yyyy-MM-dd.
  const [loggedByDate, setLoggedByDate] = useState(null);
  // RMS's own count of reports the user still owes. Authoritative: it accounts
  // for approved leave and public holidays, which we cannot derive locally.
  const [pendingCount, setPendingCount] = useState(null);

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) || null,
    [projects, selectedProjectId],
  );

  const selectedMilestone = useMemo(
    () => milestones.find((m) => m.id === selectedMilestoneId) || null,
    [milestones, selectedMilestoneId],
  );

  const selectedTask = useMemo(
    () =>
      (selectedMilestone?.tasks || []).find((t) => t.id === selectedTaskId) ||
      null,
    [selectedMilestone, selectedTaskId],
  );

  const reportKey = format(reportDate, "yyyy-MM-dd");

  const visibleEntries = useMemo(
    () => entries.filter((e) => e.date === reportKey),
    [entries, reportKey],
  );

  // Daily target comes from the shared shift settings, so Settings drives it.
  const targetMinutes = fullDayHours * 60 + fullDayMinutes;

  // Our local walk finds every non-weekend day short of target, which
  // over-counts: it has no way to know 13 Aug was a holiday or 28 Aug was
  // leave. RMS knows, but only tells us a count, not which dates. So we take
  // the dates from the local walk and trust RMS for how many of them are real,
  // keeping the most recent (leave/holidays skew older).
  const pendingDays = useMemo(() => {
    if (!entriesHydrated) return [];

    // pendingCount === 0 means RMS considers you square, even if our local walk
    // found gaps (leave, holidays, a start date mid-window). Trust RMS.
    if (pendingCount === 0) return [];

    // An account that has never filed reports can be hundreds of days behind.
    // Rendering all of them gives a meaningless "891h across 108 days" headline,
    // so the backlog stays a short actionable list and the real figure is
    // reported separately below it.
    const wanted =
      pendingCount === null
        ? 3
        : Math.min(Math.max(pendingCount, 1), MAX_BACKLOG_DAYS);

    return getPendingDays(entries, {
      targetMinutes,
      days: wanted,
      // The window has to outrun the count: gaps spread across holidays reach
      // further back than the number of days alone suggests.
      lookbackDays: Math.max(21, wanted * 10),
      loggedByDate,
    });
  }, [entries, entriesHydrated, targetMinutes, loggedByDate, pendingCount]);

  const totalOutstanding = useMemo(
    () => pendingDays.reduce((sum, d) => sum + d.pendingMinutes, 0),
    [pendingDays],
  );

  // Jump the composer to a backlog day with its outstanding time filled in.
  const handlePrefill = useCallback((day) => {
    const [y, m, d] = day.date.split("-").map(Number);
    setReportDate(new Date(y, m - 1, d));
    setSpentHours(String(Math.floor(day.pendingMinutes / 60)));
    setSpentMinutes(String(day.pendingMinutes % 60));
  }, []);

  // Restore auth + saved entries
  useEffect(() => {
    const init = async () => {
      const state = await getRmsAuthStateAction();
      setIsAuthenticated(state.isAuthenticated);
      setAuthChecked(true);
    };
    init();

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) setEntries(JSON.parse(stored));
    } catch (e) {
      // ignore corrupt local data
    } finally {
      setEntriesHydrated(true);
    }
  }, []);

  // Only persist once the stored entries have been read back, otherwise the
  // initial empty state overwrites them.
  useEffect(() => {
    if (!entriesHydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (e) {
      // storage unavailable, keep in-memory only
    }
  }, [entries, entriesHydrated]);

  // Debounce search box
  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(id);
  }, [search]);

  const fetchProjects = useCallback(async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    setError(null);

    let res;
    try {
      res = await getRmsProjectsAction({
        page,
        limit: PAGE_LIMIT,
        search: debouncedSearch,
        status: "active",
        isPinned: true,
      });
    } catch (err) {
      setError(err?.message || "Could not reach the server.");
      setLoading(false);
      return;
    }

    if (!res?.success) {
      if (res?.statusCode === 401) {
        await rmsLogoutAction();
        setIsAuthenticated(false);
        setProjects([]);
        toast({
          title: "Session expired",
          description: "Sign in to Resource Management again.",
          variant: "destructive",
        });
      } else {
        setError(res?.message || "Could not load projects.");
      }
      setLoading(false);
      return;
    }

    setProjects(res.data || []);
    setMetadata(res.metadata || null);
    setSelectedProjectId((current) => {
      const list = res.data || [];
      if (current && list.some((p) => p.id === current)) return current;
      return list[0]?.id ?? null;
    });
    setLoading(false);
  }, [isAuthenticated, page, debouncedSearch, toast]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Pull what RMS already has logged, so the backlog reflects real submissions
  // rather than only the drafts stored in this browser.
  const refreshLoggedTotals = useCallback(async () => {
    if (!isAuthenticated) return;

    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 30);
    const iso = (d) => format(d, "yyyy-MM-dd");

    try {
      const res = logRms(await getRmsDailyReportsAction({
        fromDate: iso(from),
        toDate: iso(to),
        limit: 100,
      }));
      if (res?.success) setLoggedByDate(loggedMinutesByDate(res.data || []));

      const countRes = logRms(await getRmsPendingReportCountAction());
      if (countRes?.success && typeof countRes.data?.pendingCount === "number") {
        setPendingCount(countRes.data.pendingCount);
      }
    } catch (err) {
      // Leave loggedByDate null so the backlog falls back to local drafts.
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshLoggedTotals();
  }, [refreshLoggedTotals]);

  useEffect(() => {
    setMilestones([]);
    setExpandedMilestoneId(null);
    setSelectedMilestoneId(null);
    setSelectedTaskId(null);

    if (!selectedProjectId) return;

    let cancelled = false;

    const loadMilestones = async () => {
      setMilestonesLoading(true);
      try {
        const res = await getRmsMilestonesAction(selectedProjectId);
        if (cancelled) return;
        setMilestones(res?.success ? res.data || [] : []);
      } catch (err) {
        if (!cancelled) setMilestones([]);
      } finally {
        if (!cancelled) setMilestonesLoading(false);
      }
    };

    loadMilestones();
    return () => {
      cancelled = true;
    };
  }, [selectedProjectId]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoggingIn(true);
    setError(null);

    let res;
    try {
      res = await rmsLoginAction(email, password);
    } catch (err) {
      setError(err?.message || "Could not reach the server.");
      setIsLoggingIn(false);
      return;
    }

    if (!res?.success) {
      setError(res?.message || "Sign in failed.");
      setIsLoggingIn(false);
      return;
    }

    setIsAuthenticated(true);
    setEmail("");
    setPassword("");
    setIsLoggingIn(false);
    toast({ title: "Connected", description: "Resource Management linked." });
  };

  const handleLogout = useCallback(async () => {
    await rmsLogoutAction();
    setIsAuthenticated(false);
    setProjects([]);
    setMetadata(null);
    setSelectedProjectId(null);
    setMilestones([]);
    setLoggedByDate(null);
    setSearch("");
    setPage(1);
    setError(null);
    // Report entries stay put — they are local drafts, not RMS data.
    toast({ title: "Signed out", description: "Resource Management disconnected." });
  }, [toast]);

  const handleAddEntry = async () => {
    if (!selectedProject || !notes.trim()) {
      toast({
        title: "Missing details",
        description: "Pick a project and describe what you did.",
        variant: "destructive",
      });
      return;
    }

    // RMS files reports against a task, not a project, so both levels are
    // required before we can submit. Previously this only lived locally, so a
    // bare project was enough.
    if (!selectedMilestone || !selectedTask) {
      toast({
        title: "Pick a task",
        description: "RMS files reports against a milestone task.",
        variant: "destructive",
      });
      return;
    }

    const minutes = parseSpent(formatSpent(spentHours, spentMinutes));
    if (minutes <= 0) {
      toast({
        title: "Add the time spent",
        description: "RMS rejects a report with no duration.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    const res = logRms(await createRmsDailyReportAction({
      projectId: selectedProject.id,
      projectMilestoneId: selectedMilestone.id,
      taskId: selectedTask.id,
      reportingDate: reportKey,
      // RMS writes want "8h15m" (no space); reads come back as "8.15".
      taskDescription: `<p>${notes.trim()}</p>`,
      timeSpent: formatSpent(spentHours, spentMinutes).replace(/\s+/g, ""),
    }));
    setSubmitting(false);

    if (!res?.success) {
      toast({
        title: "RMS rejected the report",
        description: res?.message || "Submission failed.",
        variant: "destructive",
      });
      return;
    }

    // The backlog reads from RMS, so it only moves once we refetch. Pull both
    // the logged totals and the pending count.
    await refreshLoggedTotals();

    toast({
      title: "Report filed",
      description: `${formatSpent(spentHours, spentMinutes)} logged to RMS for ${reportKey}.`,
    });

    setEntries((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${prev.length}`,
        date: reportKey,
        projectId: selectedProject.id,
        projectName: selectedProject.name,
        milestoneName: selectedMilestone?.name || null,
        taskName: selectedTask?.taskName || null,
        timeSpent: formatSpent(spentHours, spentMinutes),
        notes: notes.trim(),
      },
    ]);

    setNotes("");
    setSpentHours("");
    setSpentMinutes("");
  };

  const handleRemoveEntry = (id) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const reportText = useMemo(
    () => buildReportText(visibleEntries, reportDate),
    [visibleEntries, reportDate],
  );

  const handleCopyReport = async () => {
    if (!reportText) return;
    try {
      await navigator.clipboard.writeText(reportText);
      toast({ title: "Copied", description: "Report is on your clipboard." });
    } catch (e) {
      toast({
        title: "Copy blocked",
        description: "Your browser refused clipboard access.",
        variant: "destructive",
      });
    }
  };

  if (!authChecked) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 text-[#5b6473] animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] p-4">
        <Card
          className={cn(
            SHELL,
            "w-full max-w-sm border",
            LINE,
            "rounded-xl overflow-hidden",
          )}
        >
          <div className={cn("px-6 py-5 border-b", LINE)}>
            <p className={eyebrow}>Resource Management</p>
            <h2 className="text-lg font-semibold text-[#e6e4e0] mt-1">
              Sign in to load your projects
            </h2>
          </div>
          <form onSubmit={handleLogin} className="p-6 space-y-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="rms-email"
                className="text-sm font-medium text-[#8b93a3]"
              >
                Email address
              </Label>
              <Input
                id="rms-email"
                type="email"
                autoComplete="username"
                placeholder="name@devstree.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoggingIn}
                className={cn(fieldClass, "h-10")}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="rms-password"
                className="text-sm font-medium text-[#8b93a3]"
              >
                Password
              </Label>
              <div className="relative">
                <Input
                  id="rms-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoggingIn}
                  className={cn(fieldClass, "h-10 pr-10")}
                  required
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className={cn(
                    "absolute right-3 top-1/2 -translate-y-1/2 rounded text-[#5b6473] hover:text-[#e6e4e0]",
                    focusRing,
                  )}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {error && (
              <p className="text-sm text-amber-300 border border-amber-900/70 bg-amber-950/50 rounded-md px-3 py-2">
                {error}
              </p>
            )}
            <Button
              type="submit"
              className={cn(
                "w-full h-10 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-medium",
                focusRing,
              )}
              disabled={isLoggingIn}
            >
              {isLoggingIn ? <Loader2 className="animate-spin" /> : "Sign in"}
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-amber-900/70 bg-amber-950/50 px-4 py-2.5 text-[15px] text-amber-200">
          {error}
        </div>
      )}

      {/* OUTSTANDING — the balance you owe, and the day lines behind it */}
      {pendingDays.length > 0 && (
        <section
          className={cn(SHELL, "border", LINE, "rounded-xl overflow-hidden")}
        >
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
            <div
              className={cn(
                "px-6 py-5 border-b lg:border-b-0 lg:border-r",
                LINE,
                INK,
              )}
            >
              <p className={eyebrow}>Outstanding</p>
              <p className="mt-2 text-5xl font-semibold tracking-tight text-amber-300 tabular-nums">
                {formatMinutes(totalOutstanding)}
              </p>
              <p className="mt-1.5 text-sm text-[#8b93a3]">
                across {pendingDays.length} day
                {pendingDays.length === 1 ? "" : "s"} · {formatMinutes(targetMinutes)}{" "}
                target
              </p>
              {/* RMS knows about more gaps than our lookback window reached, so
                  say so rather than quietly showing a short list. */}
              {pendingCount !== null && pendingCount > pendingDays.length && (
                <p className="mt-1.5 text-xs text-amber-300/70">
                  RMS reports {pendingCount} pending — showing the{" "}
                  {pendingDays.length} most recent.
                </p>
              )}
            </div>

            {/* Caps at ~3 rows, then scrolls: a long backlog must not push the
                projects and composer off-screen. */}
            <ul className="divide-y divide-[#272e3a] max-h-[13.5rem] overflow-y-auto overscroll-contain">
              {pendingDays.map((day) => {
                const isActive = day.date === reportKey;
                const done = Math.min(
                  100,
                  (day.loggedMinutes / day.targetMinutes) * 100,
                );
                return (
                  <li
                    key={day.date}
                    className={cn(
                      "flex items-center gap-4 px-5 py-3 transition-colors",
                      isActive ? "bg-indigo-950/40" : "hover:bg-[#1e242e]",
                    )}
                  >
                    <div className="w-20 shrink-0">
                      <div className="text-[15px] text-[#e6e4e0] tabular-nums">
                        {day.label}
                      </div>
                      <div className="text-[13px] text-[#5b6473]">
                        {day.weekday}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3 mb-1.5">
                        <span className="text-sm text-[#8b93a3] tabular-nums">
                          {formatMinutes(day.loggedMinutes)} of{" "}
                          {formatMinutes(day.targetMinutes)} logged
                        </span>
                        <span className="text-[15px] text-amber-300 tabular-nums shrink-0">
                          {formatMinutes(day.pendingMinutes)} left
                        </span>
                      </div>
                      <div className="h-1 rounded-full bg-[#0e1014] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500/80 transition-[width] duration-300"
                          style={{ width: `${done}%` }}
                        />
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handlePrefill(day)}
                      className={cn(
                        "h-7 shrink-0 rounded-md text-sm font-medium border",
                        focusRing,
                        isActive
                          ? "bg-indigo-600 hover:bg-indigo-500 border-transparent text-white"
                          : "bg-transparent border-[#2d3542] text-[#8b93a3] hover:text-[#e6e4e0] hover:border-[#3c4657]",
                      )}
                    >
                      Prefill
                    </Button>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.3fr)_minmax(0,1fr)] gap-4">
        {/* PROJECTS */}
        <Card className={cardClass}>
          <div
            className={cn(
              "px-5 py-3.5 border-b flex items-center justify-between shrink-0",
              LINE,
            )}
          >
            <span className={eyebrow}>Projects</span>
            <span className="flex items-center gap-2.5">
              <span className="text-[13px] text-[#5b6473] tabular-nums">
                {metadata?.totalCount ?? 0}
              </span>
              <span className={cn("h-3.5 w-px border-l", LINE)} aria-hidden />
              <button
                type="button"
                onClick={handleLogout}
                title="Sign out of Resource Management"
                aria-label="Sign out of Resource Management"
                className={cn(
                  "flex items-center gap-1.5 rounded px-1.5 py-1 text-[11px] uppercase tracking-wide",
                  "text-[#7b8494] hover:text-amber-300 transition-colors",
                  focusRing,
                )}
              >
                <LogOut size={13} />
                Sign out
              </button>
            </span>
          </div>

          <div className={cn("px-3 py-2.5 border-b shrink-0", LINE)}>
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5b6473]"
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search projects"
                aria-label="Search projects"
                className={cn(fieldClass, "pl-9")}
              />
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden">
            <ScrollArea className={cn("h-full w-full", scrollFix)}>
              {loading ? (
                <div className="h-40 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 text-[#5b6473] animate-spin" />
                </div>
              ) : projects.length ? (
                <ul className="divide-y divide-[#1e242e]">
                  {projects.map((project) => {
                    const isActive = project.id === selectedProjectId;
                    return (
                      <li key={project.id}>
                        <button
                          onClick={() => setSelectedProjectId(project.id)}
                          aria-current={isActive ? "true" : undefined}
                          className={cn(
                            "w-full text-left pl-4 pr-3 py-3 flex items-center gap-3 border-l-2 transition-colors",
                            focusRing,
                            isActive
                              ? "border-l-indigo-500 bg-indigo-950/40"
                              : "border-l-transparent hover:bg-[#1e242e]",
                          )}
                        >
                          <span className="min-w-0 flex-1">
                            <span
                              className={cn(
                                "block text-[15px] truncate",
                                isActive
                                  ? "text-[#e6e4e0] font-medium"
                                  : "text-[#c3c7cf]",
                              )}
                            >
                              {project.name}
                            </span>
                            <span className="block text-[13px] text-[#5b6473] truncate">
                              {project.client?.name || "No client"}
                            </span>
                          </span>
                          <span className="text-[13px] text-[#5b6473] tabular-nums shrink-0">
                            {project.percentageComplete ?? 0}%
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="px-6 py-12 text-center">
                  <p className="text-[15px] text-[#8b93a3]">
                    No projects match that search.
                  </p>
                </div>
              )}
            </ScrollArea>
          </div>

          <div
            className={cn(
              "px-3 py-2.5 border-t flex items-center justify-between shrink-0",
              LINE,
            )}
          >
            <Button
              variant="ghost"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className={cn(
                "h-7 rounded-md text-sm text-[#8b93a3] hover:text-[#e6e4e0] disabled:opacity-30",
                focusRing,
              )}
            >
              <ChevronLeft size={14} /> Prev
            </Button>
            <span className="text-[13px] text-[#5b6473] tabular-nums">
              {metadata?.page ?? page} / {metadata?.totalPages ?? 1}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={loading || page >= (metadata?.totalPages ?? 1)}
              onClick={() => setPage((p) => p + 1)}
              className={cn(
                "h-7 rounded-md text-sm text-[#8b93a3] hover:text-[#e6e4e0] disabled:opacity-30",
                focusRing,
              )}
            >
              Next <ChevronRight size={14} />
            </Button>
          </div>
        </Card>

        {/* MILESTONES */}
        <Card className={cardClass}>
          <div
            className={cn(
              "px-5 py-3.5 border-b flex items-center justify-between gap-3 shrink-0",
              LINE,
            )}
          >
            <span className={eyebrow}>Milestones</span>
            <span className="text-[13px] text-[#8b93a3] truncate">
              {selectedProject?.name || "—"}
            </span>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden">
            <ScrollArea className={cn("h-full w-full", scrollFix)}>
              {!selectedProject ? (
                <div className="px-6 py-12 text-center">
                  <p className="text-[15px] text-[#8b93a3]">
                    Choose a project to see its milestones.
                  </p>
                </div>
              ) : milestonesLoading ? (
                <div className="h-40 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 text-[#5b6473] animate-spin" />
                </div>
              ) : milestones.length ? (
                <ul className="divide-y divide-[#1e242e]">
                  {milestones.map((milestone, idx) => {
                    const isSelected = milestone.id === selectedMilestoneId;
                    const isExpanded = milestone.id === expandedMilestoneId;
                    const tasks = milestone.tasks || [];
                    const { pct, over } = meterFor(
                      milestone.actualTime,
                      milestone.estimatedTime,
                    );
                    return (
                      <li key={milestone.id}>
                        <button
                          onClick={() => {
                            setSelectedMilestoneId(milestone.id);
                            setSelectedTaskId(null);
                            setExpandedMilestoneId(
                              isExpanded ? null : milestone.id,
                            );
                          }}
                          aria-expanded={isExpanded}
                          className={cn(
                            "w-full text-left pl-4 pr-3 py-3 flex items-start gap-3 border-l-2 transition-colors",
                            focusRing,
                            isSelected
                              ? "border-l-indigo-500 bg-indigo-950/40"
                              : "border-l-transparent hover:bg-[#1e242e]",
                          )}
                        >
                          {/* orderNumber is a real sequence from the API, so it earns the gutter */}
                          <span
                            className={cn(
                              "mt-0.5 h-5 w-5 shrink-0 rounded flex items-center justify-center text-[13px] tabular-nums",
                              isSelected
                                ? "bg-indigo-600 text-white"
                                : "bg-[#1e242e] text-[#8b93a3]",
                            )}
                          >
                            {isSelected ? (
                              <Check size={12} />
                            ) : (
                              (milestone.orderNumber ?? idx + 1)
                            )}
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="flex items-baseline justify-between gap-3">
                              <span className="text-[15px] text-[#e6e4e0] truncate">
                                {milestone.name}
                              </span>
                              <span
                                className={cn(
                                  "text-[13px] tabular-nums shrink-0",
                                  over ? "text-amber-300" : "text-[#8b93a3]",
                                )}
                              >
                                {Number(milestone.actualTime ?? 0).toFixed(0)}h
                                {" / "}
                                {Number(milestone.estimatedTime ?? 0).toFixed(
                                  0,
                                )}
                                h
                              </span>
                            </span>

                            <span className="mt-2 block h-1 rounded-full bg-[#0e1014] overflow-hidden">
                              <span
                                className={cn(
                                  "block h-full rounded-full transition-[width] duration-300",
                                  over ? "bg-amber-400" : "bg-indigo-500",
                                )}
                                style={{ width: `${pct}%` }}
                              />
                            </span>

                            <span className="mt-1.5 flex items-center gap-2 text-[13px] text-[#5b6473]">
                              <span className="capitalize">
                                {(milestone.status || "").replace(/_/g, " ")}
                              </span>
                              {tasks.length > 0 && (
                                <>
                                  <span aria-hidden>·</span>
                                  <span className="tabular-nums">
                                    {tasks.length} task
                                    {tasks.length === 1 ? "" : "s"}
                                  </span>
                                </>
                              )}
                            </span>
                          </span>

                          {tasks.length > 0 && (
                            <ChevronDown
                              size={14}
                              className={cn(
                                "mt-1 shrink-0 text-[#5b6473] transition-transform",
                                isExpanded && "rotate-180",
                              )}
                            />
                          )}
                        </button>

                        {isExpanded && tasks.length > 0 && (
                          <ul className={cn(INK, "border-t", LINE)}>
                            {tasks.map((task) => {
                              const taskSelected = task.id === selectedTaskId;
                              return (
                                <li key={task.id}>
                                  <button
                                    onClick={() => {
                                      setSelectedMilestoneId(milestone.id);
                                      setSelectedTaskId(
                                        taskSelected ? null : task.id,
                                      );
                                    }}
                                    title={task.taskName}
                                    aria-pressed={taskSelected}
                                    className={cn(
                                      "w-full text-left pl-11 pr-3 py-2 flex items-center gap-3 border-l-2 transition-colors",
                                      focusRing,
                                      taskSelected
                                        ? "border-l-indigo-500 bg-indigo-950/50"
                                        : "border-l-transparent hover:bg-[#1e242e]",
                                    )}
                                  >
                                    <span
                                      className={cn(
                                        "h-1.5 w-1.5 rounded-full shrink-0",
                                        taskSelected
                                          ? "bg-indigo-400"
                                          : "bg-[#3c4657]",
                                      )}
                                    />
                                    <span
                                      className={cn(
                                        "min-w-0 flex-1 truncate text-sm",
                                        taskSelected
                                          ? "text-[#e6e4e0]"
                                          : "text-[#a8aeba]",
                                      )}
                                    >
                                      {task.taskName}
                                    </span>
                                    <span className="text-[13px] text-[#5b6473] tabular-nums shrink-0">
                                      {Number(
                                        task.actualLoggedHours ?? 0,
                                      ).toFixed(0)}
                                      h
                                    </span>
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="px-6 py-12 text-center">
                  <p className="text-[15px] text-[#8b93a3]">
                    This project has no milestones yet.
                  </p>
                  <p className="text-sm text-[#5b6473] mt-1">
                    You can still log time against the project itself.
                  </p>
                </div>
              )}
            </ScrollArea>
          </div>
        </Card>

        {/* COMPOSER */}
        <Card className={cardClass}>
          <div
            className={cn(
              "px-5 py-3.5 border-b flex items-center justify-between shrink-0",
              LINE,
            )}
          >
            <span className={eyebrow}>Daily report</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyReport}
              disabled={!reportText}
              className={cn(
                "h-7 rounded-md text-sm text-[#8b93a3] hover:text-[#e6e4e0] disabled:opacity-30",
                focusRing,
              )}
            >
              <ClipboardCopy size={13} />
              Copy
            </Button>
          </div>

          <div className="p-4 space-y-3 flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className={cn("rounded-md border px-3 py-2.5", LINE, INK)}>
              <p className={eyebrow}>Logging against</p>
              <p className="text-[15px] text-[#e6e4e0] truncate mt-1">
                {selectedProject?.name || "No project selected"}
              </p>
              {(selectedMilestone || selectedTask) && (
                <p
                  className="text-[13px] text-[#8b93a3] truncate mt-0.5"
                  title={[selectedMilestone?.name, selectedTask?.taskName]
                    .filter(Boolean)
                    .join(" › ")}
                >
                  {[selectedMilestone?.name, selectedTask?.taskName]
                    .filter(Boolean)
                    .join(" › ")}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label
                  htmlFor="report-date"
                  className="text-sm font-medium text-[#8b93a3]"
                >
                  Date
                </Label>
                <Input
                  id="report-date"
                  type="date"
                  value={reportKey}
                  onChange={(e) => {
                    if (!e.target.value) return;
                    const [y, m, d] = e.target.value.split("-").map(Number);
                    setReportDate(new Date(y, m - 1, d));
                  }}
                  className={cn(fieldClass, "tabular-nums [color-scheme:dark]")}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-[#8b93a3]">
                  Time spent
                </Label>
                <div className="flex items-center gap-1.5">
                  <div className="relative flex-1 min-w-0">
                    <Input
                      type="number"
                      min={0}
                      max={23}
                      value={spentHours}
                      onChange={(e) => setSpentHours(e.target.value)}
                      placeholder="0"
                      aria-label="Hours spent"
                      className={cn(fieldClass, "pr-6 tabular-nums")}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[13px] text-[#5b6473] pointer-events-none">
                      h
                    </span>
                  </div>
                  <div className="relative flex-1 min-w-0">
                    <Input
                      type="number"
                      min={0}
                      max={59}
                      step={5}
                      value={spentMinutes}
                      onChange={(e) => setSpentMinutes(e.target.value)}
                      placeholder="00"
                      aria-label="Minutes spent"
                      className={cn(fieldClass, "pr-7 tabular-nums")}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[13px] text-[#5b6473] pointer-events-none">
                      m
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="report-notes"
                className="text-sm font-medium text-[#8b93a3]"
              >
                What did you do
              </Label>
              <textarea
                id="report-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Progress, completed tasks, blockers…"
                rows={3}
                className="w-full bg-[#0e1014] border border-[#2d3542] text-[#e6e4e0] rounded-md p-2.5 text-[15px] resize-none focus:outline-none focus:border-indigo-500 placeholder:text-[#4c5462]"
              />
            </div>

            <Button
              onClick={handleAddEntry}
              disabled={submitting}
              className={cn(
                "w-full h-9 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-[15px] font-medium shrink-0",
                "disabled:opacity-60 disabled:cursor-not-allowed",
                focusRing,
              )}
            >
              {submitting ? "Filing to RMS…" : "Add entry"}
            </Button>

            <div className="flex-1 min-h-0 flex flex-col pt-1">
              <div className="flex items-baseline justify-between mb-2 shrink-0">
                <span className={eyebrow}>Entries</span>
                <span className="text-[13px] text-[#5b6473] tabular-nums">
                  {visibleEntries.length}
                </span>
              </div>

              <ScrollArea className={cn("flex-1 w-full", scrollFix)}>
                {visibleEntries.length ? (
                  <ul className="divide-y divide-[#1e242e] pr-2">
                    {visibleEntries.map((entry) => (
                      <li
                        key={entry.id}
                        className="py-2.5 flex items-start gap-3 group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="text-[13px] text-[#5b6473] truncate">
                              {entry.projectName}
                              {entry.milestoneName &&
                                ` · ${entry.milestoneName}`}
                            </span>
                            {entry.timeSpent && (
                              <span className="text-[13px] text-emerald-400/90 tabular-nums shrink-0">
                                {entry.timeSpent}
                              </span>
                            )}
                          </div>
                          <p className="text-[15px] text-[#c3c7cf] mt-0.5 break-words">
                            {entry.notes}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveEntry(entry.id)}
                          aria-label="Remove entry"
                          className={cn(
                            "mt-0.5 shrink-0 rounded p-1 text-[#3c4657] hover:text-amber-300 transition-colors",
                            focusRing,
                          )}
                        >
                          <Trash2 size={13} />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="py-10 text-center">
                    <p className="text-[15px] text-[#8b93a3]">
                      Nothing logged for this day.
                    </p>
                    <p className="text-sm text-[#5b6473] mt-1">
                      Pick a task, then add your first entry.
                    </p>
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
