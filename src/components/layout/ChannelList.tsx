
"use client";
import { useAppContext } from '@/contexts/AppContext';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Hash } from 'lucide-react';

export function ChannelList() {
  const { channels, activeConversation, setActiveConversation } = useAppContext();

  return (
    <SidebarMenu>
      {channels.map(channel => (
        <SidebarMenuItem key={channel.id}>
          <SidebarMenuButton
            onClick={() => setActiveConversation('channel', channel.id)}
            isActive={activeConversation?.type === 'channel' && activeConversation.id === channel.id}
            tooltip={channel.name}
          >
            <Hash />
            <span>{channel.name}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
