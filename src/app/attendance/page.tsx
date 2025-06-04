
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { UserAvatar } from '@/components/UserAvatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EditAttendanceLogDialog } from '@/components/dialogs/EditAttendanceLogDialog';
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar as CalendarIcon, MoreHorizontal, ArrowLeft, Clock, Pause, Play, Coffee, CalendarDays, BarChart as BarChartIcon, FileText as ReportIcon, Edit2, Trash, PlusCircle, LogOut, Activity, Clock10, Percent, UserCog, TrendingUp, Briefcase, Hourglass } from "lucide-react";
import { format, differenceInSeconds, intervalToDuration, formatDuration, add, sub, isSameDay, startOfDay, endOfDay, isValid, isWithinInterval, eachDayOfInterval } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import type { AttendanceLogEntry } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { Progress } from "@/components/ui/progress";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";


type AttendanceStatus = 'not-clocked-in' | 'working' | 'on-break' | 'clocked-out';

interface DailyHoursData {
  date: string;
  hours: number;
}

interface AttendanceSummaryData {
  totalHoursWorked: number;
  averageDailyHours: number;
  totalBreakDuration: number;
  loggedDays: number;
  dailyWorkData: DailyHoursData[];
}

const WorkTimerDisplay = React.memo(({ currentSeconds, status }: { currentSeconds: number; status: AttendanceStatus }) => {
  const hours = String(Math.floor(currentSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((currentSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(currentSeconds % 60).padStart(2, '0');
  const displayTime = `${hours} : ${minutes} : ${seconds}`;

  if (status === 'not-clocked-in' || status === 'clocked-out') {
    return (
      <div className="text-6xl md:text-7xl font-mono font-semibold text-muted-foreground my-8 tabular-nums">
        00 : 00 : 00
      </div>
    );
  }

  return (
    <div className="text-6xl md:text-7xl font-mono font-semibold text-foreground my-8 tabular-nums">
      {displayTime}
    </div>
  );
});
WorkTimerDisplay.displayName = 'WorkTimerDisplay';


const InfoRow = ({ icon: Icon, label, value, valueClassName }: { icon: React.ElementType, label: string, value: string | React.ReactNode, valueClassName?: string }) => (
  <div className="flex items-center justify-between py-1.5">
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </div>
    <div className={cn("text-sm font-semibold text-foreground", valueClassName)}>{value}</div>
  </div>
);

interface AttendancePageProps {
  params: unknown; 
  searchParams: unknown;
}

export default function AttendancePage({ params, searchParams }: AttendancePageProps) {
  const router = useRouter();
  const { currentUser, isLoadingAuth } = useAppContext();
  const { toast } = useToast();

  const [status, setStatus] = useState<AttendanceStatus>('not-clocked-in');
  const [clockInTime, setClockInTime] = useState<Date | null>(null);
  const [clockOutTime, setClockOutTime] = useState<Date | null>(null);
  const [breakStartTime, setBreakStartTime] = useState<Date | null>(null);
  const [accumulatedBreakDuration, setAccumulatedBreakDuration] = useState(0); 
  const [workedSeconds, setWorkedSeconds] = useState(0);
  
  const [masterAttendanceLog, setMasterAttendanceLog] = useState<AttendanceLogEntry[]>([]);
  const [reportDateRange, setReportDateRange] = useState<DateRange | undefined>(undefined);
  const [displayedAttendanceLog, setDisplayedAttendanceLog] = useState<AttendanceLogEntry[]>([]);

  const [isEditLogDialogOpen, setIsEditLogDialogOpen] = useState(false);
  const [editingLogEntry, setEditingLogEntry] = useState<AttendanceLogEntry | null>(null);
  const [deletingLogEntryId, setDeletingLogEntryId] = useState<string | null>(null);

  const WORK_TARGET_SECONDS = 8 * 60 * 60; 

 useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;

    if (status === 'working' && clockInTime) {
      const updateTimer = () => {
        const now = new Date();
        if (clockInTime) { 
            const totalElapsedMilliseconds = now.getTime() - clockInTime.getTime();
            const totalElapsedSeconds = Math.floor(totalElapsedMilliseconds / 1000);
            const currentWorkedSeconds = Math.max(0, totalElapsedSeconds - accumulatedBreakDuration);
            setWorkedSeconds(currentWorkedSeconds);
        }
      };

      updateTimer(); 
      intervalId = setInterval(updateTimer, 1000);
    } else if (intervalId) {
      clearInterval(intervalId);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [status, clockInTime, accumulatedBreakDuration]);


  useEffect(() => {
    if (reportDateRange?.from) {
      const startDate = startOfDay(reportDateRange.from);
      const endDate = reportDateRange.to ? endOfDay(reportDateRange.to) : endOfDay(reportDateRange.from);

      const filtered = masterAttendanceLog.filter(entry => {
        const entryDate = new Date(entry.clockInTime); 
        return isWithinInterval(entryDate, { start: startDate, end: endDate });
      });
      setDisplayedAttendanceLog(filtered.sort((a, b) => new Date(b.clockInTime).getTime() - new Date(a.clockInTime).getTime()));
    } else {
      setDisplayedAttendanceLog([]);
    }
  }, [masterAttendanceLog, reportDateRange]);

  const attendanceSummary = useMemo<AttendanceSummaryData>(() => {
    if (!displayedAttendanceLog.length || !reportDateRange?.from) {
      return { totalHoursWorked: 0, averageDailyHours: 0, totalBreakDuration: 0, loggedDays: 0, dailyWorkData: [] };
    }

    const dailyDataMap = new Map<string, { totalWork: number; totalBreak: number }>();
    const uniqueLoggedDays = new Set<string>();

    displayedAttendanceLog.forEach(log => {
      const dateStr = format(new Date(log.clockInTime), 'yyyy-MM-dd');
      uniqueLoggedDays.add(dateStr);
      const dayData = dailyDataMap.get(dateStr) || { totalWork: 0, totalBreak: 0 };
      dayData.totalWork += log.totalHoursWorked;
      dayData.totalBreak += log.totalBreakDuration || 0;
      dailyDataMap.set(dateStr, dayData);
    });
    
    let totalWorkOverall = 0;
    let totalBreakOverall = 0;
    
    dailyDataMap.forEach(data => {
        totalWorkOverall += data.totalWork;
        totalBreakOverall += data.totalBreak;
    });

    const loggedDaysCount = uniqueLoggedDays.size;
    const averageDailyHours = loggedDaysCount > 0 ? totalWorkOverall / loggedDaysCount : 0;

    const chartData: DailyHoursData[] = [];
    if (reportDateRange?.from) {
      const startDate = startOfDay(reportDateRange.from);
      const endDate = reportDateRange.to ? endOfDay(reportDateRange.to) : startDate; // if to is undefined, range is 1 day
      
      const daysInInterval = eachDayOfInterval({ start: startDate, end: endDate });

      daysInInterval.forEach(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const daySummary = dailyDataMap.get(dateStr);
        chartData.push({
          date: format(day, 'MMM d'),
          hours: daySummary ? daySummary.totalWork / 3600 : 0, // Convert seconds to hours
        });
      });
    }


    return {
      totalHoursWorked: totalWorkOverall,
      averageDailyHours,
      totalBreakDuration: totalBreakOverall,
      loggedDays: loggedDaysCount,
      dailyWorkData: chartData,
    };
  }, [displayedAttendanceLog, reportDateRange]);


  const handleClockIn = () => {
    const now = new Date();
    setClockInTime(now);
    setClockOutTime(null);
    setStatus('working');
    setWorkedSeconds(0);
    setAccumulatedBreakDuration(0);
    setBreakStartTime(null);
    toast({ title: "Clocked In", description: `Session started at ${format(now, "p")}.` });
  };

  const handleClockOut = () => {
    if (!clockInTime) return;
    const now = new Date();

    let currentBreakDuration = 0;
    if (status === 'on-break' && breakStartTime) {
      currentBreakDuration = differenceInSeconds(now, breakStartTime);
    }
    const finalAccumulatedBreak = accumulatedBreakDuration + currentBreakDuration;

    const totalElapsedSeconds = differenceInSeconds(now, clockInTime);
    const finalWorkedSeconds = Math.max(0, totalElapsedSeconds - finalAccumulatedBreak);
    
    setWorkedSeconds(finalWorkedSeconds); 
    setClockOutTime(now);
    setStatus('clocked-out');

    const newLogEntry: AttendanceLogEntry = {
      id: `log-${Date.now()}`,
      clockInTime: clockInTime,
      clockOutTime: now,
      totalHoursWorked: finalWorkedSeconds,
      totalActivityPercent: Math.floor(Math.random() * 41) + 60, 
      totalBreakDuration: finalAccumulatedBreak,
    };
    setMasterAttendanceLog(prevLog => [newLogEntry, ...prevLog].sort((a, b) => new Date(b.clockInTime).getTime() - new Date(a.clockInTime).getTime()));
    toast({ title: "Clocked Out", description: `Session ended at ${format(now, "p")}. Logged ${formatDurationForDisplay(finalWorkedSeconds)}.` });
  };

  const handleToggleBreak = () => {
    const now = new Date();
    if (status === 'working') {
      setBreakStartTime(now);
      setStatus('on-break');
      toast({ title: "Break Started", description: `Break started at ${format(now, "p")}.` });
    } else if (status === 'on-break' && breakStartTime) {
      const breakDuration = differenceInSeconds(now, breakStartTime);
      setAccumulatedBreakDuration(prev => prev + breakDuration);
      setBreakStartTime(null);
      setStatus('working');
      toast({ title: "Break Ended", description: `Resumed work at ${format(now, "p")}.` });
    }
  };

  const handleSaveEdit = (updatedEntry: AttendanceLogEntry) => {
    setMasterAttendanceLog(prev => prev.map(entry => entry.id === updatedEntry.id ? updatedEntry : entry)
      .sort((a, b) => new Date(b.clockInTime).getTime() - new Date(a.clockInTime).getTime()));
    toast({ title: "Log Updated", description: "Attendance log entry successfully updated."});
  };

  const handleConfirmDelete = () => {
    if (deletingLogEntryId) {
      setMasterAttendanceLog(prev => prev.filter(entry => entry.id !== deletingLogEntryId));
      setDeletingLogEntryId(null);
      toast({ title: "Log Deleted", description: "Attendance log entry successfully deleted."});
    }
  };

  const formatTimeWithZone = (date: Date | null) => date ? format(new Date(date), "hh:mm a") + " EST" : "--:-- -- EST";
  const formatDurationForDisplay = (seconds: number) => {
    if (seconds < 0) seconds = 0;
    const duration = intervalToDuration({ start: 0, end: seconds * 1000 });
    const formatted = formatDuration(duration, { format: ['hours', 'minutes', 'seconds'] });
    return formatted || "0 seconds";
  };
  
  const formatHoursForDisplay = (seconds: number) => {
    if (seconds < 0) seconds = 0;
    const hours = seconds / 3600;
    return `${hours.toFixed(1)} hr${hours !== 1 ? 's' : ''}`;
  };

  useEffect(() => {
    if (!reportDateRange?.from && !isLoadingAuth && currentUser) {
      const today = startOfDay(new Date());
      setReportDateRange({ from: today, to: endOfDay(today) });
    }
  }, [reportDateRange, isLoadingAuth, currentUser]);

  if (isLoadingAuth) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-theme(spacing.16))] bg-muted/30 p-4 md:p-6 w-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-theme(spacing.16))] bg-muted/30 p-4 md:p-6 w-full items-center justify-center">
        <LogOut className="h-16 w-16 mb-4 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Please Sign In</h1>
        <p className="text-muted-foreground">Sign in to access the attendance page.</p>
         <Button onClick={() => router.push('/auth/join')} className="mt-4">
            Go to Sign In
        </Button>
      </div>
    );
  }

  const getStatusBadge = () => {
    switch (status) {
      case 'working': return <Badge className="bg-green-500 hover:bg-green-600 text-primary-foreground">Currently Working</Badge>;
      case 'on-break': return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-primary-foreground">On Break</Badge>;
      case 'clocked-out': return <Badge className="bg-red-500 hover:bg-red-600 text-primary-foreground">Session Ended</Badge>;
      default: return <Badge variant="outline" className="border-blue-400 text-blue-600">Ready to Work</Badge>;
    }
  };
  
  const workProgressPercent = WORK_TARGET_SECONDS > 0 ? Math.min(100, (workedSeconds / WORK_TARGET_SECONDS) * 100) : 0;


  return (
    <div className="flex flex-col min-h-[calc(100vh-theme(spacing.16))] bg-muted/30 p-4 md:p-6 w-full overflow-y-auto">
       <div className="relative flex items-center justify-between mb-6 md:mb-8 border-b pb-4">
        <Button
            variant="outline"
            onClick={() => router.back()}
            className="h-auto py-1.5 px-3 rounded-full border-primary text-primary hover:bg-primary/10 flex-shrink-0"
        >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div className="flex flex-col items-center text-center flex-grow min-w-0 px-2">
          <UserAvatar user={currentUser} className="h-12 w-12 mb-1" />
          <h1 className="text-xl font-semibold text-foreground truncate">{currentUser.name}</h1>
          <p className="text-xs text-muted-foreground truncate">{currentUser.designation || 'No designation'}</p>
        </div>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <Button
                variant="ghost"
                size="icon"
                className="rounded-full border border-primary text-primary hover:bg-primary/10 hover:text-primary h-9 w-9 flex-shrink-0"
            >
                <MoreHorizontal className="h-5 w-5" />
            </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => toast({ title: "Analytics (Coming Soon)", description: "Detailed attendance analytics will be available soon." })}>
                <BarChartIcon className="mr-2 h-4 w-4" /> Analytics
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast({ title: "Reports (Coming Soon)", description: "Downloadable reports will be available soon." })}>
                <ReportIcon className="mr-2 h-4 w-4" /> Reports
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/leave-requests')}>
                <CalendarDays className="mr-2 h-4 w-4" /> Leave Request
            </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>


      <div className="flex flex-col items-center gap-3 md:gap-4 py-6">
        <WorkTimerDisplay currentSeconds={workedSeconds} status={status} />
        <div className="mb-2">{getStatusBadge()}</div>
        
        {status === 'working' && (
          <div className="w-full max-w-lg mb-4">
            <Progress value={workProgressPercent} className="h-2.5 rounded-full" />
            <p className="text-xs text-muted-foreground text-center mt-1.5">
              {formatDurationForDisplay(workedSeconds)} of {formatDurationForDisplay(WORK_TARGET_SECONDS)} ({workProgressPercent.toFixed(0)}%)
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-lg text-sm">
          <InfoRow icon={Clock} label="Clocked In At" value={formatTimeWithZone(clockInTime)} />
          <InfoRow icon={Coffee} label="Total Break" value={formatDurationForDisplay(accumulatedBreakDuration)} />
          <InfoRow icon={Clock10} label="Work Target" value={formatDurationForDisplay(WORK_TARGET_SECONDS)} />
        </div>
        {status === 'clocked-out' && clockOutTime && (
          <div className="w-full max-w-lg mt-3 p-4 rounded-md bg-muted/50 border text-center">
            <h3 className="font-semibold text-md mb-2">Last Session Summary</h3>
             <InfoRow icon={LogOut} label="Clocked Out At" value={formatTimeWithZone(clockOutTime)} />
             <InfoRow icon={Activity} label="Time Worked" value={formatDurationForDisplay(workedSeconds)} />
          </div>
        )}
        <div className="flex items-center gap-4 mt-6 pb-4">
          {status === 'not-clocked-in' && (
            <Button onClick={handleClockIn} size="lg" className="w-48">
              <Clock className="mr-2 h-5 w-5" /> Clock In
            </Button>
          )}
          {status === 'working' && (
            <>
              <Button onClick={handleToggleBreak} variant="outline" size="lg" className="w-40">
                <Pause className="mr-2 h-5 w-5" /> Take a Break
              </Button>
              <Button onClick={handleClockOut} variant="destructive" size="lg" className="w-40">
                <LogOut className="mr-2 h-5 w-5" /> Clock Out
              </Button>
            </>
          )}
          {status === 'on-break' && (
             <>
              <Button onClick={handleToggleBreak} variant="outline" size="lg" className="w-40">
                <Play className="mr-2 h-5 w-5" /> Resume Work
              </Button>
              <Button onClick={handleClockOut} variant="destructive" size="lg" className="w-40">
                <LogOut className="mr-2 h-5 w-5" /> Clock Out
              </Button>
            </>
          )}
          {status === 'clocked-out' && (
             <Button onClick={handleClockIn} size="lg" className="w-48">
              <Clock className="mr-2 h-5 w-5" /> Start New Session
            </Button>
          )}
        </div>
      </div>

      <div className="mt-10 pt-6 border-t">
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
          <h2 className="text-xl font-semibold text-foreground">
            Attendance Dashboard
          </h2>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn("w-full sm:w-[280px] justify-start text-left font-normal", !reportDateRange?.from && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {reportDateRange?.from ? (
                  reportDateRange.to && !isSameDay(reportDateRange.from, reportDateRange.to) ? (
                    <>
                      {format(reportDateRange.from, "LLL dd, y")} -{" "}
                      {format(reportDateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(reportDateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={reportDateRange?.from}
                selected={reportDateRange}
                onSelect={setReportDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hours Worked</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatHoursForDisplay(attendanceSummary.totalHoursWorked)}</div>
              <p className="text-xs text-muted-foreground">in selected range</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Daily Hours</CardTitle>
              <Clock10 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatHoursForDisplay(attendanceSummary.averageDailyHours)}</div>
              <p className="text-xs text-muted-foreground">based on logged days</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Break Duration</CardTitle>
              <Coffee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDurationForDisplay(attendanceSummary.totalBreakDuration)}</div>
              <p className="text-xs text-muted-foreground">across all sessions</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Logged Days</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{attendanceSummary.loggedDays}</div>
              <p className="text-xs text-muted-foreground">with attendance entries</p>
            </CardContent>
          </Card>
        </div>

        {/* Daily Work Hours Chart */}
        {reportDateRange?.from && attendanceSummary.dailyWorkData.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Daily Work Hours</CardTitle>
              <CardDescription>
                Total hours worked per day in the selected range.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] w-full p-2">
              <ChartContainer config={{
                  hours: { label: "Hours", color: "hsl(var(--primary))" },
                }}
                className="w-full h-full"
              >
                <BarChart accessibilityLayer data={attendanceSummary.dailyWorkData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis tickFormatter={(value) => `${value}h`} />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="line" />}
                  />
                  <Bar dataKey="hours" fill="var(--color-hours)" radius={4} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* Clock In / Clock Out Report Table */}
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Detailed Log Report
        </h2>
        {reportDateRange?.from && displayedAttendanceLog.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead className="w-[250px]">Employee Name</TableHead>
                    <TableHead>Clock In</TableHead>
                    <TableHead>Clock Out</TableHead>
                    <TableHead>Total Break</TableHead>
                    <TableHead>Total Work</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {displayedAttendanceLog.map((log) => (
                    <TableRow key={log.id}>
                    <TableCell>
                        <div className="flex items-center gap-2">
                        <UserAvatar user={currentUser} className="h-8 w-8 flex-shrink-0" />
                        <div className="min-w-0">
                            <div className="font-medium truncate">{currentUser.name}</div>
                            <div className="text-xs text-muted-foreground truncate">{currentUser.designation}</div>
                        </div>
                        </div>
                    </TableCell>
                    <TableCell>{formatTimeWithZone(log.clockInTime)}</TableCell>
                    <TableCell>{formatTimeWithZone(log.clockOutTime)}</TableCell>
                    <TableCell>{formatDurationForDisplay(log.totalBreakDuration || 0)}</TableCell>
                    <TableCell>{formatDurationForDisplay(log.totalHoursWorked)}</TableCell>
                    <TableCell>
                        <div className="flex items-center gap-1">
                        <Percent className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{log.totalActivityPercent}%</span>
                        </div>
                    </TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingLogEntry(log); setIsEditLogDialogOpen(true); }}>
                        <Edit2 className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeletingLogEntryId(log.id)}>
                            <Trash className="h-4 w-4 text-destructive" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete this log entry.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel onClick={() => setDeletingLogEntryId(null)}>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                        </AlertDialog>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
          </div>
        ) : (
           <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
            <Hourglass className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <p className="font-medium text-lg">
              {reportDateRange?.from ? `No attendance records for the selected date range.` : "Please select a date range to view the report."}
            </p>
          </div>
        )}
      </div>

      {editingLogEntry && (
        <EditAttendanceLogDialog
          isOpen={isEditLogDialogOpen}
          onOpenChange={setIsEditLogDialogOpen}
          logEntry={editingLogEntry}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}


    