
"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea';
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { LeaveRequest } from '@/types'; // Use global types
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { CalendarIcon, Send } from "lucide-react";
import { format, isToday, isAfter, startOfDay } from "date-fns"; // Added startOfDay
import { cn } from "@/lib/utils";
import { useToast } from '@/hooks/use-toast';

interface LeaveRequestDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAddLeaveRequest: (newRequestData: Omit<LeaveRequest, 'id' | 'userId' | 'requestDate' | 'status'>) => void;
  currentUserName: string;
}

const leaveRequestSchema = z.object({
  startDate: z.date({ required_error: "Start date is required." }).refine(date => isToday(date) || isAfter(date, new Date()), {
    message: "Start date must be today or a future date.",
  }),
  endDate: z.date({ required_error: "End date is required." }),
  reason: z.string().min(10, { message: "Reason must be at least 10 characters long." }).max(200, {message: "Reason must be 200 characters or less."}),
}).refine(data => data.endDate >= data.startDate, {
  message: "End date cannot be before start date.",
  path: ["endDate"],
});

type LeaveRequestFormValues = z.infer<typeof leaveRequestSchema>;

export function LeaveRequestDialog({ isOpen, onOpenChange, onAddLeaveRequest, currentUserName }: LeaveRequestDialogProps) {
  const { toast } = useToast();
  const form = useForm<LeaveRequestFormValues>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: {
      startDate: new Date(),
      endDate: new Date(),
      reason: "",
    },
  });

  const onSubmit = (data: LeaveRequestFormValues) => {
    onAddLeaveRequest({
      startDate: data.startDate,
      endDate: data.endDate,
      reason: data.reason,
    });
    toast({
        title: "Leave Request Submitted",
        description: `Your leave request for ${currentUserName} has been submitted for approval.`,
    });
    form.reset();
    onOpenChange(false);
  };
  
  const handleDialogClose = (open: boolean) => {
    if (!open) {
      form.reset();
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Request Time Off</DialogTitle>
            <DialogDescription>
              Fill in the details for your leave request. It will be submitted for approval.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="startDate">Start Date</Label>
                 <Controller
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground",
                                form.formState.errors.startDate && "border-destructive"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < startOfDay(new Date()) && !isToday(date)}
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                    )}
                />
                {form.formState.errors.startDate && <p className="text-xs text-destructive">{form.formState.errors.startDate.message}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="endDate">End Date</Label>
                <Controller
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground",
                                form.formState.errors.endDate && "border-destructive"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => 
                                    (form.getValues("startDate") && date < form.getValues("startDate")) ||
                                    (date < startOfDay(new Date()) && !isToday(date))
                                }
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                    )}
                />
                {form.formState.errors.endDate && <p className="text-xs text-destructive">{form.formState.errors.endDate.message}</p>}
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                {...form.register("reason")}
                placeholder="Please provide a reason for your leave (min. 10 characters)"
                className={cn("min-h-[100px]", form.formState.errors.reason && "border-destructive")}
              />
              {form.formState.errors.reason && <p className="text-xs text-destructive">{form.formState.errors.reason.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">
                <Send className="mr-2 h-4 w-4"/>
                Submit Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

