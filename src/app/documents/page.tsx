
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import * as Icons from "lucide-react";
import Link from "next/link";
import { AddDocumentCategoryDialog } from '@/components/dialogs/AddDocumentCategoryDialog';
import { useAppContext } from '@/contexts/AppContext'; // Import AppContext
import type { DocumentCategory } from '@/types'; // Import types from global types

export default function DocumentsPage() {
  // Use documentCategories and addDocumentCategory from AppContext
  const { documentCategories, addDocumentCategory } = useAppContext();
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false);

  const handleAddCategory = (name: string, description: string) => {
    // Default icon for new categories, can be customized later
    addDocumentCategory(name, description, 'FolderKanban'); 
  };

  const IconComponent = ({ iconName }: { iconName: DocumentCategory['iconName'] }) => {
    const Icon = Icons[iconName as keyof typeof Icons] || Icons.Folder;
    return <Icon className="h-8 w-8 text-primary" />;
  };

  return (
    <>
      <div className="flex flex-col min-h-[calc(100vh-theme(spacing.16))] bg-muted/30 p-4 md:p-6 w-full overflow-y-auto">
        <div className="flex justify-start mb-4">
          <Button variant="outline" onClick={() => setIsAddCategoryDialogOpen(true)}>
            <Icons.PlusCircle className="mr-2 h-4 w-4" />
            New Category
          </Button>
        </div>

        <header className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground">Document Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Organize, share, and manage all your important documents across different categories.
          </p>
        </header>

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
        </div>
      </div>
      <AddDocumentCategoryDialog
        isOpen={isAddCategoryDialogOpen}
        onOpenChange={setIsAddCategoryDialogOpen}
        onAddCategory={handleAddCategory}
      />
    </>
  );
}
