
import { ChatterboxSidebar } from "@/components/layout/ChatterboxSidebar";
import { ChatView } from "@/components/chat/ChatView";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { OpanoLogo } from "@/components/OpanoLogo"; // Changed from ChatterboxLogo


export default function ChatterboxPage() { // Page name remains for routing, content changes
  return (
      <SidebarProvider>
        <ChatterboxSidebar />
        <SidebarInset className="flex flex-col h-svh bg-background">
          {/* Mobile header with trigger and logo */}
          <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-card p-2 md:hidden h-[60px]">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="h-8 w-8" />
                <OpanoLogo />
            </div>
          </header>
          <div className="flex-grow overflow-hidden">
            <ChatView />
          </div>
        </SidebarInset>
      </SidebarProvider>
  );
}
