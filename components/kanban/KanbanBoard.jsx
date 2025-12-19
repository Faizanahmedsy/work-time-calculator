"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { BoardColumn, BoardContainer } from "./BoardColumn";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  KeyboardSensor,
  TouchSensor,
  MouseSensor,
} from "@dnd-kit/core";
import { SortableContext, arrayMove } from "@dnd-kit/sortable";
import { TaskCard } from "./TaskCard";
import { hasDraggableData } from "./utils";
import { coordinateGetter } from "./multipleContainersKeyboardPreset";
import { v4 as uuidv4 } from "uuid";
import { defaultCols, initialTasks } from "./constants/kanban.constants";
import { Button } from "../ui/button";
import { InteractiveHoverButton } from "../ui/interactive-hover-button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Label } from "../ui/label";
import { ThemeDialog } from "../global/ThemeDialog";
import { ThemeButton } from "../global/ThemeButton";

const TASKS_STORAGE_KEY = "kanban-tasks";

export function KanbanBoard() {
  const [isClient, setIsClient] = useState(false);

  const [columns, setColumns] = useState(defaultCols);
  const pickedUpTaskColumn = useRef(null);
  const columnsId = useMemo(() => columns.map((col) => col.id), [columns]);

  // Load tasks from local storage on initial render
  const [tasks, setTasks] = useState(() => {
    if (typeof window !== "undefined") {
      const savedTasks = localStorage.getItem(TASKS_STORAGE_KEY);
      return savedTasks ? JSON.parse(savedTasks) : initialTasks;
    }
    return initialTasks;
  });

  // State for confirmation modal
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);

  // Task dialog state
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [taskContent, setTaskContent] = useState("");
  const [taskColumnId, setTaskColumnId] = useState("todo");
  const [editingTaskId, setEditingTaskId] = useState(null);
  const isEditing = !!editingTaskId;

  // Save tasks to local storage whenever they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    }
  }, [tasks]);

  const [activeColumn, setActiveColumn] = useState(null);

  const [activeTask, setActiveTask] = useState(null);

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: coordinateGetter,
    })
  );

  function getDraggingTaskData(taskId, columnId) {
    const tasksInColumn = tasks.filter((task) => task.columnId === columnId);
    const taskPosition = tasksInColumn.findIndex((task) => task.id === taskId);
    const column = columns.find((col) => col.id === columnId);
    return {
      tasksInColumn,
      taskPosition,
      column,
    };
  }

  // Opens the add task dialog
  const openAddTaskDialog = () => {
    setTaskContent("");
    setTaskColumnId("todo");
    setEditingTaskId(null);
    setShowTaskDialog(true);
  };

  // Opens edit task dialog and populates with existing task data
  const openEditTaskDialog = (task) => {
    setTaskContent(task.content);
    setTaskColumnId(task.columnId);
    setEditingTaskId(task.id);
    setShowTaskDialog(true);
  };

  // Handles add/edit task submission
  const handleTaskSubmit = () => {
    if (!taskContent.trim()) return;

    if (isEditing) {
      // Edit existing task
      setTasks(
        tasks.map((task) =>
          task.id === editingTaskId
            ? { ...task, content: taskContent, columnId: taskColumnId }
            : task
        )
      );
    } else {
      // Add new task
      const newTask = {
        id: uuidv4(),
        columnId: taskColumnId,
        content: taskContent,
      };
      setTasks((prevTasks) => [...prevTasks, newTask]);
    }

    // Reset form and close dialog
    setTaskContent("");
    setEditingTaskId(null);
    setShowTaskDialog(false);
  };

  // Function to delete a task by its ID
  const deleteTask = (taskId) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
  };

  // Function to delete all tasks
  const deleteAllTasks = () => {
    setTasks([]);
    setShowDeleteAllModal(false);
  };

  // Function to handle deleting a task
  const handleDeleteTask = (taskId) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      deleteTask(taskId);
    }
  };

  const announcements = {
    onDragStart({ active }) {
      if (!hasDraggableData(active)) return;
      if (active.data.current?.type === "Column") {
        const startColumnIdx = columnsId.findIndex((id) => id === active.id);
        const startColumn = columns[startColumnIdx];
        return `Picked up Column ${startColumn?.title} at position: ${
          startColumnIdx + 1
        } of ${columnsId.length}`;
      } else if (active.data.current?.type === "Task") {
        pickedUpTaskColumn.current = active.data.current.task.columnId;
        const { tasksInColumn, taskPosition, column } = getDraggingTaskData(
          active.id,
          pickedUpTaskColumn.current
        );
        return `Picked up Task ${
          active.data.current.task.content
        } at position: ${taskPosition + 1} of ${
          tasksInColumn.length
        } in column ${column?.title}`;
      }
    },
    onDragOver({ active, over }) {
      if (!hasDraggableData(active) || !hasDraggableData(over)) return;

      if (
        active.data.current?.type === "Column" &&
        over.data.current?.type === "Column"
      ) {
        const overColumnIdx = columnsId.findIndex((id) => id === over.id);
        return `Column ${active.data.current.column.title} was moved over ${
          over.data.current.column.title
        } at position ${overColumnIdx + 1} of ${columnsId.length}`;
      } else if (
        active.data.current?.type === "Task" &&
        over.data.current?.type === "Task"
      ) {
        const { tasksInColumn, taskPosition, column } = getDraggingTaskData(
          over.id,
          over.data.current.task.columnId
        );
        if (over.data.current.task.columnId !== pickedUpTaskColumn.current) {
          return `Task ${
            active.data.current.task.content
          } was moved over column ${column?.title} in position ${
            taskPosition + 1
          } of ${tasksInColumn.length}`;
        }
        return `Task was moved over position ${taskPosition + 1} of ${
          tasksInColumn.length
        } in column ${column?.title}`;
      }
    },
    onDragEnd({ active, over }) {
      if (!hasDraggableData(active) || !hasDraggableData(over)) {
        pickedUpTaskColumn.current = null;
        return;
      }
      if (
        active.data.current?.type === "Column" &&
        over.data.current?.type === "Column"
      ) {
        const overColumnPosition = columnsId.findIndex((id) => id === over.id);

        return `Column ${
          active.data.current.column.title
        } was dropped into position ${overColumnPosition + 1} of ${
          columnsId.length
        }`;
      } else if (
        active.data.current?.type === "Task" &&
        over.data.current?.type === "Task"
      ) {
        const { tasksInColumn, taskPosition, column } = getDraggingTaskData(
          over.id,
          over.data.current.task.columnId
        );
        if (over.data.current.task.columnId !== pickedUpTaskColumn.current) {
          return `Task was dropped into column ${column?.title} in position ${
            taskPosition + 1
          } of ${tasksInColumn.length}`;
        }
        return `Task was dropped into position ${taskPosition + 1} of ${
          tasksInColumn.length
        } in column ${column?.title}`;
      }
      pickedUpTaskColumn.current = null;
    },
    onDragCancel({ active }) {
      pickedUpTaskColumn.current = null;
      if (!hasDraggableData(active)) return;
      return `Dragging ${active.data.current?.type} cancelled.`;
    },
  };

  useEffect(() => {
    setIsClient(true); // Set to true only on the client side
  }, []);

  if (!isClient) {
    return null; // Return nothing during SSR
  }

  return (
    <>
      <DndContext
        accessibility={{
          announcements,
        }}
        sensors={sensors}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
      >
        <BoardContainer>
          <SortableContext items={columnsId}>
            {columns.map((col) => (
              <BoardColumn
                key={col.id}
                column={col}
                tasks={tasks.filter((task) => task.columnId === col.id)}
                onDeleteTask={handleDeleteTask}
                onEditTask={(task) => openEditTaskDialog(task)}
              />
            ))}
          </SortableContext>
        </BoardContainer>

        {/* Action Buttons */}
        <div className="fixed bottom-4 right-4 flex space-x-2">
          <InteractiveHoverButton
            onClick={() => setShowDeleteAllModal(true)}
            className="px-4 py-2 bg-red-600 rounded-full"
          >
            Delete All Tasks
          </InteractiveHoverButton>
          <InteractiveHoverButton
            onClick={openAddTaskDialog}
            className="px-4 py-2 bg-cyan-900 rounded-full"
          >
            Add Task
          </InteractiveHoverButton>
        </div>

        {"document" in window &&
          createPortal(
            <DragOverlay>
              {activeColumn && (
                <BoardColumn
                  isOverlay
                  column={activeColumn}
                  tasks={tasks.filter(
                    (task) => task.columnId === activeColumn.id
                  )}
                />
              )}
              {activeTask && <TaskCard task={activeTask} isOverlay />}
            </DragOverlay>,
            document.body
          )}
      </DndContext>

      {/* Add/Edit Task Dialog */}
      <ThemeDialog
        open={showTaskDialog}
        onOpenChange={setShowTaskDialog}
        title={isEditing ? "Edit Task" : "Add New Task"}
        description={
          isEditing
            ? "Make changes to your task below."
            : "Enter the details for your new task below."
        }
        footer={
          <>
            <ThemeButton
              variant="outline"
              onClick={() => setShowTaskDialog(false)}
            >
              Cancel
            </ThemeButton>
            <ThemeButton variant="primary" onClick={handleTaskSubmit}>
              {isEditing ? "Save Changes" : "Add Task"}
            </ThemeButton>
          </>
        }
      >
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="task-content">Task Content</Label>
            <Input
              id="task-content"
              value={taskContent}
              onChange={(e) => setTaskContent(e.target.value)}
              placeholder="Enter task description..."
              className="col-span-3"
              autoFocus
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="task-column">Column</Label>
            <Select value={taskColumnId} onValueChange={setTaskColumnId}>
              <SelectTrigger className="w-full" id="task-column">
                <SelectValue placeholder="Select a column" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {columns.map((col) => (
                    <SelectItem key={col.id} value={col.id}>
                      {col.title}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </ThemeDialog>

      {/* Delete All Confirmation Modal */}
      <ThemeDialog
        open={showDeleteAllModal}
        onOpenChange={setShowDeleteAllModal}
        title="Confirm Delete All Tasks"
        description="Are you sure you want to delete all tasks from all columns? This action cannot be undone."
        footer={
          <>
            <ThemeButton
              variant="outline"
              onClick={() => setShowDeleteAllModal(false)}
            >
              Cancel
            </ThemeButton>
            <ThemeButton variant="destructive" onClick={deleteAllTasks}>
              Delete All
            </ThemeButton>
          </>
        }
      >
        {/* Empty content - description is in the dialog header */}
      </ThemeDialog>
    </>
  );

  function onDragStart(event) {
    if (!hasDraggableData(event.active)) return;
    const data = event.active.data.current;
    if (data?.type === "Column") {
      setActiveColumn(data.column);
      return;
    }

    if (data?.type === "Task") {
      setActiveTask(data.task);
      return;
    }
  }

  function onDragEnd(event) {
    setActiveColumn(null);
    setActiveTask(null);

    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (!hasDraggableData(active)) return;

    const activeData = active.data.current;

    if (activeId === overId) return;

    const isActiveAColumn = activeData?.type === "Column";
    if (!isActiveAColumn) return;

    setColumns((columns) => {
      const activeColumnIndex = columns.findIndex((col) => col.id === activeId);

      const overColumnIndex = columns.findIndex((col) => col.id === overId);

      return arrayMove(columns, activeColumnIndex, overColumnIndex);
    });
  }

  function onDragOver(event) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    if (!hasDraggableData(active) || !hasDraggableData(over)) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    const isActiveATask = activeData?.type === "Task";
    const isOverATask = overData?.type === "Task";

    if (!isActiveATask) return;

    // Im dropping a Task over another Task
    if (isActiveATask && isOverATask) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t.id === activeId);
        const overIndex = tasks.findIndex((t) => t.id === overId);
        const activeTask = tasks[activeIndex];
        const overTask = tasks[overIndex];
        if (
          activeTask &&
          overTask &&
          activeTask.columnId !== overTask.columnId
        ) {
          activeTask.columnId = overTask.columnId;
          return arrayMove(tasks, activeIndex, overIndex - 1);
        }

        return arrayMove(tasks, activeIndex, overIndex);
      });
    }

    const isOverAColumn = overData?.type === "Column";

    // Im dropping a Task over a column
    if (isActiveATask && isOverAColumn) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t.id === activeId);
        const activeTask = tasks[activeIndex];
        if (activeTask) {
          activeTask.columnId = overId;
          return arrayMove(tasks, activeIndex, activeIndex);
        }
        return tasks;
      });
    }
  }
}
