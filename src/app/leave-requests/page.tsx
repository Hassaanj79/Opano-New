
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, PlusCircle, CalendarDays, LogOut } from "lucide-react";
import { format, differenceInSeconds, intervalToDuration, formatDuration, startOfDay, endOfDay } from "date-fns";
import type { LeaveRequest } from '@/types';
import { LeaveRequestDialog } from '@/components/dialogs/LeaveRequestDialog';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { cn } from "@/lib/utils";

export default function LeaveRequestsPage() {
  const router = useRouter();
  const { currentUser, isLoadingAuth, leaveRequests, handleAddLeaveRequest } = useAppContext();
  const [isLeaveRequestDialogOpen, setIsLeaveRequestDialogOpen] = useState(false);

  // Filter leave requests for the current user
  // Ensure leaveRequests is an array before trying to filter
  const safeLeaveRequests = Array.isArray(leaveRequests) ? leaveRequests : [];
  const userLeaveRequests = currentUser
    ? safeLeaveRequests.filter(req => req.userId === currentUser.id).sort((a,b) => b.requestDate.getTime() - a.requestDate.getTime())
    : [];

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
        <p className="text-muted-foreground">Sign in to access your leave requests.</p>
         <Button onClick={() => router.push('/auth/join')} className="mt-4">
            Go to Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-theme(spacing.16))] bg-muted/30 p-4 md:p-6 w-full">
      <div className="mb-6 flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <Button
              variant="outline"
              onClick={() => router.back()}
              className="h-auto py-1.5 px-3 rounded-full border-primary text-primary hover:bg-primary/10 flex-shrink-0"
          >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-foreground">My Leave Requests</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              View your submitted leave requests and submit new ones.
            </p>
          </div>
        </div>
        <Button variant="outline" size="default" onClick={() => setIsLeaveRequestDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> New Leave Request
        </Button>
      </div>

      <Card className="flex-grow">
        <CardHeader>
          <CardTitle>Submitted Requests</CardTitle>
          <CardDescription>
            You have {userLeaveRequests.length} leave request(s).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {userLeaveRequests.length > 0 ? (
            <div className="space-y-3">
            {userLeaveRequests.map(req => {
                const durationMs = endOfDay(req.endDate).getTime() - startOfDay(req.startDate).getTime();
                // +1 to make duration inclusive of start and end days
                const durationDays = Math.max(1, Math.floor(durationMs / (1000 * 60 * 60 * 24)) + 1); 
                const durationString = `${durationDays} day${durationDays !== 1 ? 's' : ''}`;

                let statusBadgeClass = "bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200"; // Default to pending
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
        </CardContent>
      </Card>

      <LeaveRequestDialog
        isOpen={isLeaveRequestDialogOpen}
        onOpenChange={setIsLeaveRequestDialogOpen}
        onAddLeaveRequest={handleAddLeaveRequest}
        currentUserName={currentUser.name}
      />
    </div>
  );
}
