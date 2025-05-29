
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import * as Icons from "lucide-react";
import Link from "next/link";
import { AddDocumentCategoryDialog } from '@/components/dialogs/AddDocumentCategoryDialog';
import { useAppContext } from '@/contexts/AppContext';
import type { DocumentCategory } from '@/types';
import { useRouter } from 'next/navigation'; // Import useRouter
import { ArrowLeft } from 'lucide-react'; // Import ArrowLeft icon

export default function DocumentsPage() {
  const { documentCategories, addDocumentCategory, currentUser } = useAppContext();
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false);
  const router = useRouter(); // Initialize useRouter

  const handleAddCategory = (name: string, description: string) => {
    addDocumentCategory(name, description, 'FolderKanban');
  };

  const IconComponent = ({ iconName }: { iconName: DocumentCategory['iconName'] }) => {
    const Icon = Icons[iconName as keyof typeof Icons] || Icons.Folder;
    return <Icon className="h-8 w-8 text-primary" />;
  };

  return (
    <>
      <div className="flex flex-col min-h-[calc(100vh-theme(spacing.16))] bg-muted/30 p-4 md:p-6 w-full overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <Button variant="outline" onClick={() => router.push('/')} className="mb-2 md:mb-0">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Button>
        </div>
        <div className="flex justify-between items-center mb-6 md:mb-8">
          <header>
            <h1 className="text-2xl md:text-3xl font-semibold text-foreground">Document Management</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Organize, share, and manage all your important documents across different categories.
            </p>
          </header>
          {currentUser?.role === 'admin' && (
            <Button variant="outline" onClick={() => setIsAddCategoryDialogOpen(true)}>
              <Icons.PlusCircle className="mr-2 h-4 w-4" />
              New Category
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {documentCategories.map((category) => (
            <Link href={`/documents/${category.id}`} key={category.id} passHref legacyBehavior>
              <a className="block group">
                <Card className="flex flex-col hover:shadow-lg transition-shadow duration-150 bg-card h-full cursor-pointer">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <IconComponent iconName={category.iconName} />
                      <CardTitle className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                        {category.name}
                      </CardTitle>
                    </div>
                    <CardDescription className="text-xs leading-relaxed min-h-[40px] text-muted-foreground">
                      {category.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2 mt-auto">
                     <p className="text-xs text-muted-foreground">
                        {category.documents.length} document(s)
                     </p>
                  </CardContent>
                </Card>
              </a>
            </Link>
          ))}
          {documentCategories.length === 0 && (
             <div className="md:col-span-2 lg:col-span-3 xl:col-span-4 text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                <Icons.FolderOpen className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                <p className="font-medium text-lg">No document categories found.</p>
                {currentUser?.role === 'admin' && <p className="text-sm">Click "New Category" to add your first one.</p>}
             </div>
          )}
        </div>
      </div>
      {currentUser?.role === 'admin' && (
        <AddDocumentCategoryDialog
          isOpen={isAddCategoryDialogOpen}
          onOpenChange={setIsAddCategoryDialogOpen}
          onAddCategory={handleAddCategory}
        />
      )}
    </>
  );
}
