
"use client";
import { useAppContext } from "@/contexts/AppContext";
import { ChatterboxSidebar } from "@/components/layout/ChatterboxSidebar";
import { ChatView } from "@/components/chat/ChatView";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { OpanoLogo } from "@/components/OpanoLogo";
import { MessageSquareDashed } from 'lucide-react';

export default function OpanoPage() {
  const { activeConversation, currentUser } = useAppContext();

  if (!currentUser) { // Simplified loading/auth check
    return (
      <div className="flex flex-grow min-w-0 h-full items-center justify-center bg-background text-xl font-semibold">
        Please sign in to use Opano.
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}> {/* Default to open sidebar */}
      <div className="flex flex-grow min-w-0 h-full bg-background">
        <ChatterboxSidebar />
        <div className="flex-grow flex flex-col h-full overflow-hidden">
          <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-card p-2 md:hidden h-[60px]">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="h-8 w-8" />
                <OpanoLogo />
            </div>
          </header>
          <div className="flex-grow overflow-auto">
            {activeConversation ? (
              <ChatView />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
                <MessageSquareDashed className="h-16 w-16 mb-4" />
                <p className="text-lg font-medium text-center">Select a conversation to start chatting</p>
              </div>
            )}
          </div>
        </div>
        {/* UserProfilePanel removed */}
      </div>
    </SidebarProvider>
  );
}
