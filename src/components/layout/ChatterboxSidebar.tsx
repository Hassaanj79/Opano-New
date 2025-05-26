
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
import {
    Settings,
    UserPlus,
    Edit,
    UserCheck,
    UserX,
    MessageSquareReply,
    Bell,
    Send,
    Plus,
    LogIn,
    LogOut,
    Clock,
    Folder,
    Users as UsersIcon, // Renamed to avoid conflict
    MoreHorizontal
} from 'lucide-react';
import { AddChannelDialog } from '@/components/dialogs/AddChannelDialog';
import { InviteUserDialog } from '@/components/dialogs/InviteUserDialog';
import { EditProfileDialog } from '@/components/dialogs/EditProfileDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CurrentView } from '@/types';
import { useRouter, usePathname } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

const appFeatureNavItems = [
  { label: 'Attendance', icon: Clock, path: '/attendance' },
  { label: 'Documents', icon: Folder, path: '/documents' },
];

const topNavItems: { label: string; icon: React.ElementType; viewOrPath: CurrentView | string; isPath?: boolean }[] = [
    { label: 'Replies', icon: MessageSquareReply, viewOrPath: 'replies' },
    { label: 'Activity', icon: Bell, viewOrPath: 'activity' },
    { label: 'Drafts', icon: Send, viewOrPath: 'drafts' },
];


export function ChatterboxSidebar() {
  const {
    currentUser,
    toggleCurrentUserStatus,
    setActiveSpecialView,
    currentView,
    isLoadingAuth,
    signOutUser,
    openUserProfilePanel,
    closeUserProfilePanel,
  } = useAppContext();
  const [isAddChannelDialogOpen, setIsAddChannelDialogOpen] = useState(false);
  const [isInviteUserDialogOpen, setIsInviteUserDialogOpen] = useState(false);
  const [isEditProfileDialogOpen, setIsEditProfileDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const handleEditProfile = () => {
    if (currentUser) {
      closeUserProfilePanel();
      setIsEditProfileDialogOpen(true);
    }
  };

  const handleNavClick = (viewOrPath: CurrentView | string, isPath: boolean = false) => {
    closeUserProfilePanel();
    if (isPath) {
      router.push(viewOrPath as string);
      if (viewOrPath === '/attendance' || viewOrPath === '/documents' || viewOrPath === '/admin/users') {
        // Keep chat view if navigating to these distinct app sections, 
        // but don't clear activeConversation if already in a non-chat view
        if (currentView !== 'replies' && currentView !== 'activity' && currentView !== 'drafts') {
             setActiveSpecialView('chat'); 
        }
      }
    } else {
      setActiveSpecialView(viewOrPath as 'replies' | 'activity' | 'drafts');
    }
  };

  const handleLogin = () => {
    router.push('/auth/join');
  };

  const handleLogout = async () => {
    await signOutUser();
  };

  const handleViewOwnProfile = () => {
    if (currentUser) {
      openUserProfilePanel(currentUser);
    }
  };

  const handleManageUsersClick = () => {
    closeUserProfilePanel();
    router.push('/admin/users');
  };


  if (isLoadingAuth) {
    return (
      <Sidebar collapsible="icon" side="left" variant="sidebar" className="border-r border-sidebar-border">
        <SidebarHeader className="p-3 border-b border-sidebar-border">
          <Skeleton className="h-8 w-32 group-data-[collapsible=icon]:w-8" />
        </SidebarHeader>
        <SidebarContent className="p-2">
          <Skeleton className="h-8 w-full mb-1" />
          <Skeleton className="h-8 w-full mb-1" />
          <Skeleton className="h-8 w-full mb-4" />
          <Skeleton className="h-8 w-full mb-1" />
          <Skeleton className="h-8 w-full mb-1" />
          <Skeleton className="h-8 w-full mb-4" />
          <Skeleton className="h-6 w-20 mb-2" />
          <Skeleton className="h-8 w-full mb-1" />
          <Skeleton className="h-8 w-full mb-4" />
          <Skeleton className="h-6 w-24 mb-2" />
          <Skeleton className="h-10 w-full mb-1" />
          <Skeleton className="h-10 w-full mb-1" />
        </SidebarContent>
        <SidebarFooter className="p-2 border-t border-sidebar-border mt-auto">
          <Skeleton className="h-10 w-full" />
        </SidebarFooter>
      </Sidebar>
    );
  }

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
                        onClick={() => handleNavClick(item.path, true)}
                        isActive={pathname.startsWith(item.path)}
                        tooltip={item.label}
                        className="text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent group-data-[collapsible=icon]:justify-center data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
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
                        onClick={() => handleNavClick(item.viewOrPath, item.isPath)}
                        isActive={item.isPath ? pathname.startsWith(item.viewOrPath as string) : currentView === item.viewOrPath}
                        tooltip={item.label}
                        className="text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent group-data-[collapsible=icon]:justify-center data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
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
                      onClick={() => setIsAddChannelDialogOpen(true)}
                      aria-label="Add new channel"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <ChannelList searchTerm={searchTerm} />
              </SidebarGroup>

              <SidebarSeparator className="my-1 group-data-[collapsible=icon]:mx-1" />

              <SidebarGroup className="pt-1 group-data-[collapsible=icon]:px-0">
                 <div className="flex items-center justify-between w-full px-3 mb-1 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:mb-0.5">
                    <SidebarGroupLabel className="text-xs font-semibold uppercase text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden p-0">
                        Direct Messages
                    </SidebarGroupLabel>
                </div>
                <DirectMessageList searchTerm={searchTerm} />
              </SidebarGroup>
            </>
          )}
        </SidebarContent>

        <SidebarFooter className="p-2 border-t border-sidebar-border mt-auto">
          {currentUser ? (
            <>
              {currentUser.role === 'admin' && (
                <Button
                  variant="ghost"
                  className="w-full justify-start group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2 mb-1 text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                  onClick={() => setIsInviteUserDialogOpen(true)}
                  aria-label="Invite new user"
                >
                  <UserPlus className="h-4 w-4" />
                  <span className="ml-2 group-data-[collapsible=icon]:hidden">Invite User</span>
                </Button>
              )}
              <SidebarSeparator className="my-1"/>
              <div
                className="flex items-center p-1 gap-2 rounded-md group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center hover:bg-sidebar-accent cursor-pointer"
                onClick={handleViewOwnProfile}
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
                    <DropdownMenuItem onClick={handleEditProfile}>
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
                            <span>Manage Users</span>
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          ) : (
            <Button
              variant="outline"
              className="w-full justify-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2"
              onClick={handleLogin}
            >
              <LogIn className="h-4 w-4" />
              <span className="ml-2 group-data-[collapsible=icon]:hidden">Sign In</span>
            </Button>
          )}
        </SidebarFooter>
      </Sidebar>
      {currentUser && (
        <>
          <AddChannelDialog isOpen={isAddChannelDialogOpen} onOpenChange={setIsAddChannelDialogOpen} />
          <InviteUserDialog isOpen={isInviteUserDialogOpen} onOpenChange={setIsInviteUserDialogOpen} />
          <EditProfileDialog
            isOpen={isEditProfileDialogOpen}
            onOpenChange={setIsEditProfileDialogOpen}
          />
        </>
      )}
    </>
  );
}
