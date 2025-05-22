
"use client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { ChannelList } from './ChannelList';
import { DirectMessageList } from './DirectMessageList';
import { ChatterboxLogo } from '@/components/ChatterboxLogo';
import { UserAvatar } from '@/components/UserAvatar';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { LogOut, Settings } from 'lucide-react';

export function ChatterboxSidebar() {
  const { currentUser } = useAppContext();

  return (
    <Sidebar collapsible="icon" side="left" variant="sidebar">
      <SidebarHeader>
        <ChatterboxLogo />
      </SidebarHeader>
      <SidebarContent className="p-0">
        <SidebarGroup>
          <SidebarGroupLabel>Channels</SidebarGroupLabel>
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
  );
}
