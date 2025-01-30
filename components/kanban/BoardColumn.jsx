"use client";
import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { useDndContext } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useMemo } from "react";
import { TaskCard } from "./TaskCard";
import { cva } from "class-variance-authority";
import { GripVertical, Copy } from "lucide-react"; // Import Copy icon
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader } from "../ui/card";
import { useToast } from "@/hooks/use-toast";

export function BoardColumn({ column, tasks, isOverlay, onDeleteTask }) {
  const { toast } = useToast();

  const tasksIds = useMemo(() => {
    return tasks.map((task) => task.id);
  }, [tasks]);

  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: {
      type: "Column",
      column,
    },
    attributes: {
      roleDescription: `Column: ${column.title}`,
    },
  });

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  };

  const variants = cva(
    "h-[500px] max-h-[500px] w-[350px] max-w-full bg-primary-foreground flex flex-col flex-shrink-0 snap-center",
    {
      variants: {
        dragging: {
          default: "border-2 border-transparent",
          over: "ring-2 opacity-30",
          overlay: "ring-2 ring-primary",
        },
      },
    }
  );

  // Function to handle copying tasks to clipboard
  const handleCopyTasks = (column) => {
    console.log("column:", column);

    if (column.id === "in-progress") {
    } else if (column.id === "todo") {
    } else if (column.id === "done") {
    }

    const today = new Date();
    const formattedDate = today.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const tasksList = tasks.map((task) => `- ${task.content}`).join("\n");

    console.log("tasksList:", tasksList);

    let textToCopy = `Tasks for ${column.title} - ${formattedDate}\n--------------------------\n${tasksList}`;

    if (column.id === "in-progress") {
    } else if (column.id === "todo") {
      textToCopy = `TODO - ${formattedDate}\n--------------------------\n${tasksList}`;
    } else if (column.id === "done") {
      textToCopy = `EOD ${formattedDate}\n--------------------------\n${tasksList}`;
    }

    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        toast({
          title: "Tasks copied to clipboard",
          description: "You can now paste it anywhere",
        });
      })
      .catch((error) => {
        console.log("Error copying tasks:", error);
        toast({
          title: "Error copying tasks",
          description: "Please try again",
          status: "error",
        });
      });
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={variants({
        dragging: isOverlay ? "overlay" : isDragging ? "over" : undefined,
      })}
    >
      <CardHeader className="p-4 font-semibold border-b-2 text-left flex flex-row space-between items-center">
        <Button
          variant={"ghost"}
          {...attributes}
          {...listeners}
          className=" p-1 text-primary/50 -ml-2 h-auto cursor-grab relative"
        >
          <span className="sr-only">{`Move column: ${column.title}`}</span>
          <GripVertical />
        </Button>
        <span className="ml-auto"> {column.title}</span>
        {/* Add Copy Button */}
        <Button
          variant={"ghost"}
          size={"icon"}
          onClick={() => handleCopyTasks(column)}
          className="p-1 text-primary/50 hover:text-primary"
          aria-label="Copy tasks"
        >
          <Copy className="h-4 w-4" />
        </Button>
      </CardHeader>
      <ScrollArea>
        <CardContent className="flex flex-grow flex-col gap-2 p-2">
          <SortableContext items={tasksIds}>
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} onDeleteTask={onDeleteTask} />
            ))}
          </SortableContext>
        </CardContent>
      </ScrollArea>
    </Card>
  );
}

export function BoardContainer({ children }) {
  const dndContext = useDndContext();

  const variations = cva("px-2 md:px-0 flex lg:justify-center pb-4", {
    variants: {
      dragging: {
        default: "snap-x snap-mandatory",
        active: "snap-none",
      },
    },
  });

  return (
    <ScrollArea
      className={variations({
        dragging: dndContext.active ? "active" : "default",
      })}
    >
      <div className="flex gap-4 items-center flex-row justify-center">
        {children}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
