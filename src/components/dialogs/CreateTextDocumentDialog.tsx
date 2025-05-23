
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { DocumentCategory } from '@/types'; // Use global types
import { FileText } from 'lucide-react';

interface CreateTextDocumentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  category: DocumentCategory;
  onAddTextDocument: (categoryId: string, docName: string, textContent: string) => void;
}

export function CreateTextDocumentDialog({ isOpen, onOpenChange, category, onAddTextDocument }: CreateTextDocumentDialogProps) {
  const [documentName, setDocumentName] = useState('');
  const [textContent, setTextContent] = useState('');
  const { toast } = useToast();

  const resetForm = () => {
    setDocumentName('');
    setTextContent('');
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!documentName.trim()) {
      toast({
        title: "Document Name Required",
        description: "Please enter a name for the text document.",
        variant: "destructive",
      });
      return;
    }
    if (!textContent.trim()) {
         toast({
            title: "Content Required",
            description: "Please enter some content for the text document.",
            variant: "destructive",
        });
        return;
    }
    onAddTextDocument(category.id, documentName.trim(), textContent.trim());
    resetForm();
    onOpenChange(false); 
    // Success toast is handled by AppContext
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
            <DialogTitle>Create New Text Document in "{category.name}"</DialogTitle>
            <DialogDescription>
              Enter a name and content for your new text document.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1">
              <Label htmlFor="text-document-name">Document Name</Label>
              <Input
                id="text-document-name"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                placeholder="e.g., Meeting Notes.txt"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="text-document-content">Content</Label>
              <Textarea
                id="text-document-content"
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Type your document content here..."
                className="min-h-[200px]"
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
              <FileText className="mr-2 h-4 w-4" />
              Create Document
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
