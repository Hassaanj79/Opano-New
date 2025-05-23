
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

interface AddDocumentCategoryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  // The iconName is now optional as AppContext will handle a default
  onAddCategory: (name: string, description: string, iconName?: DocumentCategory['iconName']) => void;
}

export function AddDocumentCategoryDialog({ isOpen, onOpenChange, onAddCategory }: AddDocumentCategoryDialogProps) {
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const { toast } = useToast();

  const resetForm = () => {
    setCategoryName('');
    setCategoryDescription('');
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!categoryName.trim()) {
      toast({
        title: "Category Name Required",
        description: "Please enter a name for the category.",
        variant: "destructive",
      });
      return;
    }
    onAddCategory(categoryName.trim(), categoryDescription.trim()); // iconName is handled by AppContext if not provided
    resetForm();
    onOpenChange(false); 
    // Toast for success is handled by AppContext now
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Document Category</DialogTitle>
            <DialogDescription>
              Enter a name and an optional description for your new category.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category-name" className="text-right">
                Name*
              </Label>
              <Input
                id="category-name"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="col-span-3"
                placeholder="e.g., Project Blueprints"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category-description" className="text-right">
                Description
              </Label>
              <Textarea
                id="category-description"
                value={categoryDescription}
                onChange={(e) => setCategoryDescription(e.target.value)}
                className="col-span-3 min-h-[80px]"
                placeholder="e.g., All design files and specifications for Project Blueprints."
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">Add Category</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
