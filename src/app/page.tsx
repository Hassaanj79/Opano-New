
"use client";
import { useAppContext } from "@/contexts/AppContext";
import { ChatterboxSidebar } from "@/components/layout/ChatterboxSidebar";
import { ChatView } from "@/components/chat/ChatView";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { OpanoLogo } from "@/components/OpanoLogo";
import { MessageSquareDashed, PanelLeft } from 'lucide-react';
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { UserProfilePanel } from '@/components/profile/UserProfilePanel';
import { cn } from "@/lib/utils";

import { RepliesView } from '@/components/views/RepliesView';
import { ActivityView } from '@/components/views/ActivityView';
import { DraftsView } from '@/components/views/DraftsView';
import { CallingDialog } from "@/components/dialogs/CallingDialog";

export default function OpanoPage() {
  const { activeConversation, currentView, isCallActive, isLoadingAuth, currentUser, isUserProfilePanelOpen } = useAppContext();

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
        return (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
            <p className="text-lg">Loading view...</p>
          </div>
        );
    }
  };

  if (isLoadingAuth && !currentUser) {
    return (
      <div className="flex flex-grow min-w-0 h-full items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex flex-grow min-w-0 h-full bg-background">
        <ChatterboxSidebar />

        {/* Main content area - Now in the middle */}
        <div className="flex-grow flex flex-col h-full overflow-hidden">
          {/* Mobile Header */}
          {currentView === 'chat' && (
              <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-card p-2 md:hidden h-[60px]">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="h-8 w-8" />
                    <OpanoLogo />
                </div>
              </header>
          )}
          <div className="flex-grow overflow-auto">
            {renderMainContent()}
          </div>
        </div>

        {/* User Profile Panel - Moved to the right */}
        {isUserProfilePanelOpen && (
          <div className="flex-shrink-0 w-80 h-full bg-card overflow-y-auto shadow-lg z-20">
            {/* The UserProfilePanel itself has border-l defined */}
            <UserProfilePanel />
          </div>
        )}

        {isCallActive && <CallingDialog />}
      </div>
    </SidebarProvider>
  );
}
