
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
} from '@/components/ui/sidebar';
import { ChannelList } from './ChannelList';
import { DirectMessageList } from './DirectMessageList';
import { ChatterboxLogo } from '@/components/ChatterboxLogo';
import { UserAvatar } from '@/components/UserAvatar';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { LogOut, Settings, PlusCircle } from 'lucide-react';
import { AddChannelDialog } from '@/components/dialogs/AddChannelDialog';

export function ChatterboxSidebar() {
  const { currentUser } = useAppContext();
  const [isAddChannelDialogOpen, setIsAddChannelDialogOpen] = useState(false);

  return (
    <>
      <Sidebar collapsible="icon" side="left" variant="sidebar">
        <SidebarHeader>
          <ChatterboxLogo />
        </SidebarHeader>
        <SidebarContent className="p-0">
          <SidebarGroup>
            <div className="flex items-center justify-between w-full">
              <SidebarGroupLabel>Channels</SidebarGroupLabel>
              <SidebarGroupAction onClick={() => setIsAddChannelDialogOpen(true)} aria-label="Add new channel">
                <PlusCircle className="h-4 w-4" />
              </SidebarGroupAction>
            </div>
            <ChannelList />
          </SidebarGroup>
          <SidebarSeparator />
          <SidebarGroup>
            <SidebarGroupLabel>Direct Messages</SidebarGroupLabel>
            <DirectMessageList />
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border">
          <div className="flex items-center p-2 gap-2">
            <UserAvatar user={currentUser} className="h-9 w-9" />
            <div className="flex-grow overflow-hidden group-data-[collapsible=icon]:hidden">
              <p className="font-semibold text-sm truncate">{currentUser.name}</p>
              <p className="text-xs text-sidebar-foreground/70">Online</p>
            </div>
            <Button variant="ghost" size="icon" className="group-data-[collapsible=icon]:hidden text-sidebar-foreground/70 hover:text-sidebar-foreground">
              <Settings />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <AddChannelDialog isOpen={isAddChannelDialogOpen} onOpenChange={setIsAddChannelDialogOpen} />
    </>
  );
}
