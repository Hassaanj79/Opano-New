
"use client";
import { useAppContext } from '@/contexts/AppContext';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { UserAvatar } from '@/components/UserAvatar';
import { Badge } from '@/components/ui/badge';
import type { User } from '@/types';

interface DirectMessageListProps {
  searchTerm: string;
}

export function DirectMessageList({ searchTerm }: DirectMessageListProps) {
  const { users, activeConversation, setActiveConversation, currentUser } = useAppContext();

  // Filtered list of OTHER users (users from context already excludes currentUser)
  const filteredOtherUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDmInfo = (user: User, isSelf: boolean, isActiveDm: boolean) => {
    if (isSelf) return { snippet: "Your personal notes and drafts", timeOrBadge: "" };
    
    // Specific logic for u3 (Huzaifa) to show/hide badge
    if (user.id === 'u3') {
      return { 
        snippet: "Here're my latest drone shots", 
        timeOrBadge: isActiveDm 
          ? "" // No badge if this DM is active
          : <Badge variant="default" className="bg-primary text-primary-foreground h-5 px-1.5 text-xs">80</Badge> 
      };
    }
    // Existing logic for other users
    if (user.id === 'u2') return { snippet: "The weather will be perfect for th...", timeOrBadge: "9:41 AM" };
    if (user.id === 'u4') return { snippet: "Next time it's my turn!", timeOrBadge: "12/22/21" };
    return { snippet: user.designation || (user.isOnline ? 'Online' : 'Offline'), timeOrBadge: "" };
  };

  const isSelfActive = activeConversation?.type === 'dm' && activeConversation.id === currentUser.id;
  const selfDmInfo = getDmInfo(currentUser, true, isSelfActive);

  return (
    <SidebarMenu>
      {/* Current User's space */}
      <SidebarMenuItem key={currentUser.id + "-self"}>
        <SidebarMenuButton
          onClick={() => setActiveConversation('dm', currentUser.id)}
          isActive={isSelfActive}
          className={`gap-2 h-auto py-1.5 data-[active=true]:bg-primary data-[active=true]:text-primary-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:justify-center`}
          tooltip={`${currentUser.name} (you)`}
        >
          <UserAvatar user={currentUser} className="h-7 w-7 group-data-[collapsible=icon]:h-6 group-data-[collapsible=icon]:w-6" />
          <div className="flex-grow overflow-hidden group-data-[collapsible=icon]:hidden">
            <div className="flex justify-between items-center">
              <span className={`truncate font-medium ${isSelfActive ? 'text-primary-foreground': ''}`}>
                {currentUser.name} (you)
              </span>
            </div>
            <p className={`text-xs truncate ${isSelfActive ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
              {selfDmInfo.snippet}
            </p>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>

      {/* List of other users */}
      {filteredOtherUsers.map(user => {
        const isActive = activeConversation?.type === 'dm' && activeConversation.id === user.id;
        const dmInfo = getDmInfo(user, false, isActive);
        
        return (
        <SidebarMenuItem key={user.id}>
          <SidebarMenuButton
            onClick={() => setActiveConversation('dm', user.id)}
            isActive={isActive}
            className={`gap-2 h-auto py-1.5 data-[active=true]:bg-primary data-[active=true]:text-primary-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:justify-center`}
            tooltip={user.name}
          >
            <UserAvatar user={user} className="h-7 w-7 group-data-[collapsible=icon]:h-6 group-data-[collapsible=icon]:w-6" />
            <div className="flex-grow overflow-hidden group-data-[collapsible=icon]:hidden">
              <div className="flex justify-between items-center">
                <span className={`truncate font-medium ${isActive ? 'text-primary-foreground': ''}`}>
                  {user.name}
                </span>
                {typeof dmInfo.timeOrBadge === 'string' && dmInfo.timeOrBadge && (
                  <span className={`text-xs ${isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>{dmInfo.timeOrBadge}</span>
                )}
                 {typeof dmInfo.timeOrBadge !== 'string' && dmInfo.timeOrBadge && (
                  <div className="flex-shrink-0">{dmInfo.timeOrBadge}</div>
                )}
              </div>
              <p className={`text-xs truncate ${isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>{dmInfo.snippet}</p>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      )})}

      {/* No other users found message - only if search term is active and no other users match */}
      {searchTerm && filteredOtherUsers.length === 0 && (
        <div className="p-2 text-sm text-muted-foreground text-center group-data-[collapsible=icon]:hidden">
          No other users found.
        </div>
      )}
    </SidebarMenu>
  );
}
