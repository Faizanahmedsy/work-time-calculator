"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { format, isSameDay, isValid, differenceInMilliseconds } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  loginAction,
  logoutAction,
  getAttendanceLogsAction,
  getCardDetailsAction,
  refreshSessionAction,
  getInitialAuthStateAction,
} from "@/app/actions";
import {
  Building,
  Eye,
  EyeOff,
  LogIn,
  LogOut,
  Calendar,
  Clock,
  AlertTriangle,
  Coffee,
  Timer,
  Flag,
  Target,
  ListTodo,
  MapPin,
  Ghost,
  Loader2,
  CalendarCheck,
  CheckCircle2,
  RefreshCw,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function TimeWise() {
  const { toast } = useToast();

  // Auth State
  const [token, setToken] = useState(null);
  const [employeeCode, setEmployeeCode] = useState(null);
  const [userName, setUserName] = useState(null);

  // Login Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Data State
  const [date, setDate] = useState(new Date());
  const [data, setData] = useState(null);
  const [monthStats, setMonthStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Time State (for live updates)
  const [currentTime, setCurrentTime] = useState(new Date());

  // Load auth from cookies on mount
  useEffect(() => {
    const initAuth = async () => {
      const state = await getInitialAuthStateAction();
      if (state.token && state.employeeCode) {
        setToken(state.token);
        setEmployeeCode(state.employeeCode);
        setUserName(state.userName);
      }
    };
    initAuth();

    // Timer for live calculation
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const res = await refreshSessionAction();
      if (res.isSuccess && res.token) {
        setToken(res.token);
        return true;
      }
    } catch (e) {
      console.error("Auto-login failed:", e);
    }
    return false;
  }, []);

  const handleLogout = useCallback(async () => {
    await logoutAction();
    setToken(null);
    setEmployeeCode(null);
    setUserName(null);
    setData(null);
    setMonthStats(null);
  }, []);

  const fetchLogs = useCallback(async () => {
    if (!token || !employeeCode) return;

    setLoading(true);
    setError(null);

    try {
      const formattedDate = format(date, "yyyy-MM-dd");
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      const [logsRes, statsRes] = await Promise.all([
        getAttendanceLogsAction(formattedDate),
        getCardDetailsAction(year, month),
      ]);

      if (logsRes.isSuccess) {
        setData(logsRes.data);
      } else {
        if (logsRes.statusCode === 401) {
          const refreshed = await refreshSession();
          if (refreshed) return;

          handleLogout();
          toast({
            title: "Session Expired",
            description: "Please login again.",
            variant: "destructive",
          });
          return;
        }
        setError(logsRes.message || "Failed to fetch logs");
      }

      if (statsRes.isSuccess) {
        setMonthStats(statsRes.data.cardDetails);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      const message = err instanceof Error ? err.message : "";
      if (message.includes("401")) {
        handleLogout();
      } else {
        setError(message || "An error occurred");
      }
    } finally {
      setLoading(false);
    }
  }, [date, token, employeeCode, refreshSession, handleLogout, toast]);

  useEffect(() => {
    if (token && employeeCode) {
      fetchLogs();
    }
  }, [date, token, employeeCode, fetchLogs]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }

    setIsLoggingIn(true);
    setError(null);

    try {
      const loginRes = await loginAction(email, password);
      if (!loginRes.isSuccess || !loginRes.data) {
        throw new Error(loginRes.message || "Login failed.");
      }

      setToken(loginRes.data.token);
      setEmployeeCode(loginRes.data.employeeCode);
      setUserName(loginRes.data.userName);
      setEmail("");
      setPassword("");

      toast({
        title: "Success",
        description: "Logged in to Mewurk successfully.",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const parseUtc = (dateStr) => {
    if (!dateStr) return new Date();
    if (dateStr.includes("T") && !dateStr.toLowerCase().includes("z")) {
      return new Date(dateStr + "Z");
    }
    if (dateStr.match(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/)) {
      const [datePart, timePart] = dateStr.split(" ");
      const [month, day, year] = datePart.split("/");
      const [hour, minute, second] = timePart.split(":");
      return new Date(
        Date.UTC(+year, +month - 1, +day, +hour, +minute, +second),
      );
    }
    return new Date(dateStr);
  };

  const stats = useMemo(() => {
    if (!data || !data.clockInDetails.length) return null;

    const logs = [...data.clockInDetails].sort((a, b) => {
      return new Date(a.clockTime).getTime() - new Date(b.clockTime).getTime();
    });

    const firstPunch = logs.find((l) => l.inOutType === "IN");
    const lastPunch = logs[logs.length - 1];

    let actualCompletionTime = null;
    let accumulatedWorkMs = 0;
    let targetMet = false;
    let totalBreakMs = 0;
    let breakCount = 0;

    let shiftTotalMs = 29700000; // Default 8h 15m
    let usedShiftTimes = false;

    if (data.shiftStartTime && data.shiftEndTime) {
      try {
        const shiftStart = parseUtc(data.shiftStartTime);
        const shiftEnd = parseUtc(data.shiftEndTime);
        if (isValid(shiftStart) && isValid(shiftEnd)) {
          const diff = differenceInMilliseconds(shiftEnd, shiftStart);
          if (diff > 0) {
            shiftTotalMs = diff;
            usedShiftTimes = true;
          }
        }
      } catch (e) {}
    }

    for (let i = 0; i < logs.length; i++) {
      const current = logs[i];
      const next = logs[i + 1];
      const currentDate = parseUtc(current.clockTime);

      if (current.inOutType === "IN") {
        if (next && next.inOutType === "OUT") {
          const nextDate = parseUtc(next.clockTime);
          const sessionDuration = differenceInMilliseconds(
            nextDate,
            currentDate,
          );
          if (
            !targetMet &&
            accumulatedWorkMs + sessionDuration >= shiftTotalMs
          ) {
            const remainingToTarget = shiftTotalMs - accumulatedWorkMs;
            actualCompletionTime = new Date(
              currentDate.getTime() + remainingToTarget,
            );
            targetMet = true;
          }
          accumulatedWorkMs += sessionDuration;
        } else if (!next && isSameDay(currentDate, currentTime)) {
          const sessionDuration = Math.max(
            0,
            differenceInMilliseconds(currentTime, currentDate),
          );
          if (
            !targetMet &&
            accumulatedWorkMs + sessionDuration >= shiftTotalMs
          ) {
            const remainingToTarget = shiftTotalMs - accumulatedWorkMs;
            actualCompletionTime = new Date(
              currentDate.getTime() + remainingToTarget,
            );
            targetMet = true;
          }
          accumulatedWorkMs += sessionDuration;
        }
      } else if (current.inOutType === "OUT") {
        if (next && next.inOutType === "IN") {
          const nextDate = parseUtc(next.clockTime);
          breakCount++;
          totalBreakMs += differenceInMilliseconds(nextDate, currentDate);
        }
      }
    }

    const remainingMs = shiftTotalMs - accumulatedWorkMs;
    const progress = Math.min(100, (accumulatedWorkMs / shiftTotalMs) * 100);
    const effectiveCompletionTime =
      actualCompletionTime || new Date(currentTime.getTime() + remainingMs);

    return {
      firstPunchTime: firstPunch ? parseUtc(firstPunch.clockTime) : null,
      lastActivityTime: lastPunch ? parseUtc(lastPunch.clockTime) : null,
      isWorking: lastPunch?.inOutType === "IN",
      totalWorkMs: accumulatedWorkMs,
      totalBreakMs,
      breakCount,
      remainingMs,
      progress,
      shiftTotalMs,
      estimatedEndTime: effectiveCompletionTime,
      targetHours: Math.floor(shiftTotalMs / (1000 * 60 * 60)),
      targetMinutes: Math.floor(
        (shiftTotalMs % (1000 * 60 * 60)) / (1000 * 60),
      ),
      isDefaultAndMissing: !usedShiftTimes,
    };
  }, [data, currentTime]);

  const formatHms = (ms) => {
    const totalSeconds = Math.floor(Math.max(0, ms) / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] p-4">
        <Card className="w-full max-w-sm bg-gray-900/40 backdrop-blur-xl border-white/10 shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="text-center pb-2 pt-8">
            <div className="mx-auto bg-orange-500/10 w-20 h-20 rounded-[2rem] flex items-center justify-center mb-6 border border-orange-500/20 shadow-inner">
              <Building className="h-10 w-10 text-orange-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-white tracking-tight">
              Mewurk Connect
            </CardTitle>
            <CardDescription className="text-gray-400">
              Secure corporate login required
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin} className="p-8 space-y-5">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                stroke="gray-400"
                className="text-gray-400 ml-1 font-bold text-[10px] uppercase tracking-widest"
              >
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoggingIn}
                className="bg-white/5 border-white/10 text-white rounded-2xl h-14 focus:border-orange-500/50"
                required
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="password"
                stroke="gray-400"
                className="text-gray-400 ml-1 font-bold text-[10px] uppercase tracking-widest"
              >
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoggingIn}
                  className="bg-white/5 border-white/10 text-white rounded-2xl h-14 pr-12 focus:border-orange-500/50"
                  required
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-14 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-lg shadow-orange-500/20"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Sign In to Mewurk"
              )}
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto py-6">
      {/* HEADER SECTION */}
      <div className="flex items-center gap-4 justify-between">
        {/* Profile Widget */}
        <div className="flex items-center gap-3 bg-gray-800/40 p-1.5 pr-4 rounded-2xl border border-white/5">
          <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30 font-bold text-blue-400 uppercase">
            {userName?.charAt(0)}
          </div>
          <div>
            <h4 className="text-white text-sm font-bold leading-none mb-1">
              {userName}
            </h4>
            <div className="flex items-center gap-1.5 leading-none">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">
                Connected
              </span>
            </div>
          </div>
        </div>

        {/* Actions Widget */}
        <div className="flex items-center gap-2 bg-gray-800/40 p-1.5 rounded-2xl border border-white/5">
          <div className="flex items-center gap-2 px-3 border-r border-white/10 text-gray-400">
            <Calendar size={16} />
            <span className="text-xs font-bold text-white">
              {format(date, "MMM dd, yyyy")}
            </span>
            <Input
              type="date"
              className="w-8 h-8 opacity-0 absolute cursor-pointer"
              value={format(date, "yyyy-MM-dd")}
              onChange={(e) => setDate(new Date(e.target.value))}
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-gray-500 hover:text-red-400 rounded-lg h-10 w-10"
          >
            <LogOut size={18} />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="h-[60vh] flex flex-col items-center justify-center gap-4 opacity-50">
          <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
          <p className="text-[10px] font-bold text-white uppercase tracking-[0.3em]">
            Synchronizing data...
          </p>
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* MAIN DASHBOARD (Left 2/3) */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="bg-gray-800/30 backdrop-blur-xl border-white/10 rounded-[2.5rem] p-10 shadow-2xl overflow-hidden relative border-t-white/10 flex flex-col items-center justify-center min-h-[500px]">
              <div className="absolute top-0 right-0 p-10 opacity-[0.03]">
                <Timer size={300} strokeWidth={1} />
              </div>

              <div className="text-center space-y-3 relative z-10 w-full">
                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-[0.4em]">
                  Time remaining today
                </span>
                <h2
                  className={cn(
                    "text-[9rem] font-black tracking-tighter tabular-nums leading-none",
                    stats.remainingMs <= 0 ? "text-orange-500" : "text-white",
                  )}
                >
                  {formatHms(Math.abs(stats.remainingMs))}
                </h2>

                {/* Summary 4-Box Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full pt-12">
                  {[
                    {
                      label: "Started",
                      val: stats.firstPunchTime
                        ? format(stats.firstPunchTime, "hh:mm a")
                        : "--:--",
                      icon: LogIn,
                      color: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
                    },
                    {
                      label: "Completes",
                      val: format(stats.estimatedEndTime, "hh:mm a"),
                      icon: Flag,
                      color:
                        "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
                    },
                    {
                      label: "Break",
                      val: formatHms(stats.totalBreakMs).replace("0h ", ""),
                      icon: Coffee,
                      color:
                        "bg-purple-500/10 border-purple-500/20 text-purple-400",
                    },
                    {
                      label: "Completed",
                      val: formatHms(stats.totalWorkMs),
                      icon: CheckCircle2,
                      color: "bg-pink-500/10 border-pink-500/20 text-pink-400",
                    },
                  ].map((box, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "p-4 rounded-2xl border flex flex-col items-start gap-2 shadow-sm",
                        box.color,
                      )}
                    >
                      <div className="flex items-center gap-2 opacity-70">
                        <box.icon size={12} />
                        <span className="text-[9px] uppercase font-bold tracking-widest">
                          {box.label}
                        </span>
                      </div>
                      <div className="text-xl font-black font-mono tracking-tight leading-none">
                        {box.val}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Progress Section */}
                <div className="w-full pt-16 space-y-4">
                  <div className="flex justify-between items-end">
                    <div className="text-left">
                      <span className="text-[10px] uppercase font-bold text-gray-600 tracking-widest block mb-1">
                        Current Progress
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-white">
                          {Math.round(stats.progress)}
                        </span>
                        <span className="text-lg font-bold text-blue-500/60">
                          %
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-gray-600 tracking-[0.2em]">
                        Status
                      </span>
                      <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 rounded-full flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <span className="text-[10px] font-black text-white uppercase">
                          In Session
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="h-4 w-full bg-white/5 rounded-full p-1 border border-white/5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 via-blue-400 to-cyan-400 rounded-full transition-all duration-1000 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                      style={{ width: `${stats.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Bottom Meta Boxes */}
            <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
              {[
                {
                  label: "Avg",
                  val: `${monthStats?.workingHours.dayAvg.toFixed(1)}h/d`,
                },
                {
                  label: "Daily Goal",
                  val: `${stats.targetHours}h ${stats.targetMinutes}m`,
                },
              ].map((m, i) => (
                <div
                  key={i}
                  className="bg-white/5 border border-white/5 p-4 rounded-2xl group hover:bg-white/[0.07] transition-all"
                >
                  <span className="text-sm uppercase font-bold text-gray-600 block mb-1 tracking-widest">
                    {m.label}
                  </span>
                  <span className="text-md font-bold text-gray-400 tracking-tight">
                    {m.val ?? "--"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* SIDEBAR (Activity History) */}
          <div className="space-y-6 flex flex-col">
            <Card className="bg-gray-800/10 backdrop-blur-xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col h-[750px]">
              <CardHeader className="p-7 border-b border-white/5 flex flex-row items-center justify-between">
                <CardTitle className="text-white text-sm font-bold uppercase tracking-widest flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <ListTodo size={18} className="text-blue-500" />
                  </div>
                  Activity history
                </CardTitle>
                <div className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-black text-gray-500 uppercase tracking-tighter border border-white/5">
                  {data.clockInDetails.length} Logged
                </div>
              </CardHeader>

              <CardContent className="p-0 flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  {data.clockInDetails.length > 0 ? (
                    <div className="relative p-10 pl-14">
                      {/* Vertical Timeline Line */}
                      <div className="absolute left-10 top-14 bottom-14 w-px bg-white/5" />

                      <div className="space-y-12">
                        {data.clockInDetails.map((log, i) => (
                          <div key={i} className="relative group">
                            {/* Timeline Marker */}
                            <div
                              className={cn(
                                "absolute -left-[45px] top-1.5 w-4 h-4 rounded-full border-2 bg-gray-900 z-10",
                                log.inOutType === "IN"
                                  ? "border-emerald-500"
                                  : "border-orange-500",
                              )}
                            />

                            <div className="flex items-center justify-between">
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                    {log.inOutType === "IN"
                                      ? "Clock In"
                                      : "Clock Out"}
                                  </span>
                                </div>
                                <div className="text-2xl font-black font-mono text-white tabular-nums tracking-tighter">
                                  {format(parseUtc(log.clockTime), "hh:mm a")}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-600 uppercase tracking-tighter">
                                  <MapPin size={10} className="text-gray-700" />
                                  {log.officeName || "Remote Office"}
                                </div>
                              </div>
                              <button className="h-9 w-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-gray-600 hover:text-blue-400 hover:border-blue-500/30 transition-all opacity-40 group-hover:opacity-100">
                                <RefreshCw size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-5 opacity-20">
                      <Ghost size={60} strokeWidth={1} />
                      <p className="text-white font-bold uppercase tracking-[0.3em] text-xs">
                        Awaiting data logs
                      </p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="h-[50vh] flex flex-col items-center justify-center gap-6 opacity-30">
          <Calendar size={100} strokeWidth={1} className="text-white" />
          <div className="text-center space-y-1">
            <p className="text-white font-black uppercase tracking-[0.4em] text-lg">
              No session selected
            </p>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest italic">
              Choose a date to view attendance metrics
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
