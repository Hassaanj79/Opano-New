
"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coffee, LogOut, Play, TimerIcon, Edit2, Trash } from "lucide-react";
import React, { useState, useEffect } from 'react';
import { useAppContext } from "@/contexts/AppContext";
import { UserAvatar } from "@/components/UserAvatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from 'date-fns';
import type { AttendanceLogEntry } from '@/types';

const MAX_WORK_SECONDS = 8 * 60 * 60; // 8 hours in seconds for progress calculation

const formatTimeToAMPM = (date: Date | null): string => {
  if (!date) return "--:-- --";
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const formatDuration = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const formatDurationForTable = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours === 0 && minutes === 0) return `${totalSeconds} Secs`;
  if (hours === 0) return `${minutes} Mins`;
  const decimalHours = hours + minutes / 60;
  return `${decimalHours.toFixed(2)} Hours`;
};

const formatDateForReportHeader = (date: Date): string => {
  return format(date, 'dd-MMM-yyyy');
};


const WorkTimerDisplay = ({ time, progressPercent }: { time: string, progressPercent: number }) => {
  const radius = 100;
  const strokeWidth = 16;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="relative w-64 h-64 flex items-center justify-center my-6">
      <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 220 220">
        <circle cx="110" cy="110" r={radius} fill="transparent" stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
        <circle
          cx="110"
          cy="110"
          r={radius}
          fill="transparent"
          stroke="hsl(var(--primary))"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.3s ease-out' }}
        />
      </svg>
      <div className="absolute w-[calc(100%-36px)] h-[calc(100%-36px)] bg-background rounded-full flex items-center justify-center shadow-inner">
        <span className="text-foreground text-5xl font-mono font-semibold">
          {time}
        </span>
      </div>
    </div>
  );
};

const InfoRow = ({ label, value, icon: Icon }: { label: string, value: string, icon?: React.ElementType }) => (
  <div className="flex justify-between items-center py-2 border-b border-border/50 last:border-b-0 w-full max-w-sm">
    <div className="flex items-center text-sm text-muted-foreground">
      {Icon && <Icon className="h-4 w-4 mr-2" />}
      {label}
    </div>
    <span className="text-sm font-medium text-foreground">{value}</span>
  </div>
);

type AttendanceStatus = 'not-clocked-in' | 'working' | 'on-break' | 'clocked-out';

