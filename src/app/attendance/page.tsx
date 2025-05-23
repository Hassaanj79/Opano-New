
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pause, Coffee, Play, UserCircle } from "lucide-react";
import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from "@/contexts/AppContext";
import { UserAvatar } from "@/components/UserAvatar"; // Import UserAvatar

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
    <div className="relative w-56 h-56 flex items-center justify-center my-6"> {/* Added margin for spacing */}
      <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 200 200">
        {/* Background track - light grey similar to image */}
        <circle cx="100" cy="100" r={radius} fill="transparent" stroke="hsl(var(--muted))" strokeWidth="18" />
        {/* Progress arc - orange */}
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
      {/* Inner black circle */}
      <div className="absolute w-[calc(100%-38px)] h-[calc(100%-38px)] bg-foreground rounded-full flex items-center justify-center">
        <span className="text-background text-4xl font-mono font-semibold">
          {time}
        </span>
      </div>
    </div>
  );
};

const CircularActionButton = ({ icon: Icon, label, onClick, disabled, variant = "primary", isActive = false }: { icon: React.ElementType, label: string, onClick?: () => void, disabled?: boolean, variant?: "primary" | "secondary", isActive?: boolean }) => {
  // Using primary for orange as per the image
  const borderColorClass = "border-primary"; 
  const hoverBgClass = "hover:bg-primary/10";
  const groupHoverTextClass = "group-hover:text-primary";
  const activeBgClass = isActive ? "bg-primary/10" : "";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center justify-center w-28 h-28 rounded-full border-4 bg-foreground text-background transition-colors group disabled:opacity-50 disabled:cursor-not-allowed ${borderColorClass} ${hoverBgClass} ${activeBgClass} shadow-md`}
    >
      <Icon className={`w-8 h-8 mb-1 text-background ${disabled ? '' : groupHoverTextClass}`} />
      <span className={`text-sm font-medium text-background ${disabled ? '' : groupHoverTextClass}`}>{label}</span>
    </button>
  );
};

const TimeDisplayBox = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="px-4 py-2 border border-border rounded-md bg-card text-card-foreground text-sm shadow-sm min-w-[160px] text-center">
      {children}
    </div>
  );
};

const DottedLine = () => {
  return <div className="flex-grow border-t-2 border-dotted border-muted-foreground/50 mx-4 self-center h-0 min-w-[30px]"></div>;
}

type AttendanceStatus = 'not-clocked-in' | 'working' | 'on-break' | 'clocked-out';

export default function AttendancePage() {
  const { currentUser } = useAppContext();
  const [status, setStatus] = useState<AttendanceStatus>('not-clocked-in');
  const [clockInTime, setClockInTime] = useState<Date | null>(null);
  const [clockOutTime, setClockOutTime] = useState<Date | null>(null);
  const [isOnBreak, setIsOnBreak] = useState<boolean>(false);
  const [breakStartTime, setBreakStartTime] = useState<Date | null>(null);
  const [accumulatedBreakDuration, setAccumulatedBreakDuration] = useState<number>(0); // in seconds
  const [workedSeconds, setWorkedSeconds] = useState<number>(0);

  // Initial clock-in for demo purposes (simulating an ongoing session)
  useEffect(() => {
    const now = new Date();
    // For demo, let's say user clocked in at 11:20 AM, and it's now ~12:15 PM (55 mins worked)
    // To match "00:55:xx" on timer
    const mockClockInHour = 11;
    const mockClockInMinute = 20;
    
    let mockClockIn = new Date(now.getFullYear(), now.getMonth(), now.getDate(), mockClockInHour, mockClockInMinute, 0, 0);

    // If current time is before mock clock-in time (e.g. it's 9 AM), set clock-in to yesterday
    if (now < mockClockIn) {
        mockClockIn.setDate(mockClockIn.getDate() -1);
    }
    
    setClockInTime(mockClockIn);
    setStatus('working');
    // Calculate initial workedSeconds based on this fixed clock-in time
    const initialWorked = Math.floor((now.getTime() - mockClockIn.getTime()) / 1000);
    // To match the 00:55:xx display, we can set it more directly too, but this is more realistic
    // For precise image match of timer start at 00:55:xx:
    // setWorkedSeconds(55 * 60 + 10); // 55 mins + 10 secs
    setWorkedSeconds(Math.max(0, initialWorked));

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
    setAccumulatedBreakDuration(finalBreakDuration); 
    setStatus('clocked-out');
    setIsOnBreak(false);
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

  const clockInDisplay = clockInTime ? `${formatTimeToAMPM(clockInTime)} ETS` : "Clock In At --:-- -- ETS";
  const clockOutDisplay = clockOutTime ? `${formatTimeToAMPM(clockOutTime)} ETS` : (status === 'not-clocked-in' ? "Clock Out At --:-- -- ETS" : "Clock Out At --:-- -- ETS");
  
  const idleTimeDisplay = formatDuration(accumulatedBreakDuration); // Using accumulatedBreakDuration for Idle Time

  if (status === 'not-clocked-in') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-theme(spacing.16))] bg-background p-6">
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
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-theme(spacing.16))] bg-background p-4 md:p-6">
      <Card className="w-full max-w-4xl p-4 md:p-8 shadow-xl">
        {/* Top User Info Section */}
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="flex items-center gap-3">
            <UserAvatar user={currentUser} className="h-12 w-12" />
            <div>
              <h2 className="text-lg font-semibold text-foreground">{currentUser.name}</h2>
              <p className="text-sm text-muted-foreground">{currentUser.designation || "No Designation"}</p>
              {/* Placeholder for pronouns, can be made dynamic later */}
              <p className="text-xs text-muted-foreground/80">She/Her</p> 
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => alert("View Profile clicked!")}>View Profile</Button>
        </div>

        {/* Main Timer Row */}
        <div className="flex items-center justify-around w-full">
          <TimeDisplayBox>{clockInDisplay}</TimeDisplayBox>
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
            variant={isOnBreak ? "secondary" : "primary"} // 'secondary' for green resume like in prev examples if needed
            isActive={isOnBreak}
          />
          <DottedLine />
          <TimeDisplayBox>{clockOutDisplay}</TimeDisplayBox>
        </div>

        {/* Bottom Idle Time Display */}
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-border/50 px-2">
           <span className="text-sm text-muted-foreground">Idle Time</span>
           <span className="text-sm font-medium text-foreground">{idleTimeDisplay.substring(3)}</span> {/* Display MM:SS part of idle time */}
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

    