
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Briefcase, Megaphone, Settings, PlusCircle, FileText, Edit3, Trash2, DollarSign, type LucideIcon, FolderKanban, UploadCloud, Type } from "lucide-react"; // Added Type icon
import Link from "next/link";
import { AddDocumentCategoryDialog } from '@/components/dialogs/AddDocumentCategoryDialog';
import { AddDocumentDialog } from '@/components/dialogs/AddDocumentDialog';
import { CreateTextDocumentDialog } from '@/components/dialogs/CreateTextDocumentDialog'; // New Dialog
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';

export interface Document {
  id: string;
  name: string;
  type: string; // e.g., 'pdf', 'docx', 'png' from file.type for file uploads, or 'text/plain' for created docs
  docType: 'file' | 'text'; // Distinguishes between uploaded files and in-app created text documents
  lastModified: string; // ISO string or formatted date
  fileUrl?: string; // For local preview of uploaded files using URL.createObjectURL
  fileObject?: File; // Store the actual file object if needed (not persisted for files)
  textContent?: string; // Content for in-app created text documents
}

export interface DocumentCategory {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  documents: Document[];
}

const initialDocumentCategories: DocumentCategory[] = [
  {
    id: "cat1",
    name: "Customer Success",
    description: "Resources, playbooks, and templates for helping our customers succeed.",
    icon: Users,
    documents: [
        { id: "doc1-1", name: "Onboarding Checklist.pdf", type: "application/pdf", docType: 'file', lastModified: format(new Date(2024, 2, 10), "MMM d, yyyy"), fileUrl: "#" },
        { id: "doc1-2", name: "Q1 Success Playbook.docx", type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", docType: 'file', lastModified: format(new Date(2024, 2, 12), "MMM d, yyyy"), fileUrl: "#" },
        { id: "doc1-3", name: "Meeting Notes - Client X.txt", type: "text/plain", docType: 'text', textContent: "Discussed Q2 goals and roadmap.\nKey action items:\n- Follow up on feature Y\n- Schedule demo for new module", lastModified: format(new Date(2024, 3, 1), "MMM d, yyyy") },
    ],
  },
  {
    id: "cat2",
    name: "DevOps",
    description: "Infrastructure documentation, deployment guides, and CI/CD processes.",
    icon: Settings,
    documents: [],
  },
  {
    id: "cat3",
    name: "Marketing",
    description: "Campaign materials, brand guidelines, market research, and analytics.",
    icon: Megaphone,
    documents: [],
  },
  {
    id: "cat4",
    name: "Human Resources",
    description: "Employee handbook, policies, onboarding materials, and benefits information.",
    icon: Briefcase,
    documents: [],
  },
  {
    id: "cat5",
    name: "Sales",
    description: "Sales scripts, pricing information, proposal templates, and CRM guides.",
    icon: DollarSign,
    documents: [],
  },
];

export default function DocumentsPage() {
  const [documentCategories, setDocumentCategories] = useState<DocumentCategory[]>(initialDocumentCategories);
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false);
  
  const [isAddDocumentDialogOpen, setIsAddDocumentDialogOpen] = useState(false);
  const [currentCategoryForFileDialog, setCurrentCategoryForFileDialog] = useState<DocumentCategory | null>(null);

  const [isCreateTextDocumentDialogOpen, setIsCreateTextDocumentDialogOpen] = useState(false);
  const [currentCategoryForTextDialog, setCurrentCategoryForTextDialog] = useState<DocumentCategory | null>(null);

  const [deletingDocInfo, setDeletingDocInfo] = useState<{categoryId: string, docId: string} | null>(null);
  const { toast } = useToast();

  const handleAddCategory = (name: string, description: string) => {
    const newCategory: DocumentCategory = {
      id: `cat-${Date.now()}`,
      name,
      description,
      icon: FolderKanban, 
      documents: [],
    };
    setDocumentCategories(prevCategories => [...prevCategories, newCategory]);
  };

  const handleOpenAddDocumentDialog = (category: DocumentCategory) => {
    setCurrentCategoryForFileDialog(category);
    setIsAddDocumentDialogOpen(true);
  };

  const handleAddFileDocument = (categoryId: string, file: File) => {
    const newDocument: Document = {
      id: `doc-file-${Date.now()}`,
      name: file.name,
      type: file.type || 'unknown',
      docType: 'file',
      lastModified: format(new Date(), "MMM d, yyyy"),
      fileUrl: URL.createObjectURL(file),
      fileObject: file,
    };

    setDocumentCategories(prevCategories =>
      prevCategories.map(category =>
        category.id === categoryId
          ? { ...category, documents: [...category.documents, newDocument] }
          : category
      )
    );
    toast({ title: "File Document Added", description: `"${file.name}" added to ${currentCategoryForFileDialog?.name}.`});
  };

  const handleOpenCreateTextDocumentDialog = (category: DocumentCategory) => {
    setCurrentCategoryForTextDialog(category);
    setIsCreateTextDocumentDialogOpen(true);
  };

  const handleCreateTextDocument = (categoryId: string, docName: string, textContent: string) => {
    const newDocument: Document = {
      id: `doc-text-${Date.now()}`,
      name: docName.endsWith('.txt') ? docName : `${docName}.txt`, // Ensure .txt extension for simplicity
      type: 'text/plain',
      docType: 'text',
      lastModified: format(new Date(), "MMM d, yyyy"),
      textContent: textContent,
    };
    setDocumentCategories(prevCategories =>
      prevCategories.map(category =>
        category.id === categoryId
          ? { ...category, documents: [...category.documents, newDocument] }
          : category
      )
    );
    toast({ title: "Text Document Created", description: `"${newDocument.name}" created in ${currentCategoryForTextDialog?.name}.`});
  };
  
  const handleDeleteDocument = () => {
    if (!deletingDocInfo) return;
    const { categoryId, docId } = deletingDocInfo;

    setDocumentCategories(prevCategories =>
      prevCategories.map(category =>
        category.id === categoryId
          ? { ...category, documents: category.documents.filter(doc => doc.id !== docId) }
          : category
      )
    );
    toast({ title: "Document Deleted", description: "The document has been removed."});
    setDeletingDocInfo(null);
  };

  const handleDocumentClick = (doc: Document) => {
    if (doc.docType === 'file' && doc.fileUrl) {
      window.open(doc.fileUrl, '_blank');
    } else if (doc.docType === 'text') {
      toast({
        title: `Text Document: ${doc.name}`,
        description: (
          <pre className="mt-2 w-full whitespace-pre-wrap rounded-md bg-slate-950 p-4 font-mono text-xs text-slate-50 max-h-40 overflow-y-auto">
            {doc.textContent}
          </pre>
        ),
        duration: 10000, // Keep toast longer for reading
      });
      console.log("Text Document Content:", doc.textContent);
    }
  };


  return (
    <>
      <div className="flex flex-col min-h-[calc(100vh-theme(spacing.16))] bg-muted/30 p-4 md:p-6 w-full overflow-y-auto">
        <div className="flex justify-start mb-4">
          <Button variant="outline" onClick={() => setIsAddCategoryDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
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
            <Card key={category.id} className="flex flex-col hover:shadow-lg transition-shadow duration-150 bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3 mb-2">
                  <category.icon className="h-8 w-8 text-primary" />
                  <CardTitle className="text-xl font-semibold text-foreground">{category.name}</CardTitle>
                </div>
                <CardDescription className="text-xs leading-relaxed min-h-[40px] text-muted-foreground">
                  {category.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col pt-2">
                <div className="border-t border-border pt-3 mt-auto">
                  <h4 className="text-sm font-medium text-foreground mb-2">Files ({category.documents.length})</h4>
                  {category.documents.length > 0 ? (
                      <div className="space-y-2 mb-3 max-h-48 overflow-y-auto pr-1">
                          {category.documents.map(doc => (
                              <div key={doc.id} className="flex items-center justify-between p-2 rounded-md border bg-background/70 hover:bg-muted/40 transition-colors">
                                  <button
                                    onClick={() => handleDocumentClick(doc)}
                                    className="flex items-center gap-2 truncate text-left hover:underline"
                                    title={doc.name}
                                  >
                                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                                      <span className="text-xs text-foreground truncate">{doc.name}</span>
                                  </button>
                                  <div className="flex items-center gap-1 shrink-0">
                                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={() => toast({title: "Edit (Coming Soon)", description: "Editing document details will be available soon."})}>
                                          <Edit3 className="h-3.5 w-3.5" />
                                      </Button>
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => setDeletingDocInfo({categoryId: category.id, docId: doc.id})}>
                                              <Trash2 className="h-3.5 w-3.5" />
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
                                            <AlertDialogAction onClick={handleDeleteDocument}>Delete</AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                  </div>
                              </div>
                          ))}
                      </div>
                  ) : (
                      <div className="text-xs text-muted-foreground italic mb-3 flex flex-col items-center justify-center p-4 border border-dashed rounded-md min-h-[80px]">
                        <UploadCloud className="h-7 w-7 text-gray-400 mb-1.5"/>
                        <p>No documents yet.</p>
                        <p>Click below to add.</p>
                      </div>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => handleOpenAddDocumentDialog(category)}>
                        <UploadCloud className="mr-2 h-4 w-4" />
                        Upload File
                    </Button>
                    <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => handleOpenCreateTextDocumentDialog(category)}>
                        <Type className="mr-2 h-4 w-4" />
                        Create Text
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <AddDocumentCategoryDialog
        isOpen={isAddCategoryDialogOpen}
        onOpenChange={setIsAddCategoryDialogOpen}
        onAddCategory={handleAddCategory}
      />
      {currentCategoryForFileDialog && (
        <AddDocumentDialog
            isOpen={isAddDocumentDialogOpen}
            onOpenChange={setIsAddDocumentDialogOpen}
            category={currentCategoryForFileDialog}
            onAddDocument={handleAddFileDocument}
        />
      )}
      {currentCategoryForTextDialog && (
        <CreateTextDocumentDialog
            isOpen={isCreateTextDocumentDialogOpen}
            onOpenChange={setIsCreateTextDocumentDialogOpen}
            category={currentCategoryForTextDialog}
            onAddTextDocument={handleCreateTextDocument}
        />
      )}
    </>
  );
}

    