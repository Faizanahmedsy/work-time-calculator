"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Check, Pencil, Trash2, ClipboardList, Plus } from "lucide-react";
import { useTodoStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";

export function TodoList() {
  const {
    todos,
    addTodo,
    toggleTodo,
    deleteTodo,
    updateTodo,
    getCompletedTodos,
  } = useTodoStore();
  const [newTodo, setNewTodo] = useState("");
  const [editTodo, setEditTodo] = useState({ id: "", title: "" });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleAddTodo = (e) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    addTodo(newTodo);
    setNewTodo("");
  };

  const handleUpdateTodo = () => {
    if (!editTodo.title.trim()) return;
    updateTodo(editTodo.id, editTodo.title);
    setEditTodo({ id: "", title: "" });
    setIsEditDialogOpen(false); // Close the edit dialog
  };

  const handleDeleteTodo = (id) => {
    deleteTodo(id);
    setIsDeleteDialogOpen(false); // Close the delete dialog
  };

  const generateEODReport = () => {
    const completedTodos = getCompletedTodos();
    const report = `EOD\n---------------------\n${completedTodos
      .map((todo) => `- ${todo.title}`)
      .join("\n")}`;

    navigator.clipboard.writeText(report);
    toast({
      title: "EOD Report copied to clipboard",
      description: "You can now paste it anywhere",
    });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-800 p-8 space-y-8">
        <div className="flex justify-between items-center border-b border-zinc-800 pb-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-b from-white to-slate-500 bg-clip-text text-transparent">
              Todo List
            </h1>
            <p className="text-zinc-500 mt-2">
              Organize your tasks efficiently
            </p>
          </div>
          <Button
            variant="outline"
            className="flex items-center gap-2 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors border-zinc-700 rounded-full"
            onClick={generateEODReport}
          >
            <ClipboardList className="h-4 w-4" />
            Generate EOD Report
          </Button>
        </div>

        <form
          onSubmit={handleAddTodo}
          className="flex gap-3 justify-center items-center"
        >
          <Input
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="What needs to be done?"
            className="flex-1 h-12 text-lg bg-zinc-800 border-zinc-700 text-zinc-200 placeholder-zinc-500 focus:ring-2 focus:ring-purple-500 rounded-full"
          />
          <Button
            type="submit"
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </form>

        <div className="space-y-3">
          {todos.map((todo) => (
            <div
              key={todo.id}
              className="flex items-center justify-between p-4 bg-zinc-800 rounded-xl hover:bg-zinc-700 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleTodo(todo.id)}
                  className={`rounded-full ${
                    todo.completed
                      ? "bg-green-900/30 text-green-400"
                      : "hover:bg-zinc-700"
                  }`}
                >
                  <Check
                    className={`h-5 w-5 transition-colors ${
                      todo.completed ? "text-green-400" : "text-zinc-500"
                    }`}
                  />
                </Button>
                <span
                  className={`text-lg transition-all ${
                    todo.completed
                      ? "line-through text-zinc-500"
                      : "text-zinc-100"
                  }`}
                >
                  {todo.title}
                </span>
              </div>

              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Dialog
                  open={isEditDialogOpen}
                  onOpenChange={setIsEditDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:bg-zinc-700 rounded-full text-zinc-400 hover:text-zinc-100"
                      onClick={() =>
                        setEditTodo({ id: todo.id, title: todo.title })
                      }
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-zinc-900 border-zinc-800">
                    <DialogHeader>
                      <DialogTitle className="text-zinc-100">
                        Edit Todo
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="title" className="text-zinc-300">
                          Task Description
                        </Label>
                        <Input
                          id="title"
                          value={editTodo.title}
                          onChange={(e) =>
                            setEditTodo({ ...editTodo, title: e.target.value })
                          }
                          className="bg-zinc-800 border-zinc-700 text-zinc-200 focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <Button
                        onClick={handleUpdateTodo}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        Save Changes
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <AlertDialog
                  open={isDeleteDialogOpen}
                  onOpenChange={setIsDeleteDialogOpen}
                >
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:bg-red-900/30 rounded-full"
                    >
                      <Trash2 className="h-4 w-4 text-red-400 hover:text-red-500" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-zinc-900 border-zinc-800">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-zinc-100">
                        Delete Task
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-zinc-500">
                        Are you sure you want to delete this task? This action
                        cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="text-zinc-300 hover:bg-zinc-800">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteTodo(todo.id)}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}

          {todos.length === 0 && (
            <div className="text-center py-12 text-zinc-500">
              <p className="text-lg">No tasks yet</p>
              <p className="text-sm">Add your first task above</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
