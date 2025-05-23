
"use client";
import { useAppContext } from '@/contexts/AppContext';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Hash, Lock } from 'lucide-react';

interface ChannelListProps {
  searchTerm: string;
}

export function ChannelList({ searchTerm }: ChannelListProps) {
  const { channels, activeConversation, setActiveConversation } = useAppContext();

  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (filteredChannels.length === 0 && searchTerm) {
    return (
      <div className="p-2 text-sm text-muted-foreground text-center group-data-[collapsible=icon]:hidden">
        No channels found.
      </div>
    );
  }

  return (
    <SidebarMenu>
      {filteredChannels.map(channel => (
        <SidebarMenuItem key={channel.id}>
          <SidebarMenuButton
            onClick={() => setActiveConversation('channel', channel.id)}
            isActive={activeConversation?.type === 'channel' && activeConversation.id === channel.id}
            tooltip={channel.name}
            className="data-[active=true]:bg-primary data-[active=true]:text-primary-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center"
          >
            {channel.isPrivate ? <Lock className="h-4 w-4" /> : <Hash className="h-4 w-4" />}
            <span className="truncate group-data-[collapsible=icon]:hidden">{channel.name}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
