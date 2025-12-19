"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Calendar,
  Clock,
  Plus,
  Coffee,
  ListTodo,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  format,
  addMinutes,
  startOfDay,
  differenceInMinutes,
  parse,
} from "date-fns";

import { useCalendarStore } from "@/store/useCalendarStore";

import {
  DndContext,
  useDraggable,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from "@dnd-kit/modifiers";
import Background from "@/components/Background";
import Link from "next/link";

// Simple Time Picker Component
function TimePicker({ value, onChange }) {
  const [hours, minutes] = (value || "09:00").split(":");

  return (
    <div className="flex gap-2">
      <Input
        type="number"
        min="0"
        max="23"
        value={hours}
        onChange={(e) => {
          const h = Math.min(23, Math.max(0, parseInt(e.target.value) || 0));
          onChange(`${h.toString().padStart(2, "0")}:${minutes}`);
        }}
        className="w-20 bg-gray-800/50 border-gray-700 text-white"
        placeholder="HH"
      />
      <span className="text-gray-400 self-center">:</span>
      <Input
        type="number"
        min="0"
        max="59"
        value={minutes}
        onChange={(e) => {
          const m = Math.min(59, Math.max(0, parseInt(e.target.value) || 0));
          onChange(`${hours}:${m.toString().padStart(2, "0")}`);
        }}
        className="w-20 bg-gray-800/50 border-gray-700 text-white"
        placeholder="MM"
      />
    </div>
  );
}

export default function YourDayPage() {
  const {
    workStart,
    workEnd,
    events,
    setWorkStart,
    setWorkEnd,
    addEvent,
    updateEvent,
    removeEvent,
    reset,
  } = useCalendarStore();

  const [isMultiple, setIsMultiple] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const [draftEvents, setDraftEvents] = React.useState([
    { type: "task", startTime: "11:00", endTime: "12:00", title: "" },
  ]);

  const handleAddEvent = () => {
    const validDrafts = draftEvents.filter(
      (d) => d.title && d.startTime && d.endTime
    );
    if (validDrafts.length === 0) return;

    const colors = {
      task: "bg-cyan-900/30 text-cyan-200 border-cyan-700/50",
      break: "bg-emerald-900/30 text-emerald-200 border-emerald-700/50",
    };

    validDrafts.forEach((draft) => {
      const event = {
        id: Math.random().toString(36).substr(2, 9),
        title: draft.title,
        startTime: draft.startTime,
        endTime: draft.endTime,
        type: draft.type || "task",
        color: colors[draft.type || "task"],
      };
      addEvent(event);
    });

    if (isMultiple) {
      setDraftEvents([
        { type: "task", startTime: "11:00", endTime: "12:00", title: "" },
        { type: "task", startTime: "11:00", endTime: "12:00", title: "" },
        { type: "task", startTime: "11:00", endTime: "12:00", title: "" },
      ]);
    } else {
      setDraftEvents([
        { type: "task", startTime: "11:00", endTime: "12:00", title: "" },
      ]);
      setDialogOpen(false);
    }
  };

  const addMoreForm = () => {
    setDraftEvents([
      ...draftEvents,
      { type: "task", startTime: "11:00", endTime: "12:00", title: "" },
    ]);
  };

  const updateDraft = (index, updates) => {
    const newDrafts = [...draftEvents];
    newDrafts[index] = { ...newDrafts[index], ...updates };
    setDraftEvents(newDrafts);
  };

  const removeDraft = (index) => {
    if (draftEvents.length <= 1) return;
    setDraftEvents(draftEvents.filter((_, i) => i !== index));
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event) => {
    const { active, delta } = event;
    if (!active) return;

    const calendarEvent = events.find((e) => e.id === active.id);
    if (!calendarEvent) return;

    // Calculate minute delta (64px = 30 mins)
    const minuteDelta = Math.round(((delta.y / 64) * 30) / 5) * 5; // Snap to 5 mins

    if (minuteDelta === 0) return;

    const start = parse(calendarEvent.startTime, "HH:mm", new Date());
    const end = parse(calendarEvent.endTime, "HH:mm", new Date());

    const duration = differenceInMinutes(end, start);
    let newStart = addMinutes(start, minuteDelta);

    // Clamp to work day
    const dayStart = parse(workStart, "HH:mm", new Date());
    const dayEnd = parse(workEnd, "HH:mm", new Date());

    if (newStart < dayStart) newStart = dayStart;
    if (addMinutes(newStart, duration) > dayEnd) {
      newStart = addMinutes(dayEnd, -duration);
    }

    const newEnd = addMinutes(newStart, duration);

    updateEvent(calendarEvent.id, {
      startTime: format(newStart, "HH:mm"),
      endTime: format(newEnd, "HH:mm"),
    });
  };

  // Generate time slots (every 30 mins)
  const timeSlots = React.useMemo(() => {
    const slots = [];
    const start = parse(workStart, "HH:mm", new Date());
    const end = parse(workEnd, "HH:mm", new Date());

    let current = start;
    while (current <= end) {
      slots.push(format(current, "HH:mm"));
      current = addMinutes(current, 30);
    }
    return slots;
  }, [workStart, workEnd]);

  const calculatePosition = (startTime, endTime, allEvents, currentId) => {
    const start = parse(startTime, "HH:mm", new Date());
    let end = parse(endTime, "HH:mm", new Date());
    const workDayStart = parse(workStart, "HH:mm", new Date());

    // Handle cross-day or midnight (e.g. 11:30 PM to 12:00 AM)
    if (end <= start) {
      end = addMinutes(end, 24 * 60);
    }

    const top = differenceInMinutes(start, workDayStart) * (64 / 30);
    const height = Math.max(differenceInMinutes(end, start) * (64 / 30), 20); // Min height 20px

    // Overlap detection and cluster grouping
    const getCluster = (id) => {
      const cluster = new Set();
      const stack = [id];
      cluster.add(id);
      while (stack.length > 0) {
        const current = stack.pop();
        const currEv = allEvents.find((e) => e.id === current);
        const s1 = parse(currEv.startTime, "HH:mm", new Date());
        let e1 = parse(currEv.endTime, "HH:mm", new Date());
        if (e1 <= s1) e1 = addMinutes(e1, 24 * 60);

        allEvents.forEach((other) => {
          if (cluster.has(other.id)) return;
          const s2 = parse(other.startTime, "HH:mm", new Date());
          let e2 = parse(other.endTime, "HH:mm", new Date());
          if (e2 <= s2) e2 = addMinutes(e2, 24 * 60);

          if (startOfDay(s1).getTime() === startOfDay(s2).getTime()) {
            if (s1 < e2 && e1 > s2) {
              cluster.add(other.id);
              stack.push(other.id);
            }
          }
        });
      }
      return Array.from(cluster).map((cid) =>
        allEvents.find((e) => e.id === cid)
      );
    };

    const cluster = getCluster(currentId);

    let left = "4px";
    let width = "calc(100% - 8px)";

    if (cluster.length > 1) {
      const sortedCluster = cluster.sort((a, b) => {
        if (a.startTime !== b.startTime)
          return a.startTime.localeCompare(b.startTime);
        return a.id.localeCompare(b.id);
      });

      const columns = [];
      const eventToColumn = {};

      sortedCluster.forEach((ev) => {
        let assigned = false;
        const s1 = parse(ev.startTime, "HH:mm", new Date());
        let e1 = parse(ev.endTime, "HH:mm", new Date());
        if (e1 <= s1) e1 = addMinutes(e1, 24 * 60);

        for (let i = 0; i < columns.length; i++) {
          const hasOverlap = columns[i].some((id) => {
            const other = sortedCluster.find((o) => o.id === id);
            const s2 = parse(other.startTime, "HH:mm", new Date());
            let e2 = parse(other.endTime, "HH:mm", new Date());
            if (e2 <= s2) e2 = addMinutes(e2, 24 * 60);
            return s1 < e2 && e1 > s2;
          });
          if (!hasOverlap) {
            columns[i].push(ev.id);
            eventToColumn[ev.id] = i;
            assigned = true;
            break;
          }
        }
        if (!assigned) {
          eventToColumn[ev.id] = columns.length;
          columns.push([ev.id]);
        }
      });

      const total = columns.length;
      const colWidth = 100 / total;
      const myIndex = eventToColumn[currentId];

      left = `${myIndex * colWidth + 0.2}%`;
      width = `${colWidth - 0.4}%`;
    }

    return {
      top,
      height,
      left,
      width,
    };
  };

  const formatTime12h = (time24) => {
    const [h, m] = time24.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, "0")} ${period}`;
  };

  if (!mounted) return null;

  return (
    <Background>
      <div className="relative z-10 min-h-screen pt-20 pb-10 px-6">
        <div className="max-w-[1600px] mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white">Your Day</h1>
              <p className="text-gray-400 mt-2">
                Plan your work day with precision
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="bg-gray-800/50 border-gray-700 text-white hover:bg-gray-700"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Today
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-gray-800/50 border-gray-700 text-red-400 hover:bg-red-900/20"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-gray-800 border-gray-700 text-white">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-400">
                      This will clear all your calendar events and reset work
                      hours to default. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-gray-700 text-white border-gray-600">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={reset}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Reset Everything
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    className="bg-cyan-900 hover:bg-cyan-700 text-cyan-100 rounded-full shadow-lg"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Event
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[800px] max-h-[90vh] bg-gray-800/95 border-gray-700 text-white backdrop-blur-xl overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-2xl">
                      Add New Event
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Create one or more tasks or breaks in your schedule
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6 py-4">
                    {/* Single/Multiple Toggle */}
                    <div className="flex p-1 bg-gray-900/50 rounded-xl w-fit mx-auto">
                      <Button
                        variant={!isMultiple ? "default" : "ghost"}
                        size="sm"
                        className={cn(
                          "px-8 rounded-lg",
                          !isMultiple &&
                            "bg-cyan-900 text-cyan-100 hover:bg-cyan-800"
                        )}
                        onClick={() => {
                          setIsMultiple(false);
                          if (draftEvents.length > 1)
                            setDraftEvents([draftEvents[0]]);
                        }}
                      >
                        Single Entry
                      </Button>
                      <Button
                        variant={isMultiple ? "default" : "ghost"}
                        size="sm"
                        className={cn(
                          "px-8 rounded-lg",
                          isMultiple &&
                            "bg-cyan-900 text-cyan-100 hover:bg-cyan-800"
                        )}
                        onClick={() => {
                          setIsMultiple(true);
                          if (draftEvents.length < 3) {
                            const newDrafts = [...draftEvents];
                            while (newDrafts.length < 3) {
                              newDrafts.push({
                                type: "task",
                                startTime: "11:00",
                                endTime: "12:00",
                                title: "",
                              });
                            }
                            setDraftEvents(newDrafts);
                          }
                        }}
                      >
                        Multiple Entry
                      </Button>
                    </div>

                    {/* Event Forms */}
                    <div
                      className={cn(
                        "grid gap-4",
                        isMultiple
                          ? "grid-cols-1 md:grid-cols-2"
                          : "grid-cols-1 max-w-xl mx-auto"
                      )}
                    >
                      {draftEvents.map((draft, index) => (
                        <div
                          key={index}
                          className="relative space-y-4 p-6 rounded-2xl bg-gray-900/50 border border-gray-700/50"
                        >
                          {isMultiple && draftEvents.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute -right-2 -top-2 h-7 w-7 rounded-full bg-gray-800 hover:bg-red-600"
                              onClick={() => removeDraft(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}

                          <div className="space-y-2">
                            <Label>Event Title</Label>
                            <Input
                              placeholder="e.g. Design Review"
                              className="bg-gray-800/50 border-gray-700 text-white"
                              value={draft.title}
                              onChange={(e) =>
                                updateDraft(index, { title: e.target.value })
                              }
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Type</Label>
                              <Select
                                value={draft.type}
                                onValueChange={(v) =>
                                  v && updateDraft(index, { type: v })
                                }
                              >
                                <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                                  <SelectItem value="task">Task</SelectItem>
                                  <SelectItem value="break">Break</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Start Time</Label>
                              <TimePicker
                                value={draft.startTime}
                                onChange={(v) =>
                                  updateDraft(index, { startTime: v })
                                }
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>End Time</Label>
                            <TimePicker
                              value={draft.endTime}
                              onChange={(v) =>
                                updateDraft(index, { endTime: v })
                              }
                            />
                          </div>
                        </div>
                      ))}

                      {isMultiple && (
                        <Button
                          variant="outline"
                          className="flex flex-col items-center justify-center gap-2 h-full min-h-[200px] rounded-2xl border-dashed border-2 bg-gray-900/20 hover:bg-gray-700/30 border-gray-700"
                          onClick={addMoreForm}
                        >
                          <Plus className="w-6 h-6 text-cyan-400" />
                          <span className="font-semibold text-gray-400">
                            Add Another Event
                          </span>
                        </Button>
                      )}
                    </div>
                  </div>

                  <DialogFooter className="border-t border-gray-700 pt-4">
                    <Button
                      onClick={handleAddEvent}
                      className="bg-cyan-900 hover:bg-cyan-700 text-cyan-100 rounded-full px-8"
                    >
                      {isMultiple ? "Add All Events" : "Save Event"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
            {/* Sidebar */}
            <div className="space-y-6">
              <Card className="bg-gray-800/30 backdrop-blur-md border-gray-700 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-white text-sm">
                    Work Day Settings
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Define your active hours
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Start Time</Label>
                    <TimePicker value={workStart} onChange={setWorkStart} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">End Time</Label>
                    <TimePicker value={workEnd} onChange={setWorkEnd} />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/30 backdrop-blur-md border-gray-700 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-white text-sm">
                    Quick Add
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 bg-gray-900/50 border-gray-700 text-cyan-300 hover:bg-cyan-900/20"
                    size="sm"
                    onClick={() => setDialogOpen(true)}
                  >
                    <ListTodo className="w-4 h-4" />
                    New Task
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 bg-gray-900/50 border-gray-700 text-emerald-300 hover:bg-emerald-900/20"
                    size="sm"
                    onClick={() => setDialogOpen(true)}
                  >
                    <Coffee className="w-4 h-4" />
                    Add Break
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Calendar Grid */}
            <Card className="bg-gray-800/30 backdrop-blur-md border-gray-700 shadow-2xl overflow-hidden">
              <div className="flex h-12 items-center border-b border-gray-700 bg-gray-900/30 px-6">
                <span className="text-sm font-semibold text-white">
                  {format(new Date(), "EEEE, MMM dd")}
                </span>
              </div>
              <CardContent className="p-0 relative overflow-y-auto max-h-[700px]">
                <div className="relative flex min-w-full">
                  {/* Time Column */}
                  <div className="w-20 border-r border-gray-700 bg-gray-900/20">
                    {timeSlots.map((time) => (
                      <div
                        key={time}
                        className="h-16 border-b border-gray-700/30 px-3 py-2 text-[10px] font-medium text-gray-500"
                      >
                        {formatTime12h(time)}
                      </div>
                    ))}
                  </div>

                  {/* Grid Column */}
                  <div className="flex-1 relative">
                    {/* Grid Lines */}
                    {timeSlots.map((time) => (
                      <div
                        key={time}
                        className="h-16 border-b border-gray-700/20"
                      />
                    ))}

                    {/* Events */}
                    <DndContext
                      sensors={sensors}
                      onDragEnd={handleDragEnd}
                      modifiers={[
                        restrictToVerticalAxis,
                        restrictToParentElement,
                      ]}
                    >
                      {events.map((event) => (
                        <DraggableEvent
                          key={event.id}
                          event={event}
                          calculatePosition={calculatePosition}
                          formatTime12h={formatTime12h}
                          removeEvent={removeEvent}
                          updateEvent={updateEvent}
                          allEvents={events}
                        />
                      ))}
                    </DndContext>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Back to Timer */}
          <div className="text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-900/50 hover:bg-cyan-900 text-cyan-100 rounded-full font-medium transition-colors"
            >
              Back to Timer
            </Link>
          </div>
        </div>
      </div>
    </Background>
  );
}

function DraggableEvent({
  event,
  calculatePosition,
  formatTime12h,
  removeEvent,
  updateEvent,
  allEvents,
}) {
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [editDraft, setEditDraft] = React.useState(event);

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: event.id,
      disabled: isEditDialogOpen,
    });

  const { top, height, left, width } = calculatePosition(
    event.startTime,
    event.endTime,
    allEvents,
    event.id
  );

  const style = {
    top: `${top}px`,
    height: `${height}px`,
    left: left,
    width: width,
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    zIndex: isDragging ? 50 : 10,
    opacity: isDragging ? 0.8 : 1,
  };

  const handleSaveEdit = () => {
    updateEvent(event.id, {
      title: editDraft.title,
      startTime: editDraft.startTime,
      endTime: editDraft.endTime,
      type: editDraft.type,
    });
    setIsEditDialogOpen(false);
  };

  return (
    <Dialog
      open={isEditDialogOpen}
      onOpenChange={(open) => {
        if (open) setEditDraft(event);
        setIsEditDialogOpen(open);
      }}
    >
      <DialogTrigger asChild>
        <div
          ref={setNodeRef}
          style={style}
          className={cn(
            "absolute rounded-lg border p-3 backdrop-blur-sm shadow-lg transition-all hover:shadow-xl cursor-grab active:cursor-grabbing",
            event.color,
            isDragging && "ring-2 ring-cyan-500/50"
          )}
          {...attributes}
          {...listeners}
          onClick={(e) => {
            e.stopPropagation();
            setIsEditDialogOpen(true);
          }}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              {event.type === "task" ? (
                <ListTodo className="w-3 h-3" />
              ) : (
                <Coffee className="w-3 h-3" />
              )}
              <span className="text-xs font-bold uppercase tracking-wider opacity-70">
                {event.type}
              </span>
            </div>
            <h3 className="text-sm font-bold leading-tight">{event.title}</h3>
            <div className="flex items-center gap-1 text-[10px] font-medium opacity-60">
              <Clock className="w-3 h-3" />
              {formatTime12h(event.startTime)} - {formatTime12h(event.endTime)}
            </div>
          </div>
        </div>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px] bg-gray-800/95 border-gray-700 text-white backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
          <DialogDescription className="text-gray-400">
            Update the details of your scheduled {event.type}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={editDraft.title}
              onChange={(e) =>
                setEditDraft({ ...editDraft, title: e.target.value })
              }
              className="bg-gray-900/50 border-gray-700 text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={editDraft.type}
                onValueChange={(v) =>
                  v && setEditDraft({ ...editDraft, type: v })
                }
              >
                <SelectTrigger className="bg-gray-900/50 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  <SelectItem value="task">Task</SelectItem>
                  <SelectItem value="break">Break</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Start Time</Label>
              <TimePicker
                value={editDraft.startTime}
                onChange={(v) => setEditDraft({ ...editDraft, startTime: v })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>End Time</Label>
            <TimePicker
              value={editDraft.endTime}
              onChange={(v) => setEditDraft({ ...editDraft, endTime: v })}
            />
          </div>
        </div>
        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 pt-4 border-t border-gray-700">
          <Button
            variant="ghost"
            className="text-red-400 hover:bg-red-900/20"
            onClick={() => {
              removeEvent(event.id);
              setIsEditDialogOpen(false);
            }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Event
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="bg-gray-700 border-gray-600 text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              className="bg-cyan-900 hover:bg-cyan-700 text-cyan-100"
            >
              Save Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
