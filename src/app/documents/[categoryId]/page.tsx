
"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import type { Document, DocumentCategory } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { FileText, Edit3, Trash2, UploadCloud, Type, Link as LinkIcon, ArrowLeft, FolderOpen } from "lucide-react"; // Added ArrowLeft
import * as Icons from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AddDocumentDialog } from '@/components/dialogs/AddDocumentDialog';
import { CreateTextDocumentDialog } from '@/components/dialogs/CreateTextDocumentDialog';
import { LinkExternalDocumentDialog } from '@/components/dialogs/LinkExternalDocumentDialog';
import { ViewDocumentDialog } from '@/components/dialogs/ViewDocumentDialog';

export default function CategoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { 
    findDocumentCategoryById, 
    addFileDocumentToCategory,
    addTextDocumentToCategory,
    addLinkedDocumentToCategory,
    deleteDocumentFromCategory 
  } = useAppContext();
  const { toast } = useToast();

  const categoryId = typeof params.categoryId === 'string' ? params.categoryId : '';
  const [category, setCategory] = useState<DocumentCategory | null | undefined>(null);

  const [isAddFileDialogOpen, setIsAddFileDialogOpen] = useState(false);
  const [isCreateTextDialogOpen, setIsCreateTextDialogOpen] = useState(false);
  const [isLinkExternalDialogOpen, setIsLinkExternalDialogOpen] = useState(false);
  const [deletingDocInfo, setDeletingDocInfo] = useState<{categoryId: string, docId: string} | null>(null);

  const [isViewDocDialogOpen, setIsViewDocDialogOpen] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);

  useEffect(() => {
    if (categoryId) {
      const foundCategory = findDocumentCategoryById(categoryId);
      setCategory(foundCategory);
    }
  }, [categoryId, findDocumentCategoryById]);

  const handleDocumentClick = (doc: Document) => {
    if (doc.docType === 'file') {
      if ((doc.type.startsWith('image/') || doc.type === 'application/pdf') && doc.fileUrl) {
        setViewingDocument(doc);
        setIsViewDocDialogOpen(true);
      } else if (doc.fileUrl) {
        window.open(doc.fileUrl, '_blank');
        toast({
          title: "Opening Document",
          description: `"${doc.name}" will be downloaded or opened by your system, as in-app preview is not supported for this file type.`,
          duration: 5000,
        });
      }
    } else if (doc.docType === 'text') {
      toast({
        title: `Text Document: ${doc.name}`,
        description: (
          <pre className="mt-2 w-full whitespace-pre-wrap rounded-md bg-slate-950 p-4 font-mono text-xs text-slate-50 max-h-80 overflow-y-auto">
            {doc.textContent}
          </pre>
        ),
        duration: 10000,
      });
    } else if (doc.docType === 'url' && doc.fileUrl) {
      window.open(doc.fileUrl, '_blank');
    }
  };

  const handleConfirmDeleteDocument = () => {
    if (!deletingDocInfo) return;
    deleteDocumentFromCategory(deletingDocInfo.categoryId, deletingDocInfo.docId);
    setDeletingDocInfo(null);
    // Toast is handled by AppContext
  };

  if (category === undefined) { 
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-theme(spacing.16))] bg-muted/30 p-6">
            <FolderOpen className="h-16 w-16 mb-4 text-muted-foreground" />
            <p className="text-lg font-medium">Loading category details...</p>
        </div>
    );
  }

  if (category === null) { 
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-theme(spacing.16))] bg-muted/30 p-6">
            <FolderOpen className="h-16 w-16 mb-4 text-destructive" />
            <h1 className="text-2xl font-semibold mb-2">Category Not Found</h1>
            <p className="text-muted-foreground mb-4">The document category you're looking for doesn't exist or has been moved.</p>
            <Button onClick={() => router.push('/documents')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Categories
            </Button>
        </div>
    );
  }

  const Icon = Icons[category.iconName as keyof typeof Icons] || Icons.Folder;

  return (
    <>
      <div className="flex flex-col min-h-full bg-muted/30 p-4 md:p-6 w-full overflow-y-auto">
        <div className="mb-6">
            <Button variant="outline" onClick={() => router.push('/documents')} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Categories
            </Button>
            <div className="flex items-center gap-3 mb-2">
                <Icon className="h-10 w-10 text-primary" />
                <h1 className="text-3xl font-semibold text-foreground">{category.name}</h1>
            </div>
            <p className="text-sm text-muted-foreground">{category.description}</p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2"> {/* Added flex-wrap for smaller screens */}
            <Button variant="outline" onClick={() => setIsAddFileDialogOpen(true)}>
                <UploadCloud className="mr-2 h-4 w-4" /> Upload File
            </Button>
            <Button variant="outline" onClick={() => setIsCreateTextDialogOpen(true)}>
                <Type className="mr-2 h-4 w-4" /> Create Text Document
            </Button>
            <Button variant="outline" onClick={() => setIsLinkExternalDialogOpen(true)}>
                <LinkIcon className="mr-2 h-4 w-4" /> Link External Document
            </Button>
        </div>

        {category.documents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {category.documents.map(doc => (
              <Card key={doc.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardHeader className="p-3 pb-2 border-b">
                  <button
                    onClick={() => handleDocumentClick(doc)}
                    className="flex items-center gap-2 truncate text-left hover:underline w-full"
                    title={doc.name}
                  >
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <CardTitle className="text-sm font-medium text-foreground truncate">{doc.name}</CardTitle>
                  </button>
                </CardHeader>
                <CardContent className="p-3 text-xs">
                  <p className="text-muted-foreground">Type: <span className="font-medium text-foreground/80">{doc.docType.toUpperCase()}</span></p>
                  <p className="text-muted-foreground">Modified: <span className="font-medium text-foreground/80">{doc.lastModified}</span></p>
                </CardContent>
                <div className="p-3 border-t flex justify-end gap-1 bg-muted/30">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => toast({title: "Edit (Coming Soon)", description: "Editing document details will be available soon."})}>
                      <Edit3 className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDeletingDocInfo({categoryId: category.id, docId: doc.id})}>
                          <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the document "{doc.name}".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeletingDocInfo(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDeleteDocument}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
            <UploadCloud className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <p className="font-medium text-lg">No documents in this category yet.</p>
            <p className="text-sm">Use the buttons above to add your first document.</p>
          </div>
        )}
      </div>

      {category && (
        <>
            <AddDocumentDialog
                isOpen={isAddFileDialogOpen}
                onOpenChange={setIsAddFileDialogOpen}
                category={category}
                onAddDocument={(catId, file) => addFileDocumentToCategory(catId, file)}
            />
            <CreateTextDocumentDialog
                isOpen={isCreateTextDialogOpen}
                onOpenChange={setIsCreateTextDialogOpen}
                category={category}
                onAddTextDocument={(catId, name, content) => addTextDocumentToCategory(catId, name, content)}
            />
            <LinkExternalDocumentDialog
                isOpen={isLinkExternalDialogOpen}
                onOpenChange={setIsLinkExternalDialogOpen}
                category={category}
                onAddLinkedDocument={(catId, name, url) => addLinkedDocumentToCategory(catId, name, url)}
            />
            <ViewDocumentDialog
                isOpen={isViewDocDialogOpen}
                onOpenChange={setIsViewDocDialogOpen}
                document={viewingDocument}
            />
        </>
      )}
    </>
  );
}
