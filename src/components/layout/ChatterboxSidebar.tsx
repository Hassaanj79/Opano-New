
"use client";
import React, { useState } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarSeparator,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { ChannelList } from './ChannelList';
import { DirectMessageList } from './DirectMessageList';
import { OpanoLogo } from '@/components/OpanoLogo';
import { UserAvatar } from '@/components/UserAvatar';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Settings, Edit, UserCheck, UserX, Plus, LogOut } from 'lucide-react';
// Removed: InviteUserDialog, AddChannelDialog, EditProfileDialog as they are complex features
// Removed: MessageSquareReply, Bell, Send, MoreHorizontal, Clock, Folder, UsersIcon
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
// import { useRouter } from 'next/navigation'; // Keep if basic nav needed

export function ChatterboxSidebar() {
  const {
    currentUser,
    toggleCurrentUserStatus,
    signOutUser,
    // Removed: openEditProfileDialog, addChannel, sendInvitation
  } = useAppContext();
  const { toast } = useToast();
  // const router = useRouter(); // Keep if needed for simple navigation

  const handleEditProfilePlaceholder = () => {
    toast({ title: "Edit Profile", description: "Profile editing TBD." });
  };

  const handleAddChannelPlaceholder = () => {
    toast({ title: "Add Channel", description: "Channel creation TBD." });
  };

  return (
    <Sidebar collapsible="icon" side="left" variant="sidebar" className="border-r border-sidebar-border">
      <SidebarHeader className="p-3 border-b border-sidebar-border">
        <div className="flex items-center justify-between w-full group-data-[collapsible=icon]:justify-center">
            <OpanoLogo />
        </div>
      </SidebarHeader>

      <SidebarContent className="p-0">
        {currentUser && (
          <>
            {/* Simplified Top Nav - can be removed or kept very basic */}
            <SidebarGroup className="pt-2 pb-1 group-data-[collapsible=icon]:px-0">
              {/* Placeholder for any top-level items like "All Unreads" or "Threads" if desired later */}
            </SidebarGroup>

            <SidebarSeparator className="my-1 group-data-[collapsible=icon]:mx-1" />

            <SidebarGroup className="pt-1 group-data-[collapsible=icon]:px-0">
              <div className="flex items-center justify-between w-full px-3 mb-1 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:mb-0.5">
                <SidebarGroupLabel className="text-sm font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden p-0 normal-case">
                    Channels
                </SidebarGroupLabel>
                <Button
                  variant="default"
                  size="icon"
                  className="h-6 w-6 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground group-data-[collapsible=icon]:hidden"
                  onClick={handleAddChannelPlaceholder}
                  aria-label="Add new channel"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
              <ChannelList searchTerm="" /> {/* Simplified: no search term passed for now */}
            </SidebarGroup>

            <SidebarSeparator className="my-1 group-data-[collapsible=icon]:mx-1" />

            <SidebarGroup className="pt-1 group-data-[collapsible=icon]:px-0">
                <div className="flex items-center justify-between w-full px-3 mb-1 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:mb-0.5">
                  <SidebarGroupLabel className="text-xs font-semibold uppercase text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden p-0">
                      Direct Messages
                  </SidebarGroupLabel>
              </div>
              <DirectMessageList searchTerm="" /> {/* Simplified */}
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-sidebar-border mt-auto">
        {currentUser ? (
          <>
            {/* Removed Invite User button as it depends on advanced auth/admin roles */}
            <div
              className="flex items-center p-1 gap-2 rounded-md group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center hover:bg-sidebar-accent cursor-pointer"
              role="button"
              tabIndex={0}
              aria-label={`View profile for ${currentUser.name}`}
            >
              <UserAvatar user={currentUser} className="h-8 w-8" />
              <div className="flex-grow overflow-hidden group-data-[collapsible=icon]:hidden">
                <p className="font-semibold text-sm truncate text-sidebar-foreground">{currentUser.name}</p>
                <p className="text-xs text-sidebar-foreground/70">{currentUser.isOnline ? 'Online' : 'Away'}</p>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="group-data-[collapsible=icon]:hidden text-sidebar-foreground/70 hover:text-sidebar-foreground ml-auto"
                    onClick={(e) => e.stopPropagation()}
                    aria-label="User settings"
                  >
                    <Settings className="h-4 w-4"/>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleEditProfilePlaceholder}>
                    <Edit className="mr-2 h-4 w-4" />
                    <span>Edit Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={toggleCurrentUserStatus}>
                    {currentUser.isOnline ? (
                      <UserX className="mr-2 h-4 w-4" />
                    ) : (
                      <UserCheck className="mr-2 h-4 w-4" />
                    )}
                    <span>{currentUser.isOnline ? 'Set to Away' : 'Set to Online'}</span>
                  </DropdownMenuItem>
                  {/* Removed Manage Users link */}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOutUser}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        ) : (
           <p className="text-center text-sm text-muted-foreground group-data-[collapsible=icon]:hidden">Sign in to start</p>
        )}
      </SidebarFooter>
    </Sidebar>
    {/* Dialogs removed as they are tied to complex features */}
  </>
  );
}
