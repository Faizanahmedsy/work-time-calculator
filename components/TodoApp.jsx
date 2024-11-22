"use client";
import Background from "@/components/Background";
import React from "react";
import { TodoList } from "./TodoList";

export default function TodoApp() {
  return (
    <Background>
      <div className="flex flex-col h-screen justify-center items-center relative z-10 leading-5 tracking-wider gap-14">
        <TodoList />
      </div>
    </Background>
  );
}
