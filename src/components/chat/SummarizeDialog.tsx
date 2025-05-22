
"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

interface SummarizeDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  summary: string | null;
  isLoading: boolean;
  channelName?: string;
}

export function SummarizeDialog({ isOpen, onOpenChange, summary, isLoading, channelName }: SummarizeDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Conversation Summary{channelName ? ` for #${channelName}` : ''}</DialogTitle>
          <DialogDescription>
            {isLoading ? "Generating summary, please wait..." : "Here's a summary of the recent discussion."}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-64 max-h-[60vh] pr-2">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/5" />
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap">{summary || "No summary available or an error occurred."}</p>
          )}
        </ScrollArea>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
