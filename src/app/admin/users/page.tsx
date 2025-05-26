
"use client";

import React, { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserAvatar } from '@/components/UserAvatar';
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ShieldAlert, UserPlus, MailOpen, MoreHorizontal, ChevronDown, ShieldCheck, UserCog } from "lucide-react";
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { cn } from '@/lib/utils';
import type { User, PendingInvitation, UserRole } from '@/types';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';

type TableUserItem =
  | { type: 'active'; data: User }
  | { type: 'invited'; data: PendingInvitation };

export default function ManageUsersPage() {
  const { allUsersWithCurrent, currentUser, isLoadingAuth, pendingInvitations, updateUserRole } = useAppContext();
  const router = useRouter();
  const { toast } = useToast();

  const handleRoleChange = (userId: string, currentRole: UserRole) => {
    const newRole: UserRole = currentRole === 'admin' ? 'member' : 'admin';
    if (currentUser?.id === userId && newRole === 'member') {
      toast({
        title: "Action Denied",
        description: "You cannot demote yourself.",
        variant: "destructive",
      });
      return;
    }
    updateUserRole(userId, newRole);
  };


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

  const combinedUserList: TableUserItem[] = [
    ...allUsersWithCurrent.map(user => ({ type: 'active' as const, data: user })),
    ...pendingInvitations.map(invitation => ({ type: 'invited' as const, data: invitation }))
  ];

  return (
    <div className="flex flex-col min-h-[calc(100vh-theme(spacing.16))] bg-muted/30 p-4 md:p-6 w-full">
      <div className="mb-6 flex items-start justify-between"> {/* Changed to items-start for better alignment with multi-line description */}
        <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-foreground">Manage Users</h1>
            <p className="mt-1 text-sm text-muted-foreground">
            View, manage roles, and see invited users in the Opano workspace.
            </p>
        </div>
        <Button variant="outline" onClick={() => router.back()} className="ml-4 flex-shrink-0"> {/* Added ml-4 for spacing */}
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      <Card className="flex-grow">
        <CardHeader>
          <CardTitle>User List</CardTitle>
          <CardDescription>
            A complete list of all {allUsersWithCurrent.length} active user(s) and {pendingInvitations.length} pending invitation(s).
          </CardDescription>
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
                  <TableHead>Invited/Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {combinedUserList.map((item) => {
                  if (item.type === 'active') {
                    const user = item.data;
                    return (
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
                            className={cn(user.role === 'admin' && "bg-primary/80 hover:bg-primary/70 text-primary-foreground")}
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
                        <TableCell className="text-xs text-muted-foreground">
                          Joined
                        </TableCell>
                        <TableCell className="text-right">
                          {currentUser?.role === 'admin' && user.id !== currentUser?.id ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {user.role === 'member' ? (
                                  <DropdownMenuItem onClick={() => handleRoleChange(user.id, user.role)}>
                                    <ShieldCheck className="mr-2 h-4 w-4" />
                                    Promote to Admin
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onClick={() => handleRoleChange(user.id, user.role)}>
                                    <UserCog className="mr-2 h-4 w-4" />
                                    Demote to Member
                                  </DropdownMenuItem>
                                )}
                                {/* Add more actions like "Deactivate User" here later */}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : user.id === currentUser?.id ? (
                            <span className="text-xs text-muted-foreground italic">Your Account</span>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    );
                  } else {
                    const invitation = item.data;
                    return (
                      <TableRow key={invitation.token} className="bg-muted/30 hover:bg-muted/40">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                                <MailOpen className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="font-medium text-foreground italic">Invited User</div>
                              <div className="text-xs text-muted-foreground">Awaiting registration</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{invitation.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-blue-400 text-blue-600">
                            Invited
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="default" className="bg-amber-500 hover:bg-amber-600 text-primary-foreground text-xs">
                            Pending Invitation
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                            {format(new Date(invitation.timestamp), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-right"></TableCell>
                      </TableRow>
                    );
                  }
                })}
              </TableBody>
            </Table>
          </div>
          {combinedUserList.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              <UsersIcon className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <p>No active users or pending invitations found.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const UsersIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("lucide lucide-users", className)}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);

