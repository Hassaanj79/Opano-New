
"use client";
import { useAppContext } from "@/contexts/AppContext";
import { ChatterboxSidebar } from "@/components/layout/ChatterboxSidebar";
import { ChatView } from "@/components/chat/ChatView";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { OpanoLogo } from "@/components/OpanoLogo";
import { ThinIconBar } from "@/components/layout/ThinIconBar";
import { MessageSquareDashed, Reply, BellRing, FileText } from 'lucide-react'; // Placeholder icons for new views

// Import new view components
import { RepliesView } from '@/components/views/RepliesView';
import { ActivityView } from '@/components/views/ActivityView';
import { DraftsView } from '@/components/views/DraftsView';

export default function OpanoPage() {
  const { activeConversation, currentView } = useAppContext();

  const renderMainContent = () => {
    switch (currentView) {
      case 'chat':
        if (activeConversation) {
          return <ChatView />;
        }
        return (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
            <MessageSquareDashed className="h-16 w-16 mb-4" />
            <p className="text-lg font-medium text-center">Select a conversation or explore other views</p>
            <p className="text-sm text-center">Choose a channel or a direct message from the sidebar, or check out your replies, activity, or drafts.</p>
          </div>
        );
      case 'replies':
        return <RepliesView />;
      case 'activity':
        return <ActivityView />;
      case 'drafts':
        return <DraftsView />;
      default:
        return ( // Fallback, should ideally not be reached if currentView is always valid
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
            <p className="text-lg">Loading...</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <ThinIconBar />
      <div className="flex-grow flex min-w-0">
        <SidebarProvider>
          <ChatterboxSidebar />
          <SidebarInset className="flex flex-col h-full">
            {/* Mobile header - only for 'chat' view for now */}
            {currentView === 'chat' && (
               <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-card p-2 md:hidden h-[60px]">
                 <div className="flex items-center gap-2">
                     <SidebarTrigger className="h-8 w-8" />
                     <OpanoLogo />
                 </div>
               </header>
            )}
            <div className="flex-grow overflow-hidden">
              {renderMainContent()}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </div>
  );
}
