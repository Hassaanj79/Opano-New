
"use client";

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Clock, Folder } from 'lucide-react';

export default function MoreOptionsPage() {
  return (
    <div className="flex flex-col items-center min-h-screen bg-background p-6 pt-12 md:pt-16">
      {/* Title Section - Not a card */}
      <div className="text-center mb-8 md:mb-10">
        <h1 className="text-xl md:text-2xl font-semibold text-foreground">More Options</h1>
        <p className="mt-1 text-sm md:text-base text-muted-foreground">
          Additional features and settings.
        </p>
      </div>

      {/* Option Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
        <Link href="/attendance" passHref legacyBehavior>
          <a className="block group">
            <Card className="hover:shadow-xl hover:border-primary/50 transition-all duration-200 cursor-pointer h-full flex flex-col bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium text-foreground group-hover:text-primary transition-colors">Attendance</CardTitle>
                <Clock className="h-7 w-7 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground">
                  View and manage your work clock-in and clock-out times.
                </p>
              </CardContent>
            </Card>
          </a>
        </Link>

        <Link href="/documents" passHref legacyBehavior> {/* Changed link */}
          <a className="block group">
            <Card className="hover:shadow-xl hover:border-primary/50 transition-all duration-200 cursor-pointer h-full flex flex-col bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium text-foreground group-hover:text-primary transition-colors">Documents</CardTitle>
                <Folder className="h-7 w-7 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground">
                  Access and manage your documents and files.
                </p>
              </CardContent>
            </Card>
          </a>
        </Link>
      </div>
    </div>
  );
}
