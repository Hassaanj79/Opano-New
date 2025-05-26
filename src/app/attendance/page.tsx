"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation'; // Added useParams
import { useAppContext } from '@/contexts/AppContext';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { UserAvatar } from '@/components/UserAvatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EditAttendanceLogDialog } from '@/components/dialogs/EditAttendanceLogDialog';
import { LeaveRequestDialog } from '@/components/dialogs/LeaveRequestDialog';
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar as CalendarIcon, MoreHorizontal, ArrowLeft, Users, Clock, Pause, Play, Coffee, CalendarDays, BarChart, FileText as ReportIcon, Edit2, Trash, PlusCircle, LogOut, Activity, Clock10, Percent } from "lucide-react";
import { format, differenceInSeconds, intervalToDuration, formatDuration, add, sub, isSameDay, startOfDay, endOfDay, isValid } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import type { AttendanceLogEntry, LeaveRequest } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/badge';


type AttendanceStatus = 'not-clocked-in' | 'working' | 'on-break' | 'clocked-out';

const WorkTimerDisplay = ({ currentSeconds, status }: { currentSeconds: number; status: AttendanceStatus }) => {
  const displayTime = formatDuration(intervalToDuration({ start: 0, end: currentSeconds * 1000 }), { format: ['hours', 'minutes', 'seconds'], zero: true, delimiter: ':' }).padStart(8, '0:00:');

  if (status === 'not-clocked-in' || status === 'clocked-out') {
    return (
      <div className="text-6xl md:text-7xl font-mono font-semibold text-muted-foreground my-8 tabular-nums">
        00:00:00
      </div>
    );
  }

  return (
    <div className="text-6xl md:text-7xl font-mono font-semibold text-foreground my-8 tabular-nums">
      {displayTime}
    </div>
  );
};


const InfoRow = ({ icon: Icon, label, value, valueClassName }: { icon: React.ElementType, label: string, value: string | React.ReactNode, valueClassName?: string }) => (
  <div className="flex items-center justify-between py-1.5">
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </div>
    <div className={cn("text-sm font-semibold text-foreground", valueClassName)}>{value}</div>
  </div>
);

