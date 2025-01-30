"use client";
import React from "react";
import Background from "../Background";
import { KanbanBoard } from "./KanbanBoard";

export default function KanbanLayout() {
  return (
    <>
      <Background>
        <div className="flex flex-col h-screen justify-center items-center relative z-10 leading-5 tracking-wider gap-14">
          <KanbanBoard />
        </div>
      </Background>
    </>
  );
}
