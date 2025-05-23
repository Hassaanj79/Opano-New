
"use client";

import React, { useEffect } from 'react';
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { AttendanceLogEntry } from '@/types';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, parse, setHours, setMinutes, setSeconds, isValid } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from '@/hooks/use-toast';

interface EditAttendanceLogDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  logEntry: AttendanceLogEntry | null;
  onSave: (updatedEntry: AttendanceLogEntry) => void;
}

const timeStringToDate = (datePart: Date, timeString: string): Date | null => {
  if (!timeString) return null;
  const [hours, minutes] = timeString.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null; // Invalid time format
  }
  let newDate = setHours(datePart, hours);
  newDate = setMinutes(newDate, minutes);
  newDate = setSeconds(newDate, 0); // reset seconds
  return newDate;
};

const editLogSchema = z.object({
  clockInDate: z.date({ required_error: "Clock-in date is required." }),
  clockInTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Invalid time format (HH:MM)" }),
  clockOutDate: z.date({ required_error: "Clock-out date is required." }),
  clockOutTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Invalid time format (HH:MM)" }),
}).refine(data => {
    const clockInDateTime = timeStringToDate(data.clockInDate, data.clockInTime);
    const clockOutDateTime = timeStringToDate(data.clockOutDate, data.clockOutTime);
    return clockInDateTime && clockOutDateTime && clockOutDateTime >= clockInDateTime;
}, {
  message: "Clock-out time must be after clock-in time.",
  path: ["clockOutTime"], // You can also use a general path or "clockOutDate"
});


type EditLogFormValues = z.infer<typeof editLogSchema>;

export function EditAttendanceLogDialog({ isOpen, onOpenChange, logEntry, onSave }: EditAttendanceLogDialogProps) {
  const { toast } = useToast();
  const form = useForm<EditLogFormValues>({
    resolver: zodResolver(editLogSchema),
    defaultValues: {
      clockInDate: new Date(),
      clockInTime: "09:00",
      clockOutDate: new Date(),
      clockOutTime: "17:00",
    },
  });

  useEffect(() => {
    if (logEntry && isOpen) {
      form.reset({
        clockInDate: new Date(logEntry.clockInTime),
        clockInTime: format(new Date(logEntry.clockInTime), "HH:mm"),
        clockOutDate: new Date(logEntry.clockOutTime),
        clockOutTime: format(new Date(logEntry.clockOutTime), "HH:mm"),
      });
    }
  }, [logEntry, isOpen, form]);

  const onSubmit = (data: EditLogFormValues) => {
    if (!logEntry) return;

    const newClockInTime = timeStringToDate(data.clockInDate, data.clockInTime);
    const newClockOutTime = timeStringToDate(data.clockOutDate, data.clockOutTime);

    if (!newClockInTime || !newClockOutTime) {
        toast({ title: "Invalid Time", description: "Please ensure times are valid.", variant: "destructive"});
        return;
    }
    
    if (newClockOutTime < newClockInTime) {
        form.setError("clockOutTime", { type: "manual", message: "Clock-out time must be after clock-in time." });
        return;
    }

    const totalHoursWorked = Math.max(0, Math.floor((newClockOutTime.getTime() - newClockInTime.getTime()) / 1000));

    onSave({
      ...logEntry,
      clockInTime: newClockInTime,
      clockOutTime: newClockOutTime,
      totalHoursWorked: totalHoursWorked, // Recalculate based on new times
      // totalActivityPercent remains unchanged unless you want to allow editing it too
    });
    onOpenChange(false);
  };
  
  const handleDialogClose = (open: boolean) => {
    if (!open) {
        form.reset(); // Reset form on close
    }
    onOpenChange(open);
  }


  if (!logEntry) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Edit Attendance Log</DialogTitle>
            <DialogDescription>
              Modify the clock-in and clock-out times for this entry.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Clock In Date and Time */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <Label htmlFor="clockInDate">Clock In Date</Label>
                     <Controller
                        control={form.control}
                        name="clockInDate"
                        render={({ field }) => (
                            <Popover>
                                <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !field.value && "text-muted-foreground"
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
                                    initialFocus
                                />
                                </PopoverContent>
                            </Popover>
                        )}
                    />
                    {form.formState.errors.clockInDate && <p className="text-xs text-destructive">{form.formState.errors.clockInDate.message}</p>}
                </div>
                 <div className="space-y-1">
                    <Label htmlFor="clockInTime">Clock In Time (HH:MM)</Label>
                    <Input 
                        id="clockInTime" 
                        type="time" 
                        {...form.register("clockInTime")}
                        className={form.formState.errors.clockInTime ? "border-destructive" : ""}
                    />
                     {form.formState.errors.clockInTime && <p className="text-xs text-destructive">{form.formState.errors.clockInTime.message}</p>}
                </div>
            </div>

            {/* Clock Out Date and Time */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <Label htmlFor="clockOutDate">Clock Out Date</Label>
                     <Controller
                        control={form.control}
                        name="clockOutDate"
                        render={({ field }) => (
                            <Popover>
                                <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !field.value && "text-muted-foreground"
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
                                    initialFocus
                                />
                                </PopoverContent>
                            </Popover>
                        )}
                    />
                    {form.formState.errors.clockOutDate && <p className="text-xs text-destructive">{form.formState.errors.clockOutDate.message}</p>}
                </div>
                 <div className="space-y-1">
                    <Label htmlFor="clockOutTime">Clock Out Time (HH:MM)</Label>
                    <Input 
                        id="clockOutTime" 
                        type="time" 
                        {...form.register("clockOutTime")}
                        className={form.formState.errors.clockOutTime ? "border-destructive" : ""}
                    />
                    {form.formState.errors.clockOutTime && <p className="text-xs text-destructive">{form.formState.errors.clockOutTime.message}</p>}
                </div>
            </div>
             {form.formState.errors.root && <p className="text-xs text-destructive pt-2">{form.formState.errors.root.message}</p>}

          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={() => handleDialogClose(false)}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
