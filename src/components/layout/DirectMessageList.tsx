
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

  const directMessageUsers = users
    .filter(user => user.id !== currentUser.id)
    .filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

  // Mocking some DM info for UI alignment with image
  const getDmInfo = (user: User) => {
    if (user.id === 'u3') return { snippet: "Here're my latest drone shots", timeOrBadge: <Badge variant="default" className="bg-primary text-primary-foreground h-5 px-1.5 text-xs">80</Badge> };
    if (user.id === 'u2') return { snippet: "The weather will be perfect for th...", timeOrBadge: "9:41 AM" };
    if (currentUser.id === 'u1' && user.id === 'u4') return { snippet: "Next time it's my turn!", timeOrBadge: "12/22/21" }
    return { snippet: user?.designation || (user?.isOnline ? 'Online' : 'Offline'), timeOrBadge: "" };
  }

  if (directMessageUsers.length === 0 && searchTerm) {
    return (
      <div className="p-2 text-sm text-muted-foreground text-center group-data-[collapsible=icon]:hidden">
        No users found.
      </div>
    );
  }

  return (
    <SidebarMenu>
      {directMessageUsers.map(user => {
        const dmInfo = getDmInfo(user);
        const isActive = activeConversation?.type === 'dm' && activeConversation.id === user.id;
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
                  {user.name} {user.id === currentUser.id ? '(You)' : ''}
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
    </SidebarMenu>
  );
}
