
"use client";
import { useAppContext } from '@/contexts/AppContext';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { UserAvatar } from '@/components/UserAvatar';
import { Badge } from '@/components/ui/badge';
import type { User } from '@/types';
import { cn } from '@/lib/utils';

interface DirectMessageListProps {
  searchTerm: string;
}

export function DirectMessageList({ searchTerm }: DirectMessageListProps) {
  const { users, activeConversation, setActiveConversation, currentUser } = useAppContext();

  // Filter out the current user from the list of "other users" to DM with.
  // If currentUser is null (not logged in), this means `users` will be the full mock list initially.
  const otherUsers = currentUser ? users.filter(user => user.id !== currentUser.id) : users;

  const filteredOtherUsers = otherUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDmInfo = (user: User, isSelf: boolean) => {
    if (isSelf) return { snippet: "Your personal notes and drafts", timeOrBadge: "" };
    // Keep mock snippets for existing users for visual consistency if they are still in the list
    if (user.id === 'u3' || user.email === 'huzaifa@example.com') return { snippet: "Here're my latest drone shots", timeOrBadge: "" };
    if (user.id === 'u2' || user.email === 'hanzlah@example.com') return { snippet: "The weather will be perfect for th...", timeOrBadge: "9:41 AM" };
    if (user.id === 'u4' || user.email === 'fahad@example.com') return { snippet: "Next time it's my turn!", timeOrBadge: "12/22/21" };
    return { snippet: user.designation || (user.isOnline ? 'Online' : 'Offline'), timeOrBadge: "" };
  };


  return (
    <SidebarMenu>
      {/* Current User's space - only if currentUser exists */}
      {currentUser && (
        <SidebarMenuItem key={currentUser.id + "-self"}>
          <SidebarMenuButton
            onClick={() => setActiveConversation('dm', currentUser.id)}
            isActive={activeConversation?.type === 'dm' && activeConversation.id === currentUser.id}
            className={cn(
              "gap-3 h-auto py-3 px-3 bg-card text-card-foreground rounded-lg shadow-sm",
              "hover:shadow-md hover:-translate-y-px transition-all duration-150",
              "group-data-[collapsible=icon]:h-12 group-data-[collapsible=icon]:w-12 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center",
              activeConversation?.type === 'dm' && activeConversation.id === currentUser.id && "ring-2 ring-primary ring-offset-1 ring-offset-sidebar-background"
            )}
            tooltip={`${currentUser.name} (you)`}
          >
            <UserAvatar user={currentUser} className="h-10 w-10 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8" />
            <div className="flex-grow overflow-hidden group-data-[collapsible=icon]:hidden">
              <div className="flex justify-between items-center">
                <span className={cn(
                  "truncate font-semibold text-foreground",
                  activeConversation?.type === 'dm' && activeConversation.id === currentUser.id ? "text-primary" : ""
                )}>
                  {currentUser.name} (you)
                </span>
              </div>
              <p className={cn(
                "text-sm text-muted-foreground truncate",
                activeConversation?.type === 'dm' && activeConversation.id === currentUser.id ? "text-primary/80" : ""
              )}>
                {getDmInfo(currentUser, true).snippet}
              </p>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      )}

      {/* List of other users */}
      {filteredOtherUsers.map(user => {
        const isActive = activeConversation?.type === 'dm' && activeConversation.id === user.id;
        const dmInfo = getDmInfo(user, false); 
        
        return (
        <SidebarMenuItem key={user.id}>
          <SidebarMenuButton
            onClick={() => setActiveConversation('dm', user.id)}
            isActive={isActive}
            className={cn(
              "gap-3 h-auto py-3 px-3 bg-card text-card-foreground rounded-lg shadow-sm",
              "hover:shadow-md hover:-translate-y-px transition-all duration-150",
              "group-data-[collapsible=icon]:h-12 group-data-[collapsible=icon]:w-12 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center",
              isActive && "ring-2 ring-primary ring-offset-1 ring-offset-sidebar-background"
            )}
            tooltip={user.name}
          >
            <UserAvatar user={user} className="h-10 w-10 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8" />
            <div className="flex-grow overflow-hidden group-data-[collapsible=icon]:hidden">
              <div className="flex justify-between items-center">
                <span className={cn(
                  "truncate font-semibold text-foreground",
                  isActive ? "text-primary" : ""
                )}>
                  {user.name}
                </span>
                
                { (user.id === 'u3' || user.email === 'huzaifa@example.com') ? (
                  !isActive && <div className="flex-shrink-0"><Badge variant="default" className="bg-primary text-primary-foreground h-5 px-1.5 text-xs">80</Badge></div>
                ) : (
                  typeof dmInfo.timeOrBadge === 'string' && dmInfo.timeOrBadge && (
                    <span className={cn("text-xs", isActive ? "text-primary/80" : "text-muted-foreground")}>{dmInfo.timeOrBadge}</span>
                  )
                )}
                { typeof dmInfo.timeOrBadge !== 'string' && dmInfo.timeOrBadge && (user.id !== 'u3' && user.email !== 'huzaifa@example.com') && (
                  <div className="flex-shrink-0">{dmInfo.timeOrBadge}</div>
                )}

              </div>
              <p className={cn(
                "text-sm text-muted-foreground truncate",
                isActive ? "text-primary/80" : ""
              )}>{dmInfo.snippet}</p>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      )})}

      {searchTerm && filteredOtherUsers.length === 0 && (
        <div className="p-3 text-sm text-muted-foreground text-center group-data-[collapsible=icon]:hidden">
          No other users found.
        </div>
      )}
       {!currentUser && filteredOtherUsers.length === 0 && !searchTerm && (
         <div className="p-3 text-sm text-muted-foreground text-center group-data-[collapsible=icon]:hidden">
          Sign in to see direct messages.
        </div>
       )}
    </SidebarMenu>
  );
}