export default function AttendancePage() {
  const router = useRouter();
  const { currentUser, isLoadingAuth } = useAppContext();
  const { toast } = useToast();

  const [status, setStatus] = useState<AttendanceStatus>('not-clocked-in');
  const [clockInTime, setClockInTime] = useState<Date | null>(null);
  const [clockOutTime, setClockOutTime] = useState<Date | null>(null);
  const [breakStartTime, setBreakStartTime] = useState<Date | null>(null);
  const [accumulatedBreakDuration, setAccumulatedBreakDuration] = useState(0); // in seconds
  const [workedSeconds, setWorkedSeconds] = useState(0);
  const lastTickRef = useRef<Date | null>(null);

  const [masterAttendanceLog, setMasterAttendanceLog] = useState<AttendanceLogEntry[]>([]);
  const [reportDateRange, setReportDateRange] = useState<DateRange | undefined>(undefined);
  const [displayedAttendanceLog, setDisplayedAttendanceLog] = useState<AttendanceLogEntry[]>([]);

  const [isEditLogDialogOpen, setIsEditLogDialogOpen] = useState(false);
  const [editingLogEntry, setEditingLogEntry] = useState<AttendanceLogEntry | null>(null);
  const [deletingLogEntryId, setDeletingLogEntryId] = useState<string | null>(null);

  const [isLeaveRequestDialogOpen, setIsLeaveRequestDialogOpen] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  
  const WORK_TARGET_SECONDS = 8 * 60 * 60; // 8 hours

  useEffect(() => {
    // Initialize reportDateRange to today on client mount to avoid hydration issues
    setReportDateRange({ from: startOfDay(new Date()), to: endOfDay(new Date()) });
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === 'working' && clockInTime) {
      lastTickRef.current = new Date(); 

      interval = setInterval(() => {
        setWorkedSeconds(prevSeconds => {
          const now = new Date();
          const currentLastTick = lastTickRef.current || now; 
          const secondsSinceLastTick = differenceInSeconds(now, currentLastTick);
          lastTickRef.current = now; 
          return prevSeconds + secondsSinceLastTick;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status, clockInTime]);


  useEffect(() => {
    if (reportDateRange?.from) {
      const fromDate = startOfDay(reportDateRange.from);
      const toDate = reportDateRange.to ? endOfDay(reportDateRange.to) : endOfDay(reportDateRange.from); // If no 'to' date, use 'from' date for single day
      
      const filtered = masterAttendanceLog.filter(entry => {
        const entryDate = startOfDay(new Date(entry.clockInTime));
        return entryDate >= fromDate && entryDate <= toDate;
      });
      setDisplayedAttendanceLog(filtered.sort((a, b) => new Date(b.clockInTime).getTime() - new Date(a.clockInTime).getTime()));
    } else {
      setDisplayedAttendanceLog([]); 
    }
  }, [masterAttendanceLog, reportDateRange]);


  const handleClockIn = () => {
    const now = new Date();
    setClockInTime(now);
    setClockOutTime(null);
    setStatus('working');
    setWorkedSeconds(0);
    setAccumulatedBreakDuration(0);
    setBreakStartTime(null);
    lastTickRef.current = now; 
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
    
    // Ensure workedSeconds calculation is correct before saving
    // If on break, the interval for workedSeconds is paused. 
    // If working, workedSeconds is up-to-date via the interval.
    // No additional calculation to workedSeconds needed here.
    
    setClockOutTime(now);
    setStatus('clocked-out');

    const newLogEntry: AttendanceLogEntry = {
      id: `log-${Date.now()}`,
      clockInTime: clockInTime,
      clockOutTime: now,
      totalHoursWorked: workedSeconds,
      totalActivityPercent: Math.floor(Math.random() * 41) + 60, 
      totalBreakDuration: finalAccumulatedBreak,
    };
    setMasterAttendanceLog(prevLog => [newLogEntry, ...prevLog]);
    toast({ title: "Clocked Out", description: `Session ended at ${format(now, "p")}.` });
  };

  const handleToggleBreak = () => {
    const now = new Date();
    if (status === 'working') {
      setBreakStartTime(now);
      setStatus('on-break');
      lastTickRef.current = null; 
      toast({ title: "Break Started", description: `Break started at ${format(now, "p")}.` });
    } else if (status === 'on-break' && breakStartTime) {
      const breakDuration = differenceInSeconds(now, breakStartTime);
      setAccumulatedBreakDuration(prev => prev + breakDuration);
      setBreakStartTime(null);
      setStatus('working');
      lastTickRef.current = now; 
      toast({ title: "Break Ended", description: `Resumed work at ${format(now, "p")}.` });
    }
  };
  
  const handleSaveEdit = (updatedEntry: AttendanceLogEntry) => {
    setMasterAttendanceLog(prev => prev.map(entry => entry.id === updatedEntry.id ? updatedEntry : entry));
    toast({ title: "Log Updated", description: "Attendance log entry successfully updated."});
  };

  const handleConfirmDelete = () => {
    if (deletingLogEntryId) {
      setMasterAttendanceLog(prev => prev.filter(entry => entry.id !== deletingLogEntryId));
      setDeletingLogEntryId(null);
      toast({ title: "Log Deleted", description: "Attendance log entry successfully deleted."});
    }
  };

  const handleAddLeaveRequest = (newRequestData: Omit<LeaveRequest, 'id' | 'userId' | 'requestDate' | 'status'>) => {
    if (!currentUser) return; // Should already be handled by page guard, but good practice
    
    const newRequest: LeaveRequest = {
      ...newRequestData,
      id: `leave-${Date.now()}`,
      userId: currentUser.id,
      requestDate: new Date(),
      status: 'pending',
    };
    setLeaveRequests(prev => [newRequest, ...prev]);
     toast({
        title: "Leave Request Submitted",
        description: `Your leave request has been submitted for approval.`,
    });
    // Email to admin logic can be re-added here if desired
  };

  const formatTimeWithZone = (date: Date | null) => date ? format(new Date(date), "hh:mm a") + " EST" : "--:-- -- EST";
  const formatDurationForDisplay = (seconds: number) => {
    const duration = intervalToDuration({ start: 0, end: seconds * 1000 });
    return formatDuration(duration, { format: ['hours', 'minutes', 'seconds'] }) || "0 seconds";
  };

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
  
  const getReportHeader = () => {
    if (!reportDateRange?.from) return "Select a date range to view report";
    const fromDate = format(reportDateRange.from, "dd-MMM-yyyy");
    if (!reportDateRange.to || isSameDay(reportDateRange.from, reportDateRange.to)) {
      return `Clock In / Clock Out Report of ${fromDate}`;
    }
    return `Clock In / Clock Out Report for ${fromDate} to ${format(reportDateRange.to, "dd-MMM-yyyy")}`;
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-theme(spacing.16))] bg-muted/30 p-4 md:p-6 w-full overflow-y-auto">
      {/* Header Section */}
      <div className="relative flex items-center justify-between mb-6 md:mb-8 border-b pb-4">
        <Button 
            variant="outline" 
            onClick={() => router.back()} 
            className="h-auto py-1.5 px-3 rounded-full border-primary text-primary hover:bg-primary/10"
        >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div className="flex flex-col items-center">
          <UserAvatar user={currentUser} className="h-12 w-12 mb-1" />
          <h1 className="text-xl font-semibold text-foreground">{currentUser.name}</h1>
          <p className="text-xs text-muted-foreground">{currentUser.designation || 'No designation'}</p>
        </div>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full border border-primary text-primary hover:bg-primary/10 hover:text-primary h-9 w-9"
            >
                <MoreHorizontal className="h-5 w-5" />
            </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => toast({ title: "Analytics (Coming Soon)", description: "Detailed attendance analytics will be available soon." })}>
                <BarChart className="mr-2 h-4 w-4" /> Analytics
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast({ title: "Reports (Coming Soon)", description: "Downloadable reports will be available soon." })}>
                <ReportIcon className="mr-2 h-4 w-4" /> Reports
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsLeaveRequestDialogOpen(true)}>
                <CalendarDays className="mr-2 h-4 w-4" /> Leave request
            </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Main Timer and Actions Section */}
      <div className="flex flex-col items-center gap-3 md:gap-4 py-6">
        <WorkTimerDisplay currentSeconds={workedSeconds} status={status} />
        
        <div className="mb-4">{getStatusBadge()}</div>

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

        <div className="flex items-center gap-4 mt-6">
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

      {/* Attendance Report Section */}
      <div className="mt-10 pt-6 border-t">
        <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
          <h2 className="text-lg font-semibold text-foreground">
            {getReportHeader()}
          </h2>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn("w-full sm:w-[260px] justify-start text-left font-normal", !reportDateRange?.from && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {reportDateRange?.from ? (
                    reportDateRange.to ? (
                    <>
                        {format(reportDateRange.from, "LLL dd, y")} - {format(reportDateRange.to, "LLL dd, y")}
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
        {reportDateRange?.from && displayedAttendanceLog.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee Name</TableHead>
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
                      <UserAvatar user={currentUser} className="h-8 w-8" />
                      <div>
                        <div className="font-medium">{currentUser.name}</div>
                        <div className="text-xs text-muted-foreground">{currentUser.designation}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{formatTimeWithZone(log.clockInTime)}</TableCell>
                  <TableCell>{formatTimeWithZone(log.clockOutTime)}</TableCell>
                  <TableCell>{formatDurationForDisplay(log.totalBreakDuration || 0)}</TableCell>
                  <TableCell>{formatDurationForDisplay(log.totalHoursWorked)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
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
                        <AlertDialogFooter><AlertDialogCancel onClick={() => setDeletingLogEntryId(null)}>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleConfirmDelete}>Delete</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
           <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
            <Clock className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <p className="font-medium text-lg">
              {reportDateRange?.from ? `No attendance records for the selected period.` : "Please select a date range to view the report."}
            </p>
          </div>
        )}
      </div>

      {/* Leave Requests Section */}
      <div className="mt-10 pt-6 border-t">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-foreground">My Leave Requests</h2>
            <Button variant="outline" size="sm" onClick={() => setIsLeaveRequestDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" /> New Leave Request
            </Button>
        </div>
         {leaveRequests.length > 0 ? (
            <div className="space-y-3">
            {leaveRequests.map(req => {
                const durationDays = differenceInSeconds(endOfDay(req.endDate), startOfDay(req.startDate)) / (60 * 60 * 24) + 1;
                const durationString = `${durationDays} day${durationDays > 1 ? 's' : ''}`;
                
                let statusBadgeClass = "bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200";
                if (req.status === 'approved') statusBadgeClass = "bg-green-100 text-green-800 border-green-300 hover:bg-green-200";
                if (req.status === 'rejected') statusBadgeClass = "bg-red-100 text-red-800 border-red-300 hover:bg-red-200";


                return (
                <div key={req.id} className="p-3 rounded-md bg-muted/40 border hover:shadow-sm transition-shadow">
                    <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-x-4 gap-y-2 text-sm">
                        <div><span className="font-medium text-muted-foreground text-xs block">Request Date</span>{format(req.requestDate, "MMM d, yyyy")}</div>
                        <div><span className="font-medium text-muted-foreground text-xs block">Start Date</span>{format(req.startDate, "MMM d, yyyy")}</div>
                        <div><span className="font-medium text-muted-foreground text-xs block">End Date</span>{format(req.endDate, "MMM d, yyyy")}</div>
                        <div><span className="font-medium text-muted-foreground text-xs block">Duration</span>{durationString}</div>
                        <div className="md:text-right"><span className="font-medium text-muted-foreground text-xs block md:hidden">Status</span><Badge variant="outline" className={cn("text-xs capitalize py-0.5 px-2", statusBadgeClass)}>{req.status}</Badge></div>
                        <div className="sm:col-span-3 md:col-span-5 mt-1"><span className="font-medium text-muted-foreground text-xs block">Reason</span><p className="truncate text-foreground/90" title={req.reason}>{req.reason}</p></div>
                    </div>
                </div>
                );
            })}
            </div>
        ) : (
            <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                <CalendarDays className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                <p className="font-medium text-lg">No leave requests submitted yet.</p>
            </div>
        )}
      </div>

      {/* Dialogs */}
      {editingLogEntry && (
        <EditAttendanceLogDialog
          isOpen={isEditLogDialogOpen}
          onOpenChange={setIsEditLogDialogOpen}
          logEntry={editingLogEntry}
          onSave={handleSaveEdit}
        />
      )}
       <LeaveRequestDialog
        isOpen={isLeaveRequestDialogOpen}
        onOpenChange={setIsLeaveRequestDialogOpen}
        onAddLeaveRequest={handleAddLeaveRequest}
        currentUserName={currentUser.name}
      />
    </div>
  );
}
