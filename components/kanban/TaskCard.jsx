"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cva } from "class-variance-authority";
import { GripVertical, Trash } from "lucide-react"; // Import Trash icon
import { Badge } from "../ui/badge";

export function TaskCard({ task, isOverlay, onDeleteTask }) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: "Task",
      task,
    },
    attributes: {
      roleDescription: "Task",
    },
  });

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  };

  const variants = cva("", {
    variants: {
      dragging: {
        over: "ring-2 opacity-30",
        overlay: "ring-2 ring-primary",
      },
    },
  });

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={variants({
        dragging: isOverlay ? "overlay" : isDragging ? "over" : undefined,
      })}
    >
      <CardHeader className="px-3 py-3 space-between flex flex-row border-b-2 border-secondary relative">
        <Button
          variant={"ghost"}
          {...attributes}
          {...listeners}
          className="p-1 text-secondary-foreground/50 -ml-2 h-auto cursor-grab"
        >
          <span className="sr-only">Move task</span>
          <GripVertical />
        </Button>
        <Badge variant={"outline"} className="ml-auto font-semibold">
          Task
        </Badge>
        {/* Delete Button */}
        <Button
          variant={"ghost"}
          size={"icon"}
          onClick={() => onDeleteTask(task.id)}
          className="p-1 text-red-500 hover:text-red-700"
          aria-label="Delete task"
        >
          <Trash className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="px-3 pt-3 pb-6 text-left whitespace-pre-wrap">
        {task.content}
      </CardContent>
    </Card>
  );
}
