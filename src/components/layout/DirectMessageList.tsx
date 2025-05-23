
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

  const filteredOtherUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDmInfo = (user: User, isSelf: boolean) => {
    if (isSelf) return { snippet: "Your personal notes and drafts", timeOrBadge: "" };
    if (user.id === 'u3') return { snippet: "Here're my latest drone shots", timeOrBadge: "" }; // Huzaifa
    if (user.id === 'u2') return { snippet: "The weather will be perfect for th...", timeOrBadge: "9:41 AM" }; // Hanzlah
    if (user.id === 'u4') return { snippet: "Next time it's my turn!", timeOrBadge: "12/22/21" }; // Fahad
    return { snippet: user.designation || (user.isOnline ? 'Online' : 'Offline'), timeOrBadge: "" };
  };

  const isSelfActive = activeConversation?.type === 'dm' && activeConversation.id === currentUser.id;
  const selfDmInfo = getDmInfo(currentUser, true);

  return (
    <SidebarMenu>
      {/* Current User's space */}
      <SidebarMenuItem key={currentUser.id + "-self"}>
        <SidebarMenuButton
          onClick={() => setActiveConversation('dm', currentUser.id)}
          isActive={isSelfActive}
          className={cn(
            "gap-3 h-auto py-3 px-3 bg-card text-card-foreground rounded-lg shadow-sm",
            "hover:shadow-md hover:-translate-y-px transition-all duration-150",
            "group-data-[collapsible=icon]:h-12 group-data-[collapsible=icon]:w-12 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center",
            isSelfActive && "ring-2 ring-primary ring-offset-1 ring-offset-sidebar-background" // Active state with ring
          )}
          tooltip={`${currentUser.name} (you)`}
        >
          <UserAvatar user={currentUser} className="h-10 w-10 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8" />
          <div className="flex-grow overflow-hidden group-data-[collapsible=icon]:hidden">
            <div className="flex justify-between items-center">
              <span className={cn(
                "truncate font-semibold text-foreground",
                isSelfActive ? "text-primary" : ""
              )}>
                {currentUser.name} (you)
              </span>
            </div>
            <p className={cn(
              "text-sm text-muted-foreground truncate",
              isSelfActive ? "text-primary/80" : ""
            )}>
              {selfDmInfo.snippet}
            </p>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>

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
              isActive && "ring-2 ring-primary ring-offset-1 ring-offset-sidebar-background" // Active state with ring
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
                
                {user.id !== 'u3' && typeof dmInfo.timeOrBadge === 'string' && dmInfo.timeOrBadge && (
                  <span className={cn("text-xs", isActive ? "text-primary/80" : "text-muted-foreground")}>{dmInfo.timeOrBadge}</span>
                )}
                {user.id !== 'u3' && typeof dmInfo.timeOrBadge !== 'string' && dmInfo.timeOrBadge && (
                  <div className="flex-shrink-0">{dmInfo.timeOrBadge}</div>
                )}

                {user.id === 'u3' && !isActive && (
                  <div className="flex-shrink-0">
                    <Badge variant="default" className="bg-primary text-primary-foreground h-5 px-1.5 text-xs">80</Badge>
                  </div>
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
    </SidebarMenu>
  );
}
