
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Briefcase, Megaphone, Settings, PlusCircle, FileText, Edit3, Trash2 } from "lucide-react";
import Link from "next/link"; // Import Link for potential future use, though not used for navigation in this step

// Define category data directly in the component for now
const documentCategories = [
  {
    id: "cat1",
    name: "Customer Success",
    description: "Resources, playbooks, and templates for helping our customers succeed.",
    icon: Users,
  },
  {
    id: "cat2",
    name: "DevOps",
    description: "Infrastructure documentation, deployment guides, and CI/CD processes.",
    icon: Settings, // Using Settings as a proxy for DevOps tooling/gears
  },
  {
    id: "cat3",
    name: "Marketing",
    description: "Campaign materials, brand guidelines, market research, and analytics.",
    icon: Megaphone,
  },
  {
    id: "cat4",
    name: "Human Resources",
    description: "Employee handbook, policies, onboarding materials, and benefits information.",
    icon: Briefcase, // Using Briefcase as a proxy for HR/company-related documents
  },
];

// Mock documents for a category - this will be expanded later
const mockDocuments = [
    { id: "doc1", name: "Onboarding Checklist.pdf", type: "pdf", lastModified: "2024-03-10" },
    { id: "doc2", name: "Q1 Campaign Strategy.docx", type: "doc", lastModified: "2024-03-12" },
];


export default function DocumentsPage() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-theme(spacing.16))] bg-muted/30 p-4 md:p-6 w-full overflow-y-auto">
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
                <h4 className="text-sm font-medium text-foreground mb-2">Files (0)</h4>
                {/* Placeholder for document list - will be built out later */}
                {mockDocuments.length > 0 && category.id === "cat1" ? ( // Example: Show mock docs only for first category
                     <div className="space-y-2 mb-3">
                        {mockDocuments.map(doc => (
                            <div key={doc.id} className="flex items-center justify-between p-2 rounded-md border bg-background/70 hover:bg-muted/40 transition-colors">
                                <div className="flex items-center gap-2 truncate">
                                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <span className="text-xs text-foreground truncate">{doc.name}</span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary">
                                        <Edit3 className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive">
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                     </div>
                ) : (
                    <p className="text-xs text-muted-foreground italic mb-3">No documents yet in this category.</p>
                )}
                <Button variant="outline" size="sm" className="w-full text-xs">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Document
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