export default function AttendancePage() {
  const { currentUser } = useAppContext();
  const [status, setStatus] = useState<AttendanceStatus>('not-clocked-in');
  const [clockInTime, setClockInTime] = useState<Date | null>(null);
  const [clockOutTime, setClockOutTime] = useState<Date | null>(null);
  const [isOnBreak, setIsOnBreak] = useState<boolean>(false);
  const [breakStartTime, setBreakStartTime] = useState<Date | null>(null);
  const [accumulatedBreakDuration, setAccumulatedBreakDuration] = useState<number>(0);
  const [workedSeconds, setWorkedSeconds] = useState<number>(0);
  const [attendanceLog, setAttendanceLog] = useState<AttendanceLogEntry[]>([]);
  const [reportDate, setReportDate] = useState<Date>(new Date());


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
    const now = new Date();
    setClockInTime(now);
    setClockOutTime(null);
    setIsOnBreak(false);
    setBreakStartTime(null);
    setAccumulatedBreakDuration(0);
    setWorkedSeconds(0);
    setStatus('working');
    // If clocking in on a new day, reset the log and update reportDate
    if (reportDate.toDateString() !== now.toDateString()) {
      setAttendanceLog([]);
      setReportDate(now);
    }
  };

  const handleClockOut = () => {
    if (status === 'not-clocked-in' || status === 'clocked-out' || !clockInTime) return;

    let finalBreakDuration = accumulatedBreakDuration;
    if (status === 'on-break' && breakStartTime) {
      finalBreakDuration += Math.floor((new Date().getTime() - breakStartTime.getTime()) / 1000);
    }
    
    const currentClockOutTime = new Date();
    setClockOutTime(currentClockOutTime);
    setAccumulatedBreakDuration(finalBreakDuration); 
    setStatus('clocked-out');
    setIsOnBreak(false);
    setBreakStartTime(null);

    // Add to log
    const newLogEntry: AttendanceLogEntry = {
      id: `log-${Date.now()}`,
      clockInTime: clockInTime,
      clockOutTime: currentClockOutTime,
      totalHoursWorked: workedSeconds,
      totalActivityPercent: Math.floor(Math.random() * 41) + 60, // Random 60-100%
    };
    setAttendanceLog(prevLog => [newLogEntry, ...prevLog]);
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

  const getStatusBadge = () => {
    switch (status) {
      case 'not-clocked-in':
        return <Badge variant="outline" className="border-gray-400 text-gray-500">Ready to Work</Badge>;
      case 'working':
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-primary-foreground">Currently Working</Badge>;
      case 'on-break':
        return <Badge variant="secondary" className="bg-yellow-400 text-yellow-800 hover:bg-yellow-500">On Break</Badge>;
      case 'clocked-out':
        return <Badge variant="destructive">Session Ended</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-theme(spacing.16))] bg-muted/30 p-4 md:p-6 w-full overflow-y-auto">
      {/* User Info Section - Top Left */}
      <div className="w-full flex justify-start items-center p-4 mb-6 border-b border-border">
        <UserAvatar user={currentUser} className="h-10 w-10" />
        <div className="ml-3">
          <h1 className="text-lg font-semibold text-foreground">{currentUser.name}</h1>
          <p className="text-xs text-muted-foreground">{currentUser.designation || "No Designation"}</p>
        </div>
      </div>

      {/* Centered Timer and Info Section */}
      <div className="flex flex-col items-center w-full max-w-lg mx-auto">
        <WorkTimerDisplay time={timerDisplay} progressPercent={progressPercent} />
        <div className="my-4">
          {getStatusBadge()}
        </div>
        
        <div className="space-y-1 text-left w-full px-2">
          <InfoRow label="Clocked In At" value={formatTimeToAMPM(clockInTime) + (clockInTime ? " EST" : "")} icon={Play} />
          {status !== 'not-clocked-in' && (
            <InfoRow label="Total Break" value={formatDuration(accumulatedBreakDuration)} icon={Coffee} />
          )}
          {status === 'clocked-out' && clockOutTime && (
            <InfoRow label="Clocked Out At" value={formatTimeToAMPM(clockOutTime) + " EST"} icon={LogOut} />
          )}
           {status !== 'clocked-out' && (
               <InfoRow label="Work Target" value={formatDuration(MAX_WORK_SECONDS)} icon={TimerIcon} />
           )}
        </div>
      </div>

      {/* Centered Action Buttons Section */}
      <div className="flex flex-col gap-3 pt-6 mt-auto w-full max-w-lg mx-auto pb-4">
        {status === 'not-clocked-in' && (
          <Button onClick={handleClockIn} size="lg" className="w-full">
            <Play className="mr-2 h-5 w-5" /> Clock In
          </Button>
        )}

        {status === 'working' && (
          <>
            <Button onClick={handleToggleBreak} size="lg" className="w-full">
              <Coffee className="mr-2 h-5 w-5" /> Take a Break
            </Button>
            <Button onClick={handleClockOut} variant="outline" className="w-full">
              <LogOut className="mr-2 h-5 w-5" /> Clock Out
            </Button>
          </>
        )}

        {status === 'on-break' && (
          <>
            <Button onClick={handleToggleBreak} size="lg" className="w-full">
              <Play className="mr-2 h-5 w-5" /> Resume Work
            </Button>
            <Button onClick={handleClockOut} variant="outline" className="w-full">
              <LogOut className="mr-2 h-5 w-5" /> Clock Out
            </Button>
          </>
        )}

        {status === 'clocked-out' && (
          <>
            <div className="text-center text-sm text-muted-foreground mb-2 p-3 bg-background/70 rounded-md w-full shadow">
              <p className="font-semibold text-foreground text-base mb-1">Session Summary</p>
              <InfoRow label="Total Time Worked" value={formatDuration(workedSeconds)} icon={TimerIcon} />
              <InfoRow label="Total Break Time" value={formatDuration(accumulatedBreakDuration)} icon={Coffee} />
            </div>
            <Button onClick={handleClockIn} size="lg" className="w-full">
               <Play className="mr-2 h-5 w-5" /> Start New Session
            </Button>
          </>
        )}
      </div>

      {/* Attendance Log Table Section */}
      {attendanceLog.length > 0 && (
        <div className="mt-10 w-full max-w-4xl mx-auto bg-card p-4 sm:p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-foreground mb-1">
            Clock In / Clock Out Report of {formatDateForReportHeader(reportDate)}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">Showing your activity for the selected date.</p>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Employee Name</TableHead>
                  <TableHead>Clock In Time</TableHead>
                  <TableHead>Clock Out Time</TableHead>
                  <TableHead>Total Hours Work</TableHead>
                  <TableHead>Total Activity</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceLog.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <UserAvatar user={currentUser} className="h-8 w-8" />
                        <div>
                          <div className="font-medium">{currentUser.name}</div>
                          <div className="text-xs text-muted-foreground">{currentUser.designation}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{formatTimeToAMPM(log.clockInTime)}</TableCell>
                    <TableCell>{formatTimeToAMPM(log.clockOutTime)}</TableCell>
                    <TableCell>{formatDurationForTable(log.totalHoursWorked)}</TableCell>
                    <TableCell>{log.totalActivityPercent}%</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary h-8 w-8">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-8 w-8">
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
