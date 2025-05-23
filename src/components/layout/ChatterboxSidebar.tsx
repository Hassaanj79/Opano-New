
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
  SidebarGroupAction,
  SidebarInput, // Import SidebarInput
} from '@/components/ui/sidebar';
import { ChannelList } from './ChannelList';
import { DirectMessageList } from './DirectMessageList';
import { ChatterboxLogo } from '@/components/ChatterboxLogo';
import { UserAvatar } from '@/components/UserAvatar';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Settings, PlusCircle, UserPlus, Search } from 'lucide-react'; // Added UserPlus
import { AddChannelDialog } from '@/components/dialogs/AddChannelDialog';
import { InviteUserDialog } from '@/components/dialogs/InviteUserDialog';

export function ChatterboxSidebar() {
  const { currentUser } = useAppContext();
  const [isAddChannelDialogOpen, setIsAddChannelDialogOpen] = useState(false);
  const [isInviteUserDialogOpen, setIsInviteUserDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(''); // State for search

  return (
    <>
      <Sidebar collapsible="icon" side="left" variant="sidebar" className="border-r border-sidebar-border">
        <SidebarHeader className="p-3 border-b border-sidebar-border">
          {/* In the image, the logo/workspace name is part of the top-left elements, not a large header */}
          {/* For now, let's keep ChatterboxLogo compact, or consider replacing with icon-only for collapsed state */}
          <div className="flex items-center justify-between w-full group-data-[collapsible=icon]:justify-center">
             <ChatterboxLogo /> {/* This will show Chatterbox, image implies workspace name like "Loopz" */}
          </div>
        </SidebarHeader>

        <SidebarContent className="p-0">
          {/* Search Bar - Mimicking the image */}
          <div className="p-3 space-y-2">
            <div className="relative group-data-[collapsible=icon]:hidden">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <SidebarInput 
                placeholder="Search" 
                className="pl-8 bg-background" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* The image has "Replies, Activity, Drafts, More". We don't have these features yet. */}
          {/* For now, focusing on Channels & DMs */}
          
          <SidebarGroup className="pt-0">
            <div className="flex items-center justify-between w-full px-2">
              {/* Image shows workspace name "Loopz" here. We can use SidebarGroupLabel or a custom component */}
              <SidebarGroupLabel className="text-xs font-semibold uppercase text-foreground/70 group-data-[collapsible=icon]:hidden">
                Channels
              </SidebarGroupLabel>
              <SidebarGroupAction 
                onClick={() => setIsAddChannelDialogOpen(true)} 
                aria-label="Add new channel"
                className="text-muted-foreground hover:text-primary"
              >
                <PlusCircle className="h-4 w-4" />
              </SidebarGroupAction>
            </div>
            <ChannelList />
          </SidebarGroup>
          
          <SidebarSeparator className="my-1" />
          
          <SidebarGroup>
             <div className="flex items-center justify-between w-full px-2">
                <SidebarGroupLabel className="text-xs font-semibold uppercase text-foreground/70 group-data-[collapsible=icon]:hidden">
                    Direct Messages
                </SidebarGroupLabel>
                {/* Optional: Plus button for new DM, not explicitly in image for DMs but common */}
                {/* <SidebarGroupAction aria-label="New direct message" className="text-muted-foreground hover:text-primary">
                    <PlusCircle className="h-4 w-4" />
                </SidebarGroupAction> */}
            </div>
            <DirectMessageList />
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-2 border-t border-sidebar-border mt-auto">
          <Button 
            variant="ghost" 
            className="w-full justify-start group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2 mb-1 text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={() => setIsInviteUserDialogOpen(true)}
            aria-label="Invite new user"
          >
            <UserPlus className="h-4 w-4" />
            <span className="ml-2 group-data-[collapsible=icon]:hidden">Invite User</span>
          </Button>
          <SidebarSeparator className="my-1"/>
          <div className="flex items-center p-1 gap-2 hover:bg-sidebar-accent rounded-md cursor-pointer group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center">
            <UserAvatar user={currentUser} className="h-8 w-8" />
            <div className="flex-grow overflow-hidden group-data-[collapsible=icon]:hidden">
              <p className="font-semibold text-sm truncate text-sidebar-foreground">{currentUser.name}</p>
              <p className="text-xs text-sidebar-foreground/70">{currentUser.isOnline ? 'Online' : 'Offline'}</p>
            </div>
            <Button variant="ghost" size="icon" className="group-data-[collapsible=icon]:hidden text-sidebar-foreground/70 hover:text-sidebar-foreground">
              <Settings className="h-4 w-4"/>
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <AddChannelDialog isOpen={isAddChannelDialogOpen} onOpenChange={setIsAddChannelDialogOpen} />
      <InviteUserDialog isOpen={isInviteUserDialogOpen} onOpenChange={setIsInviteUserDialogOpen} />
    </>
  );
}
