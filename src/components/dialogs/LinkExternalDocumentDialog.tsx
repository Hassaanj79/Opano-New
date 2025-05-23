
"use client";

import React, { useState } from 'react';
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
import { Link as LinkIcon } from 'lucide-react';

interface LinkExternalDocumentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  category: DocumentCategory;
  onAddLinkedDocument: (categoryId: string, docName: string, docUrl: string) => void;
}

export function LinkExternalDocumentDialog({ isOpen, onOpenChange, category, onAddLinkedDocument }: LinkExternalDocumentDialogProps) {
  const [documentName, setDocumentName] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const { toast } = useToast();

  const resetForm = () => {
    setDocumentName('');
    setDocumentUrl('');
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!documentName.trim()) {
      toast({
        title: "Document Name Required",
        description: "Please enter a name for the linked document.",
        variant: "destructive",
      });
      return;
    }
    if (!documentUrl.trim()) {
        toast({
           title: "Document URL Required",
           description: "Please enter the URL for the external document.",
           variant: "destructive",
       });
       return;
   }
   // Basic URL validation (can be more sophisticated)
   try {
       new URL(documentUrl.trim());
   } catch (_) {
       toast({
           title: "Invalid URL",
           description: "Please enter a valid URL (e.g., https://example.com).",
           variant: "destructive",
       });
       return;
   }

    onAddLinkedDocument(category.id, documentName.trim(), documentUrl.trim());
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
            <DialogTitle>Link External Document in "{category.name}"</DialogTitle>
            <DialogDescription>
              Enter a name and the URL for the external document (e.g., Google Doc, Notion page).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1">
              <Label htmlFor="link-document-name">Document Name</Label>
              <Input
                id="link-document-name"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                placeholder="e.g., Project Plan (Google Doc)"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="link-document-url">Document URL</Label>
              <Input
                id="link-document-url"
                type="url"
                value={documentUrl}
                onChange={(e) => setDocumentUrl(e.target.value)}
                placeholder="https://docs.google.com/document/d/..."
                required
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">
              <LinkIcon className="mr-2 h-4 w-4" />
              Link Document
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
