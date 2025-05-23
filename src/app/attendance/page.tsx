
"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pause, Coffee } from "lucide-react";
import React, { useState, useEffect } from 'react';

// Placeholder component for the circular progress timer
const CircularTimer = ({ time, progressPercent }: { time: string, progressPercent: number }) => {
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="relative w-56 h-56 flex items-center justify-center">
      <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 200 200">
        {/* Background track */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="transparent"
          stroke="hsl(var(--muted))" // Light grey track
          strokeWidth="18"
        />
        {/* Progress arc */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="transparent"
          stroke="hsl(var(--primary))" // Orange progress
          strokeWidth="18"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      {/* Inner black circle */}
      <div className="absolute w-[calc(100%-50px)] h-[calc(100%-50px)] bg-black rounded-full flex items-center justify-center">
        <span className="text-white text-4xl font-mono font-semibold">
          {time}
        </span>
      </div>
    </div>
  );
};

const CircularActionButton = ({ icon: Icon, label, onClick }: { icon: React.ElementType, label: string, onClick?: () => void }) => {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center w-28 h-28 rounded-full border-4 border-primary bg-black text-white hover:bg-primary/10 transition-colors group"
    >
      <Icon className="w-8 h-8 mb-1 text-white group-hover:text-primary" />
      <span className="text-sm font-medium text-white group-hover:text-primary">{label}</span>
    </button>
  );
};

const TimeDisplayBox = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="px-4 py-2 border border-border rounded-md bg-card text-card-foreground text-sm shadow-sm">
      {children}
    </div>
  );
};

const DottedLine = () => {
  return <div className="flex-grow border-t-2 border-dotted border-gray-400 mx-4 self-center h-0 min-w-[30px]"></div>;
}

export default function AttendancePage() {
  // Static data for UI display
  const [clockInTime, setClockInTime] = useState("11:20 AM ETS");
  const [timerDisplay, setTimerDisplay] = useState("00:55:98");
  const [clockOutTime, setClockOutTime] = useState("--:-- -- ETS");
  const [progress, setProgress] = useState(75); // Example progress 75%

  // Simulate timer update for visual effect (not real timer logic)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const milliseconds = String(Math.floor(now.getMilliseconds() / 10)).padStart(2, '0'); // Two digits for ms
      setTimerDisplay(`00:55:${seconds}`); // Keep minutes static for this example
      setProgress(prev => (prev + 1 > 100 ? 0 : prev + 1)); // Cycle progress
    }, 1000);
    return () => clearInterval(interval);
  }, []);


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6">
      <Card className="w-full max-w-4xl p-6 md:p-10 shadow-xl">
        <div className="flex items-center justify-around w-full">
          <TimeDisplayBox>Clock In At {clockInTime}</TimeDisplayBox>
          <DottedLine />
          <CircularActionButton icon={Pause} label="Stop" onClick={() => console.log("Stop clicked")} />
          <DottedLine />
          <CircularTimer time={timerDisplay} progressPercent={progress} />
          <DottedLine />
          <CircularActionButton icon={Coffee} label="Break" onClick={() => console.log("Break clicked")} />
          <DottedLine />
          <TimeDisplayBox>Clock Out At {clockOutTime}</TimeDisplayBox>
        </div>
      </Card>
      <div className="mt-8 text-center">
        <p className="text-muted-foreground text-sm">This is a static UI representation.</p>
        <p className="text-muted-foreground text-sm">Timer and clock-in/out logic will be implemented next.</p>
      </div>
    </div>
  );
}
