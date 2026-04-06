"use client";
import Background from "@/components/Background";
import { PromptGenerator } from "@/components/PromptGenerator";

export default function PromptGeneratorPage() {
  return (
    <Background>
      <div className="flex flex-col min-h-screen justify-center items-center relative z-10 leading-5 tracking-wider gap-14">
        <PromptGenerator />
      </div>
    </Background>
  );
}
