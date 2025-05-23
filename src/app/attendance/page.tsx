
"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pause, Coffee, Play } from "lucide-react";
import React, { useState, useEffect, useCallback } from 'react';

const MAX_WORK_SECONDS = 8 * 60 * 60; // 8 hours in seconds for progress calculation

// Helper to format Date object to HH:MM AM/PM string
const formatTimeToAMPM = (date: Date | null): string => {
  if (!date) return "--:-- --";
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

// Helper to format total seconds to HH:MM:SS string
const formatDuration = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const CircularTimer = ({ time, progressPercent }: { time: string, progressPercent: number }) => {
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="relative w-56 h-56 flex items-center justify-center">
      <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r={radius} fill="transparent" stroke="hsl(var(--muted))" strokeWidth="18" />
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="transparent"
          stroke="hsl(var(--primary))"
          strokeWidth="18"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.3s ease-out' }}
        />
      </svg>
      <div className="absolute w-[calc(100%-50px)] h-[calc(100%-50px)] bg-black rounded-full flex items-center justify-center">
        <span className="text-white text-4xl font-mono font-semibold">
          {time}
        </span>
      </div>
    </div>
  );
};

const CircularActionButton = ({ icon: Icon, label, onClick, disabled, variant = "primary" }: { icon: React.ElementType, label: string, onClick?: () => void, disabled?: boolean, variant?: "primary" | "secondary" }) => {
  const borderColorClass = variant === "primary" ? "border-primary" : "border-green-500";
  const hoverBgClass = variant === "primary" ? "hover:bg-primary/10" : "hover:bg-green-500/10";
  const groupHoverTextClass = variant === "primary" ? "group-hover:text-primary" : "group-hover:text-green-500";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center justify-center w-28 h-28 rounded-full border-4 bg-black text-white transition-colors group disabled:opacity-50 disabled:cursor-not-allowed ${borderColorClass} ${hoverBgClass}`}
    >
      <Icon className={`w-8 h-8 mb-1 text-white ${disabled ? '' : groupHoverTextClass}`} />
      <span className={`text-sm font-medium text-white ${disabled ? '' : groupHoverTextClass}`}>{label}</span>
    </button>
  );
};

const TimeDisplayBox = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="px-4 py-2 border border-border rounded-md bg-card text-card-foreground text-sm shadow-sm min-w-[140px] text-center">
      {children}
    </div>
  );
};

const DottedLine = () => {
  return <div className="flex-grow border-t-2 border-dotted border-gray-400 mx-4 self-center h-0 min-w-[30px]"></div>;
}

type AttendanceStatus = 'not-clocked-in' | 'working' | 'on-break' | 'clocked-out';

export default function AttendancePage() {
  const [status, setStatus] = useState<AttendanceStatus>('not-clocked-in');
  const [clockInTime, setClockInTime] = useState<Date | null>(null);
  const [clockOutTime, setClockOutTime] = useState<Date | null>(null);
  const [isOnBreak, setIsOnBreak] = useState<boolean>(false); // Derived from status, but useful for button text
  const [breakStartTime, setBreakStartTime] = useState<Date | null>(null);
  const [accumulatedBreakDuration, setAccumulatedBreakDuration] = useState<number>(0); // in seconds
  const [workedSeconds, setWorkedSeconds] = useState<number>(0);

  // Initial clock-in for demo purposes (simulating an ongoing session)
  useEffect(() => {
    // To avoid hydration errors, set initial Date based values in useEffect
    const now = new Date();
    // For demo, let's say user clocked in 55 minutes and 11 seconds ago
    const mockClockIn = new Date(now.getTime() - (55 * 60 + 11) * 1000);
    setClockInTime(mockClockIn);
    setStatus('working');
  }, []);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (status === 'working') {
      intervalId = setInterval(() => {
        setWorkedSeconds(prevSeconds => prevSeconds + 1);
      }, 1000);
    } else {
      if (intervalId) clearInterval(intervalId);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [status]);

  // Update workedSeconds based on clockInTime and accumulatedBreakDuration when status changes
   useEffect(() => {
    if (status === 'working' && clockInTime) {
      const elapsedSinceClockIn = Math.floor((new Date().getTime() - clockInTime.getTime()) / 1000);
      setWorkedSeconds(Math.max(0, elapsedSinceClockIn - accumulatedBreakDuration));
    }
  }, [status, clockInTime, accumulatedBreakDuration]);


  const handleClockIn = () => {
    setClockInTime(new Date());
    setClockOutTime(null);
    setIsOnBreak(false);
    setBreakStartTime(null);
    setAccumulatedBreakDuration(0);
    setWorkedSeconds(0);
    setStatus('working');
  };

  const handleClockOut = () => {
    if (status === 'not-clocked-in' || status === 'clocked-out') return;

    let finalBreakDuration = accumulatedBreakDuration;
    if (status === 'on-break' && breakStartTime) {
      finalBreakDuration += Math.floor((new Date().getTime() - breakStartTime.getTime()) / 1000);
    }
    
    setClockOutTime(new Date());
    setAccumulatedBreakDuration(finalBreakDuration); // Ensure break duration is captured if clocking out from break
    setStatus('clocked-out');
    setIsOnBreak(false); // Ensure break is ended
  };

  const handleToggleBreak = () => {
    if (status === 'working') {
      setBreakStartTime(new Date());
      setStatus('on-break');
      setIsOnBreak(true);
    } else if (status === 'on-break' && breakStartTime) {
      const currentBreakElapsed = Math.floor((new Date().getTime() - breakStartTime.getTime()) / 1000);
      setAccumulatedBreakDuration(prev => prev + currentBreakElapsed);
      setBreakStartTime(null);
      setStatus('working');
      setIsOnBreak(false);
    }
  };

  const timerDisplay = formatDuration(workedSeconds);
  const progressPercent = status === 'clocked-out' || status === 'not-clocked-in' ? 0 : Math.min(100, (workedSeconds / MAX_WORK_SECONDS) * 100);

  const clockInDisplay = clockInTime ? formatTimeToAMPM(clockInTime) + " ETS" : "Clock In";
  const clockOutDisplay = clockOutTime ? formatTimeToAMPM(clockOutTime) + " ETS" : (status === 'not-clocked-in' ? "Clock Out" : "--:-- -- ETS");

  if (status === 'not-clocked-in') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6">
        <Card className="w-full max-w-md p-6 md:p-10 shadow-xl text-center">
          <h1 className="text-2xl font-semibold mb-6">Attendance</h1>
          <Button onClick={handleClockIn} size="lg" className="w-full">
            <Play className="mr-2 h-5 w-5" /> Clock In
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6">
      <Card className="w-full max-w-4xl p-6 md:p-10 shadow-xl">
        <div className="flex items-center justify-around w-full">
          <TimeDisplayBox>Clock In At<br/>{clockInDisplay.replace(' ETS', '')}</TimeDisplayBox>
          <DottedLine />
          <CircularActionButton 
            icon={Pause} 
            label="Stop" 
            onClick={handleClockOut} 
            disabled={status === 'clocked-out'}
          />
          <DottedLine />
          <CircularTimer time={timerDisplay} progressPercent={progressPercent} />
          <DottedLine />
          <CircularActionButton 
            icon={isOnBreak ? Play : Coffee} 
            label={isOnBreak ? "Resume" : "Break"} 
            onClick={handleToggleBreak} 
            disabled={status === 'clocked-out'}
            variant={isOnBreak ? "secondary" : "primary"}
          />
          <DottedLine />
          <TimeDisplayBox>Clock Out At<br/>{clockOutDisplay.replace(' ETS', '')}</TimeDisplayBox>
        </div>
      </Card>
       {status === 'clocked-out' && (
        <div className="mt-8 text-center">
          <p className="text-lg font-semibold">Session Ended</p>
          <p className="text-muted-foreground">Total time worked: {formatDuration(workedSeconds)}</p>
          <p className="text-muted-foreground">Total break time: {formatDuration(accumulatedBreakDuration)}</p>
          <Button onClick={handleClockIn} className="mt-4">
             Start New Session
          </Button>
        </div>
      )}
    </div>
  );
}
