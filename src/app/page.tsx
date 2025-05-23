
// AppProvider is now in RootLayout, no longer needed here directly.
import { ChatterboxSidebar } from "@/components/layout/ChatterboxSidebar";
import { ChatView } from "@/components/chat/ChatView";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { ChatterboxLogo } from "@/components/ChatterboxLogo";

export default function ChatterboxPage() {
  return (
    // <AppProvider> // Removed from here
      <SidebarProvider>
        <ChatterboxSidebar />
        <SidebarInset className="flex flex-col h-svh">
          {/* Mobile header with trigger and logo */}
          <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background p-2 md:hidden">
            <ChatterboxLogo />
            <SidebarTrigger />
          </header>
          <div className="flex-grow overflow-hidden"> {/* Ensure ChatView takes remaining space and handles its own scrolling */}
            <ChatView />
          </div>
        </SidebarInset>
      </SidebarProvider>
    // </AppProvider> // Removed from here
  );
}
