
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
import { Settings, Edit, UserCheck, UserX, Plus, LogOut, MessageSquareReply, Bell, Send, MoreHorizontal, Clock, Folder, Users as UsersIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import { useRouter, usePathname } from 'next/navigation'; // Added usePathname

// These were removed as part of the major revert to simplify
// import { InviteUserDialog } from '@/components/dialogs/InviteUserDialog';
// import { AddChannelDialog } from '@/components/dialogs/AddChannelDialog';
// import { EditProfileDialog } from '@/components/dialogs/EditProfileDialog';


export function ChatterboxSidebar() {
  const {
    currentUser,
    // setActiveConversation, // Removed as part of revert; handled by setActiveSpecialView or direct nav
    setActiveSpecialView,
    currentView,
    // These functions were related to features that were reverted/simplified
    // openEditProfileDialog,
    // addChannel,
    // sendInvitation,
    toggleCurrentUserStatus, // Kept for basic status toggling
    signOutUser, // Kept for sign out
    closeUserProfilePanel,
  } = useAppContext();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname(); // Get current pathname

  // State for dialogs (kept commented out as dialogs were removed in revert)
  // const [isInviteUserDialogOpen, setIsInviteUserDialogOpen] = useState(false);
  // const [isAddChannelDialogOpen, setIsAddChannelDialogOpen] = useState(false);

  const handleAddChannelPlaceholder = () => {
    if (currentUser?.role !== 'admin') {
      toast({ title: "Permission Denied", description: "Only admins can create channels." });
      return;
    }
    toast({ title: "Add Channel", description: "Channel creation TBD." });
    // setIsAddChannelDialogOpen(true); // Dialog functionality removed
  };

  const handleInviteUserPlaceholder = () => {
     if (currentUser?.role !== 'admin') {
      toast({ title: "Permission Denied", description: "Only admins can invite users." });
      return;
    }
    toast({ title: "Invite User", description: "User invitation TBD." });
    // setIsInviteUserDialogOpen(true); // Dialog functionality removed
  };

  const handleEditProfilePlaceholder = () => {
    toast({ title: "Edit Profile", description: "Profile editing TBD."});
    // openEditProfileDialog?.(); // Dialog functionality removed
  };

  const handleManageUsersClick = () => {
    if (currentUser?.role === 'admin') {
      closeUserProfilePanel();
      router.push('/admin/users');
    } else {
      toast({ title: "Permission Denied", description: "Only admins can manage users." });
    }
  };


  const topNavItems = [
    { label: 'Replies', icon: MessageSquareReply, view: 'replies' as const },
    { label: 'Activity', icon: Bell, view: 'activity' as const },
    { label: 'Drafts', icon: Send, view: 'drafts' as const },
    // "More" was removed in a previous step based on user request
  ];

  const appFeatureNavItems = [
    { label: 'Attendance', icon: Clock, path: '/attendance' },
    { label: 'Documents', icon: Folder, path: '/documents' },
  ];


  const handleTopNavClick = (item: { path?: string, view?: 'replies' | 'activity' | 'drafts' }) => {
    closeUserProfilePanel();
    if (item.path) {
      router.push(item.path);
      // Potentially set a different kind of view or reset chat focus
      setActiveSpecialView('chat'); // Default to chat view or a specific 'app-section' view
    } else if (item.view) {
      setActiveSpecialView(item.view);
    }
  };


  return (
    <>
      <Sidebar collapsible="icon" side="left" variant="sidebar" className="border-r border-sidebar-border">
        <SidebarHeader className="p-3 border-b border-sidebar-border">
          <div className="flex items-center justify-between w-full group-data-[collapsible=icon]:justify-center">
              <OpanoLogo />
          </div>
        </SidebarHeader>

        <SidebarContent className="p-0">
          {currentUser && (
            <>
              <SidebarGroup className="pt-2 pb-1 group-data-[collapsible=icon]:px-0">
                <SidebarMenu>
                  {appFeatureNavItems.map((item) => (
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton
                        onClick={() => handleTopNavClick(item)}
                        isActive={pathname.startsWith(item.path)}
                        tooltip={item.label}
                        className="data-[active=true]:bg-primary data-[active=true]:text-primary-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center"
                      >
                        <item.icon className="h-5 w-5" />
                        <span className="truncate group-data-[collapsible=icon]:hidden">{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroup>
              <SidebarSeparator className="my-1 group-data-[collapsible=icon]:mx-1" />
              <SidebarGroup className="pt-1 pb-1 group-data-[collapsible=icon]:px-0">
                <SidebarMenu>
                  {topNavItems.map((item) => (
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton
                        onClick={() => handleTopNavClick(item)}
                        isActive={currentView === item.view}
                        tooltip={item.label}
                        className="data-[active=true]:bg-primary data-[active=true]:text-primary-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center"
                      >
                        <item.icon className="h-5 w-5" />
                        <span className="truncate group-data-[collapsible=icon]:hidden">{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroup>

              <SidebarSeparator className="my-1 group-data-[collapsible=icon]:mx-1" />

              <SidebarGroup className="pt-1 group-data-[collapsible=icon]:px-0">
                <div className="flex items-center justify-between w-full px-3 mb-1 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:mb-0.5">
                  <SidebarGroupLabel className="text-sm font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden p-0 normal-case">
                      Loopz
                  </SidebarGroupLabel>
                  {currentUser?.role === 'admin' && (
                    <Button
                      variant="default"
                      size="icon"
                      className="h-6 w-6 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground group-data-[collapsible=icon]:hidden"
                      onClick={handleAddChannelPlaceholder}
                      aria-label="Add new channel"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <ChannelList searchTerm="" />
              </SidebarGroup>

              <SidebarSeparator className="my-1 group-data-[collapsible=icon]:mx-1" />

              <SidebarGroup className="pt-1 group-data-[collapsible=icon]:px-0">
                  <div className="flex items-center justify-between w-full px-3 mb-1 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:mb-0.5">
                    <SidebarGroupLabel className="text-xs font-semibold uppercase text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden p-0">
                        Direct Messages
                    </SidebarGroupLabel>
                </div>
                <DirectMessageList searchTerm="" />
              </SidebarGroup>
            </>
          )}
        </SidebarContent>

        <SidebarFooter className="p-2 border-t border-sidebar-border mt-auto">
          {currentUser ? (
            <>
              {currentUser.role === 'admin' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mb-2 group-data-[collapsible=icon]:hidden"
                  onClick={handleInviteUserPlaceholder}
                >
                  <Plus className="mr-2" /> Invite User
                </Button>
              )}
              <div
                className="flex items-center p-1 gap-2 rounded-md group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center hover:bg-sidebar-accent cursor-pointer"
                role="button"
                tabIndex={0}
                aria-label={`View profile for ${currentUser.name}`}
                // onClick={() => openUserProfilePanel?.(currentUser)} // This functionality was part of UserProfilePanel which was reverted
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
                    {currentUser.role === 'admin' && (
                        <DropdownMenuItem onClick={handleManageUsersClick}>
                          <UsersIcon className="mr-2 h-4 w-4" />
                          Manage Users
                        </DropdownMenuItem>
                    )}
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
      
    </>
  );
}
