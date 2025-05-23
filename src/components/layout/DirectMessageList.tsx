
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

  // Simplified: isActiveDm is no longer needed here as specific badge logic is in JSX
  const getDmInfo = (user: User, isSelf: boolean) => {
    if (isSelf) return { snippet: "Your personal notes and drafts", timeOrBadge: "" };
    
    // Specific snippet for u3 (Huzaifa)
    if (user.id === 'u3') { // Huzaifa
      return { 
        snippet: "Here're my latest drone shots", 
        // Badge logic is now handled directly in JSX below
        timeOrBadge: "" // Default to no specific time/badge string from here
      };
    }
    // Existing logic for other users
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
        // Pass isActive to getDmInfo in case it's used for other things like snippet styling, 
        // but badge for u3 is now handled outside.
        const dmInfo = getDmInfo(user, false); 
        
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
                
                {/* Logic for time string or generic badge for users NOT u3 */}
                {user.id !== 'u3' && typeof dmInfo.timeOrBadge === 'string' && dmInfo.timeOrBadge && (
                  <span className={`text-xs ${isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>{dmInfo.timeOrBadge}</span>
                )}
                {user.id !== 'u3' && typeof dmInfo.timeOrBadge !== 'string' && dmInfo.timeOrBadge && (
                  <div className="flex-shrink-0">{dmInfo.timeOrBadge}</div>
                )}

                {/* Specific badge logic for user u3 (Huzaifa) - show only if not active */}
                {user.id === 'u3' && !isActive && (
                  <div className="flex-shrink-0">
                    <Badge variant="default" className="bg-primary text-primary-foreground h-5 px-1.5 text-xs">80</Badge>
                  </div>
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
