
"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CheckCircle, XCircle, AlertTriangle, Hourglass } from 'lucide-react';
import { OpanoLogo } from '@/components/OpanoLogo';
import { cn } from '@/lib/utils'; // Added this import

function LeaveActionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { approveLeaveRequest, declineLeaveRequest, currentUser, isLoadingAuth, leaveRequests } = useAppContext();

  const [status, setStatus] = useState<'loading' | 'prompt_reason' | 'success' | 'error' | 'processed'>('loading');
  const [message, setMessage] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [requestId, setRequestId] = useState<string | null>(null);
  const [action, setAction] = useState<string | null>(null);

  useEffect(() => {
    const reqId = searchParams.get('requestId');
    const act = searchParams.get('action');
    setRequestId(reqId);
    setAction(act);

    if (isLoadingAuth) {
      setStatus('loading');
      setMessage('Authenticating...');
      return;
    }

    if (!currentUser) {
      setStatus('error');
      setMessage('You must be logged in to perform this action. Please log in and try the link again.');
      return;
    }
    
    if (currentUser.role !== 'admin') {
      setStatus('error');
      setMessage('Access Denied: Only administrators can approve or decline leave requests.');
      return;
    }

    if (reqId && act) {
      const leaveRequestExists = leaveRequests.find(lr => lr.id === reqId);
      if (!leaveRequestExists) {
        setStatus('error');
        setMessage(`Leave request with ID ${reqId} not found.`);
        return;
      }
      if (leaveRequestExists.status !== 'pending') {
        setStatus('processed');
        setMessage(`This leave request has already been ${leaveRequestExists.status}. No further action needed.`);
        return;
      }

      if (act === 'approve') {
        approveLeaveRequest(reqId, 'Approved via email link.');
        setStatus('success');
        setMessage('Leave request has been approved.');
      } else if (act === 'decline') {
        setStatus('prompt_reason');
        setMessage('Please provide a reason for declining this request.');
      } else {
        setStatus('error');
        setMessage('Invalid action specified in the link.');
      }
    } else {
      setStatus('error');
      setMessage('Missing required information (request ID or action) in the link.');
    }
  }, [searchParams, approveLeaveRequest, declineLeaveRequest, currentUser, isLoadingAuth, leaveRequests]);

  const handleDeclineSubmit = () => {
    if (requestId && reason.trim()) {
      declineLeaveRequest(requestId, reason.trim());
      setStatus('success');
      setMessage('Leave request has been declined with the provided reason.');
    } else if (!reason.trim()) {
      setMessage('Reason cannot be empty. Please provide a reason for declining.');
    }
  };

  const getIcon = () => {
    if (status === 'loading') return <Hourglass className="h-12 w-12 text-primary" />;
    if (status === 'success') return <CheckCircle className="h-12 w-12 text-green-500" />;
    if (status === 'error' || status === 'processed') return <AlertTriangle className="h-12 w-12 text-red-500" />;
    if (status === 'prompt_reason') return <XCircle className="h-12 w-12 text-yellow-500" />;
    return <Hourglass className="h-12 w-12 text-muted-foreground" />;
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center p-6 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center">
          <OpanoLogo />
          <CardTitle className="text-2xl mt-4">Leave Request Action</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            {getIcon()}
          </div>
          
          {isLoadingAuth && status === 'loading' ? (
            <div className="flex flex-col items-center">
                <LoadingSpinner size="lg" />
                <p className="text-muted-foreground mt-2">{message || "Loading..."}</p>
            </div>
          ) : message && (
            <p className={cn(
                "text-sm",
                status === 'error' && "text-destructive",
                status === 'success' && "text-green-600",
                status === 'processed' && "text-blue-600",
            )}>
            {message}
            </p>
          )}

          {status === 'prompt_reason' && (
            <div className="space-y-2 text-left">
              <Label htmlFor="declineReason">Reason for Decline</Label>
              <Textarea
                id="declineReason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason here..."
                className="min-h-[100px]"
              />
              <Button onClick={handleDeclineSubmit} className="w-full mt-2">Submit Reason & Decline</Button>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={() => router.push('/')} className="w-full" variant="outline">
            Go to Homepage
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function LeaveActionPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><LoadingSpinner size="lg"/></div>}>
            <LeaveActionContent />
        </Suspense>
    );
}
