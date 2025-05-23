
"use client";

import React, { useState, useRef } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import type { DocumentCategory } from '@/app/documents/page'; 
import { UploadCloud, FileUp } from 'lucide-react';

interface AddDocumentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  category: DocumentCategory;
  onAddDocument: (categoryId: string, file: File) => void; // This specifically handles file uploads
}

export function AddDocumentDialog({ isOpen, onOpenChange, category, onAddDocument }: AddDocumentDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const resetForm = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; 
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }
    onAddDocument(category.id, selectedFile); // This callback is for file uploads
    resetForm();
    onOpenChange(false); 
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Upload File to "{category.name}"</DialogTitle>
            <DialogDescription>
              Select a file from your computer to upload to this category.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-6">
            <div className="space-y-2">
              <Label htmlFor="document-file" className="text-sm font-medium">
                Choose File
              </Label>
              <Input
                id="document-file"
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="text-sm file:mr-3 file:py-2 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
              />
              {selectedFile && (
                <p className="text-xs text-muted-foreground mt-1.5">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-center gap-2 text-muted-foreground"
              onClick={() => toast({ title: "Google Drive (Coming Soon)", description: "Attaching files from Google Drive will be available in a future update."})}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.464 7.5H4.536L2 12.5l2.536 5h14.928l2.536-5-2.536-5zM8.733 15L6 10h3.267l2.733 5H8.733zm3.805-5h2.924l-1.462 2.5-1.462-2.5zm3.729 5H13l2.733-5H18l-2.733 5z" />
              </svg>
              Attach from Google Drive (Coming Soon)
            </Button>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!selectedFile}>
              <FileUp className="mr-2 h-4 w-4" />
              Upload File
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

    