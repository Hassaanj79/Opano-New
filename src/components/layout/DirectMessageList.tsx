
"use client";
import { useAppContext } from '@/contexts/AppContext';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { UserAvatar } from '@/components/UserAvatar';

export function DirectMessageList() {
  const { users, activeConversation, setActiveConversation, currentUser } = useAppContext();
  const directMessageUsers = users.filter(user => user.id !== currentUser.id);


  return (
    <SidebarMenu>
      {directMessageUsers.map(user => (
        <SidebarMenuItem key={user.id}>
          <SidebarMenuButton
            onClick={() => setActiveConversation('dm', user.id)}
            isActive={activeConversation?.type === 'dm' && activeConversation.id === user.id}
            className="gap-2"
            tooltip={user.name}
          >
            <UserAvatar user={user} className="h-5 w-5" />
            <span>{user.name}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
