
"use client";

import React from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserAvatar } from '@/components/UserAvatar';
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { cn } from '@/lib/utils';

export default function ManageUsersPage() {
  const { allUsersWithCurrent, currentUser, isLoadingAuth } = useAppContext();
  const router = useRouter();

  if (isLoadingAuth) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-theme(spacing.16))] items-center justify-center bg-muted/30 p-6">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (currentUser?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-theme(spacing.16))] bg-muted/30 p-6 text-center">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold text-destructive mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-6">You do not have permission to view this page.</p>
        <Button onClick={() => router.push('/')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go to Homepage
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-theme(spacing.16))] bg-muted/30 p-4 md:p-6 w-full">
      <div className="mb-6 flex items-center justify-between">
        <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-foreground">Manage Users</h1>
            <p className="mt-1 text-sm text-muted-foreground">
            View and manage all users in the Opano workspace.
            </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      <Card className="flex-grow">
        <CardHeader>
          <CardTitle>User List</CardTitle>
          <CardDescription>A total of {allUsersWithCurrent.length} user(s) in the workspace.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  {/* <TableHead className="text-right">Actions</TableHead> */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {allUsersWithCurrent.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <UserAvatar user={user} className="h-9 w-9" />
                        <div>
                          <div className="font-medium text-foreground">{user.name} {user.id === currentUser?.id && "(You)"}</div>
                          <div className="text-xs text-muted-foreground">{user.designation || 'No designation'}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={user.role === 'admin' ? 'default' : 'secondary'}
                        className={cn(user.role === 'admin' && "bg-primary/80 hover:bg-primary/70")}
                      >
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isOnline ? "default" : "outline"} className={cn(
                        "text-xs",
                        user.isOnline ? "bg-green-500 hover:bg-green-600 text-primary-foreground" : "border-gray-400 text-gray-500"
                      )}>
                        {user.isOnline ? "Online" : "Offline"}
                      </Badge>
                    </TableCell>
                    {/* Placeholder for actions like edit role, disable user etc.
                    <TableCell className="text-right">
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button> 
                    </TableCell>
                    */}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {allUsersWithCurrent.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              <p>No users found in the workspace yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
