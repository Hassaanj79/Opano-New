
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { UserAvatar } from '@/components/UserAvatar';
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EditAttendanceLogDialog } from '@/components/dialogs/EditAttendanceLogDialog';
import { LeaveRequestDialog } from '@/components/dialogs/LeaveRequestDialog';
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar as CalendarIcon, MoreHorizontal, ArrowLeft, Users, Clock, Pause, Play, Coffee, CalendarDays, BarChart, FileText as ReportIcon, Edit2, Trash, PlusCircle, LogOut } from "lucide-react";
import { format, differenceInSeconds, intervalToDuration, formatDuration, add, sub, isSameDay, startOfDay, endOfDay, isValid } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import type { AttendanceLogEntry, LeaveRequest } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/badge';


type AttendanceStatus = 'not-clocked-in' | 'working' | 'on-break' | 'clocked-out';

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
  const lastTickRef = useRef<Date | null>(null); // Changed to useRef

  const [masterAttendanceLog, setMasterAttendanceLog] = useState<AttendanceLogEntry[]>([]);
  const [reportDate, setReportDate] = useState<Date | undefined>(undefined);
  const [displayedAttendanceLog, setDisplayedAttendanceLog] = useState<AttendanceLogEntry[]>([]);

  const [isEditLogDialogOpen, setIsEditLogDialogOpen] = useState(false);
  const [editingLogEntry, setEditingLogEntry] = useState<AttendanceLogEntry | null>(null);
  const [deletingLogEntryId, setDeletingLogEntryId] = useState<string | null>(null);

  const [isLeaveRequestDialogOpen, setIsLeaveRequestDialogOpen] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  
  const WORK_TARGET_SECONDS = 8 * 60 * 60; // 8 hours

  useEffect(() => {
    setReportDate(new Date());
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === 'working' && clockInTime) {
      lastTickRef.current = new Date(); // Initialize ref

      interval = setInterval(() => {
        setWorkedSeconds(prevSeconds => {
          const now = new Date();
          const currentLastTick = lastTickRef.current || now; // Use ref's current value
          const secondsSinceLastTick = differenceInSeconds(now, currentLastTick);
          lastTickRef.current = now; // Update ref's current value
          return prevSeconds + secondsSinceLastTick;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status, clockInTime]); // Removed lastTick from dependencies


  useEffect(() => {
    if (reportDate) { 
      const filtered = masterAttendanceLog.filter(entry => 
        isSameDay(new Date(entry.clockInTime), reportDate)
      );
      setDisplayedAttendanceLog(filtered.sort((a, b) => new Date(b.clockInTime).getTime() - new Date(a.clockInTime).getTime()));
    } else {
      setDisplayedAttendanceLog([]); 
    }
  }, [masterAttendanceLog, reportDate]);


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
    // No need to update workedSeconds here, interval would have stopped or state is final
    
    if (status === 'on-break' && breakStartTime) { 
      const breakDuration = differenceInSeconds(now, breakStartTime);
      setAccumulatedBreakDuration(prev => prev + breakDuration);
    }
    
    setClockOutTime(now);
    setStatus('clocked-out');

    const newLogEntry: AttendanceLogEntry = {
      id: `log-${Date.now()}`,
      clockInTime: clockInTime,
      clockOutTime: now,
      totalHoursWorked: workedSeconds, // Use the final workedSeconds
      totalActivityPercent: Math.floor(Math.random() * 41) + 60, 
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
    if (!currentUser) return;
    const newRequest: LeaveRequest = {
      ...newRequestData,
      id: `leave-${Date.now()}`,
      userId: currentUser.id,
      requestDate: new Date(),
      status: 'pending',
    };
    setLeaveRequests(prev => [newRequest, ...prev]);
  };

  const formatTime = (date: Date | null) => date ? format(new Date(date), "hh:mm a") + " EST" : "--:-- -- EST";
  const formatWorkedDuration = (seconds: number) => {
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
  
  const progressPercentage = Math.min(100, (workedSeconds / WORK_TARGET_SECONDS) * 100);

  return (
    <div className="flex flex-col min-h-[calc(100vh-theme(spacing.16))] bg-muted/30 p-4 md:p-6 w-full overflow-y-auto">
      <div className="relative flex items-center justify-between mb-6 md:mb-8">
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

      {status !== 'clocked-out' ? (
        <div className="flex flex-col items-center gap-6 md:gap-8 flex-grow justify-center">
          <div className="relative w-56 h-56 md:w-72 md:h-72">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle className="text-gray-200 stroke-current" strokeWidth="6" cx="50" cy="50" r="44" fill="transparent"></circle>
              <circle
                className="text-primary stroke-current"
                strokeWidth="6"
                strokeLinecap="round"
                cx="50"
                cy="50"
                r="44"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 44}
                strokeDashoffset={2 * Math.PI * 44 * (1 - progressPercentage / 100)}
                transform="rotate(-90 50 50)"
              ></circle>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-foreground text-background shadow-inner">
              <div className="text-3xl md:text-5xl font-mono font-semibold">
                {formatDuration(intervalToDuration({ start: 0, end: workedSeconds * 1000 }), { format: ['hours', 'minutes', 'seconds'], zero: true,  delimiter: ':'}).padStart(8, '0:00:')}
              </div>
              <div className="text-xs text-muted-foreground/80 mt-1">Worked Today</div>
            </div>
          </div>

          <div className="flex items-center justify-around w-full max-w-md">
            <div className="text-center">
              <div className="text-xs text-muted-foreground">CLOCK IN AT</div>
              <div className="text-lg font-semibold text-foreground">{clockInTime ? format(clockInTime, "hh:mm a") : "--:--"}</div>
              <div className="text-xs text-muted-foreground">EST</div>
            </div>
            <div className="flex flex-col items-center gap-4">
              <Button 
                variant="outline" 
                className="rounded-full border-primary text-primary bg-foreground text-background hover:bg-primary/90 hover:text-primary-foreground w-20 h-20 md:w-24 md:h-24 text-base"
                onClick={handleToggleBreak}
                disabled={status === 'not-clocked-in'}
              >
                {status === 'on-break' ? <Play className="h-6 w-6 md:h-8 md:w-8" /> : <Pause className="h-6 w-6 md:h-8 md:w-8" />}
              </Button>
              <span className="text-xs font-medium text-muted-foreground">{status === 'on-break' ? 'RESUME' : 'BREAK'}</span>
            </div>
            <Button 
                variant="destructive" 
                className="rounded-full border-destructive bg-foreground text-background hover:bg-destructive/90 hover:text-destructive-foreground w-20 h-20 md:w-24 md:h-24 text-base"
                onClick={handleClockOut}
                disabled={status === 'not-clocked-in'}
            >
                STOP
            </Button>
          </div>
           <div className="text-center mt-2">
              <div className="text-xs text-muted-foreground">Total Break</div>
              <div className="text-base font-semibold text-foreground">
                {formatDuration(intervalToDuration({ start: 0, end: accumulatedBreakDuration * 1000 }), { format: ['minutes', 'seconds'] }) || "0 min"}
              </div>
            </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center flex-grow gap-6 p-6 bg-card rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold text-foreground">Session Ended</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-center">
            <InfoRow icon={Clock} label="Clocked In At" value={formatTime(clockInTime)} />
            <InfoRow icon={LogOut} label="Clocked Out At" value={formatTime(clockOutTime)} />
            <InfoRow icon={Coffee} label="Total Break Time" value={formatWorkedDuration(accumulatedBreakDuration)} />
            <InfoRow icon={Users} label="Total Work Time" value={formatWorkedDuration(workedSeconds)} />
          </div>
          <Button onClick={handleClockIn} size="lg" className="mt-4">
            Start New Session
          </Button>
        </div>
      )}
      {status === 'not-clocked-in' && (
         <div className="flex flex-col items-center justify-center flex-grow gap-4">
             <p className="text-lg text-muted-foreground">You are not clocked in.</p>
            <Button onClick={handleClockIn} size="lg" className="w-48">
                <Clock className="mr-2 h-5 w-5" /> Clock In
            </Button>
        </div>
      )}

      <div className="mt-10 pt-6 border-t">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            {reportDate ? `Clock In / Clock Out Report of ${format(reportDate, "dd-MMM-yyyy")}` : "Select a date to view report"}
          </h2>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn("w-[220px] justify-start text-left font-normal", !reportDate && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {reportDate ? format(reportDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={reportDate}
                onSelect={(date) => date && setReportDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        {reportDate && displayedAttendanceLog.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee Name</TableHead>
                <TableHead>Clock In Time</TableHead>
                <TableHead>Clock Out Time</TableHead>
                <TableHead>Total Hours Work</TableHead>
                <TableHead>Total Activity</TableHead>
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
                  <TableCell>{formatTime(log.clockInTime)}</TableCell>
                  <TableCell>{formatTime(log.clockOutTime)}</TableCell>
                  <TableCell>{formatWorkedDuration(log.totalHoursWorked)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={log.totalActivityPercent} className="w-20 h-2" />
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
              {reportDate ? `No attendance records for ${format(reportDate, "PPP")}.` : "Please select a date to view the report."}
            </p>
          </div>
        )}
      </div>

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
                let statusBadgeClass = "bg-yellow-100 text-yellow-700 border-yellow-300";
                if (req.status === 'approved') statusBadgeClass = "bg-green-100 text-green-700 border-green-300";
                if (req.status === 'rejected') statusBadgeClass = "bg-red-100 text-red-700 border-red-300";

                return (
                <div key={req.id} className="p-3 rounded-md bg-muted/40 border">
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-x-4 gap-y-2 text-sm">
                        <div><span className="font-medium text-muted-foreground text-xs block">Request Date</span>{format(req.requestDate, "MMM d, yyyy")}</div>
                        <div><span className="font-medium text-muted-foreground text-xs block">Start Date</span>{format(req.startDate, "MMM d, yyyy")}</div>
                        <div><span className="font-medium text-muted-foreground text-xs block">End Date</span>{format(req.endDate, "MMM d, yyyy")}</div>
                        <div><span className="font-medium text-muted-foreground text-xs block">Duration</span>{durationString}</div>
                        <div><span className="font-medium text-muted-foreground text-xs block">Status</span><Badge variant="outline" className={cn("text-xs capitalize", statusBadgeClass)}>{req.status}</Badge></div>
                        <div className="sm:col-span-5"><span className="font-medium text-muted-foreground text-xs block">Reason</span><p className="truncate" title={req.reason}>{req.reason}</p></div>
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

// Helper component for info rows
const InfoRow = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string }) => (
  <>
    <div className="text-muted-foreground flex items-center gap-1.5 text-xs sm:text-sm"><Icon className="h-3.5 w-3.5"/>{label}</div>
    <div className="font-semibold text-foreground text-sm sm:text-base">{value}</div>
  </>
);

