
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Document } from '@/types';

interface ViewDocumentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  document: Document | null;
}

export function ViewDocumentDialog({ isOpen, onOpenChange, document }: ViewDocumentDialogProps) {
  if (!document) { // Removed !document.fileUrl check as text documents might not have it
    return null;
  }

  const isImage = document.docType === 'file' && document.fileUrl && document.type.startsWith('image/');
  const isPdf = document.docType === 'file' && document.fileUrl && document.type === 'application/pdf';
  // Text document viewing is handled by toast in CategoryDetailPage

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl h-[85vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b sticky top-0 bg-background z-10">
          <DialogTitle>{document.name}</DialogTitle>
        </DialogHeader>
        <div className="flex-grow overflow-auto p-1"> {/* Reduced padding for content area */}
          {isImage && document.fileUrl && ( // Check fileUrl again for type safety
            <div className="flex justify-center items-center h-full">
              <img 
                src={document.fileUrl} 
                alt={document.name} 
                className="max-w-full max-h-full object-contain" 
              />
            </div>
          )}
          {isPdf && document.fileUrl && ( // Check fileUrl again for type safety
            <iframe
              src={document.fileUrl}
              width="100%"
              height="100%"
              title={document.name}
              className="border-0"
            />
          )}
          {/* If document is neither image nor PDF but somehow opened this dialog, 
              this area will be blank. This case should be handled by handleDocumentClick. */}
        </div>
      </DialogContent>
    </Dialog>
  );
}
