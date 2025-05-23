
import { ChatterboxSidebar } from "@/components/layout/ChatterboxSidebar";
import { ChatView } from "@/components/chat/ChatView";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { OpanoLogo } from "@/components/OpanoLogo";
import { ThinIconBar } from "@/components/layout/ThinIconBar";

export default function ChatterboxPage() { // Page name remains for routing, content changes
  return (
    <div className="flex h-screen bg-background"> {/* Main flex container */}
      <ThinIconBar />
      <div className="flex-grow flex min-w-0"> {/* Container for the rest of the app, min-w-0 for flex shrink issues */}
        <SidebarProvider>
          <ChatterboxSidebar />
          <SidebarInset className="flex flex-col h-full"> {/* Use h-full to fill parent */}
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
      </div>
    </div>
  );
}
