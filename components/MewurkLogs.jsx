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
  Briefcase,
  FileText,
  CalendarCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function MewurkLogs() {
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

      toast({ title: "Success", description: "Logged in to Mewurk successfully." });
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
      return new Date(Date.UTC(+year, +month - 1, +day, +hour, +minute, +second));
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
          const sessionDuration = differenceInMilliseconds(nextDate, currentDate);
          if (!targetMet && accumulatedWorkMs + sessionDuration >= shiftTotalMs) {
            const remainingToTarget = shiftTotalMs - accumulatedWorkMs;
            actualCompletionTime = new Date(currentDate.getTime() + remainingToTarget);
            targetMet = true;
          }
          accumulatedWorkMs += sessionDuration;
        } else if (!next && isSameDay(currentDate, currentTime)) {
          const sessionDuration = Math.max(0, differenceInMilliseconds(currentTime, currentDate));
          if (!targetMet && accumulatedWorkMs + sessionDuration >= shiftTotalMs) {
            const remainingToTarget = shiftTotalMs - accumulatedWorkMs;
            actualCompletionTime = new Date(currentDate.getTime() + remainingToTarget);
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
    const effectiveCompletionTime = actualCompletionTime || new Date(currentTime.getTime() + remainingMs);

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
      targetMinutes: Math.floor((shiftTotalMs % (1000 * 60 * 60)) / (1000 * 60)),
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
      <div className="flex items-center justify-center p-4">
        <Card className="w-full max-w-sm bg-gray-900/40 backdrop-blur-xl border-white/10 shadow-2xl rounded-3xl overflow-hidden mt-10">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto bg-orange-500/10 w-16 h-16 rounded-3xl flex items-center justify-center mb-4 border border-orange-500/20">
              <Building className="h-8 w-8 text-orange-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-white tracking-tight">Mewurk Connect</CardTitle>
            <CardDescription className="text-gray-400">Login with your corporate credentials</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin} className="p-6 pt-0 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-400 ml-1">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoggingIn}
                className="bg-white/5 border-white/10 text-white rounded-2xl h-12 focus:border-orange-500/50"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" stroke="gray-400" className="text-gray-400 ml-1">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoggingIn}
                  className="bg-white/5 border-white/10 text-white rounded-2xl h-12 pr-12 focus:border-orange-500/50"
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
              className="w-full h-12 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-lg shadow-orange-500/20"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? <Loader2 className="animate-spin" /> : "Login to Mewurk"}
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800/20 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden shadow-xl">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-2xl bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
                <span className="font-bold text-orange-400 uppercase">{userName?.charAt(0)}</span>
             </div>
             <div>
                <h3 className="text-white font-bold text-lg">{userName}</h3>
                <div className="flex items-center gap-1.5 opacity-60">
                   <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                   <span className="text-[10px] uppercase font-bold text-white">Mewurk Connected</span>
                </div>
             </div>
          </div>
          <div className="flex items-center gap-2">
             <Input 
               type="date" 
               className="bg-white/5 border-white/10 text-white rounded-xl h-9 text-xs"
               value={format(date, "yyyy-MM-dd")}
               onChange={(e) => setDate(new Date(e.target.value))}
             />
             <Button variant="outline" size="icon" onClick={handleLogout} className="bg-white/5 border-white/10 text-white rounded-xl hover:bg-red-500/20 hover:border-red-500/50">
               <LogOut size={16} />
             </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="h-[400px] flex items-center justify-center">
           <Loader2 className="h-10 w-10 text-orange-500 animate-spin" />
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                 {[
                   { label: "Present", val: monthStats?.present.totalPresent, icon: CalendarCheck, color: "text-emerald-400" },
                   { label: "Avg Hrs", val: monthStats?.workingHours.dayAvg.toFixed(1), icon: Clock, color: "text-blue-400" },
                   { label: "Late In", val: monthStats?.gracePeriod.lateIn, icon: AlertTriangle, color: "text-orange-400" },
                   { label: "Holiday", val: monthStats?.offDays.totalHoliday, icon: Coffee, color: "text-indigo-400" }
                 ].map((s, i) => (
                   <Card key={i} className="bg-white/5 border-white/5 rounded-2xl overflow-hidden">
                      <CardHeader className="p-3 pb-0">
                         <CardTitle className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1.5">
                            <s.icon size={12} className={s.color} /> {s.label}
                         </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3">
                         <div className="text-xl font-bold text-white">{s.val ?? "--"}</div>
                      </CardContent>
                   </Card>
                 ))}
              </div>

              <Card className="bg-gray-800/30 backdrop-blur-xl border-white/10 rounded-3xl overflow-hidden shadow-2xl relative">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                     <Timer size={160} />
                  </div>
                  <CardHeader className="pb-2">
                     <CardTitle className="text-[10px] uppercase font-bold text-gray-500 tracking-widest flex items-center gap-2">
                        <Timer size={14} className="text-orange-500" />
                        {stats.remainingMs > 0 ? "Remaining Today" : "Overtime Acquired"}
                     </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                     <div className="text-center py-6">
                        <div className={cn(
                          "text-6xl font-black font-mono tracking-tighter tabular-nums drop-shadow-lg",
                          stats.remainingMs <= 0 ? "text-orange-500" : "text-white"
                        )}>
                           {formatHms(Math.abs(stats.remainingMs))}
                        </div>
                        <div className="flex items-center justify-center gap-2 mt-4">
                           <div className="bg-white/5 border border-white/5 px-4 py-1 rounded-full">
                              <span className="text-[10px] uppercase font-bold text-gray-500 mr-2">Time Spent</span>
                              <span className="font-mono font-bold text-white text-lg">{formatHms(stats.totalWorkMs)}</span>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-2">
                        <div className="flex justify-between items-end">
                           <span className="text-[10px] uppercase font-bold text-gray-500">Goal Progress</span>
                           <span className="text-xs font-bold text-orange-400">{Math.round(stats.progress)}%</span>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                           <div 
                             className="h-full bg-orange-500 rounded-full transition-all duration-1000" 
                             style={{ width: `${stats.progress}%` }}
                           />
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                         <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                            <div className="text-[10px] uppercase font-bold text-gray-500 mb-1">Completion At</div>
                            <div className="flex items-center gap-2 text-white">
                               <Flag size={16} className="text-orange-500/50" />
                               <span className="text-2xl font-black font-mono">{format(stats.estimatedEndTime, "hh:mm a")}</span>
                            </div>
                         </div>
                         <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                            <div className="text-[10px] uppercase font-bold text-gray-500 mb-1">Work Goal</div>
                            <div className="flex items-center gap-2 text-white">
                               <Target size={16} className="text-orange-500/50" />
                               <span className="text-2xl font-black font-mono">{stats.targetHours}h {stats.targetMinutes}m</span>
                            </div>
                         </div>
                     </div>
                  </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-6">
                 <Card className="bg-white/5 border-white/5 rounded-2xl">
                    <CardHeader className="p-4 pb-0">
                       <CardTitle className="text-[10px] uppercase font-bold text-gray-500">First Punch</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                       <div className="text-3xl font-black font-mono text-white">
                          {stats.firstPunchTime ? format(stats.firstPunchTime, "hh:mm a") : "--:--"}
                       </div>
                    </CardContent>
                 </Card>
                 <Card className="bg-white/5 border-white/5 rounded-2xl">
                    <CardHeader className="p-4 pb-0">
                       <CardTitle className="text-[10px] uppercase font-bold text-gray-500">Break Tracker</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-2 flex items-center justify-between">
                       <div className="text-3xl font-black font-mono text-white">
                          {formatHms(stats.totalBreakMs)}
                       </div>
                       <div className="px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded-md text-[10px] font-bold border border-orange-500/30">
                          {stats.breakCount} Breaks
                       </div>
                    </CardContent>
                 </Card>
              </div>
           </div>

           <Card className="bg-gray-800/10 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[600px]">
              <CardHeader className="p-4 border-b border-white/5 bg-white/5">
                 <CardTitle className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <ListTodo size={14} className="text-orange-500" /> Attendance Logs
                 </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-hidden">
                 <ScrollArea className="h-full">
                    {data.clockInDetails.length > 0 ? (
                      <div className="divide-y divide-white/5">
                         {data.clockInDetails.map((log, i) => (
                           <div key={i} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors group">
                              <div className="flex items-center gap-4">
                                 <div className={cn(
                                   "h-10 w-10 rounded-2xl flex items-center justify-center border shadow-lg",
                                   log.inOutType === "IN" ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "bg-orange-500/20 border-orange-500/30 text-orange-400"
                                 )}>
                                    {log.inOutType === "IN" ? <LogIn size={18} /> : <LogOut size={18} />}
                                 </div>
                                 <div>
                                    <div className={cn(
                                      "font-bold text-sm uppercase tracking-wide",
                                      log.inOutType === "IN" ? "text-emerald-400" : "text-orange-400"
                                    )}>{log.inOutType === "IN" ? "Punched In" : "Punched Out"}</div>
                                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold uppercase mt-1">
                                       <MapPin size={10} /> {log.officeName || "Remote"}
                                    </div>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <div className="text-white font-mono font-bold text-lg">{format(parseUtc(log.clockTime), "hh:mm")}</div>
                                 <div className="text-[10px] text-gray-500 font-bold uppercase">{format(parseUtc(log.clockTime), "a")}</div>
                              </div>
                           </div>
                         ))}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-4 opacity-20">
                         <Ghost size={64} />
                         <p className="text-white font-bold uppercase tracking-widest text-xs">No entries found</p>
                      </div>
                    )}
                 </ScrollArea>
              </CardContent>
           </Card>
        </div>
      ) : (
        <div className="h-[400px] flex flex-col items-center justify-center space-y-4 opacity-30">
           <Calendar size={80} className="text-white" />
           <p className="text-white font-bold uppercase tracking-widest text-sm">Select a date to begin tracking</p>
        </div>
      )}
    </div>
  );
}
