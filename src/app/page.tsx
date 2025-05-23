
import { ChatterboxSidebar } from "@/components/layout/ChatterboxSidebar";
import { ChatView } from "@/components/chat/ChatView";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
// PanelLeft is imported by SidebarTrigger itself if needed by its default render.
// For clarity, if SidebarTrigger's default render uses PanelLeft, it's fine.
// If we want to ensure it's available, we can keep it, but it might not be directly used here anymore.
// import { PanelLeft } from "lucide-react";
import { ChatterboxLogo } from "@/components/ChatterboxLogo";


export default function ChatterboxPage() {
  return (
      <SidebarProvider>
        <ChatterboxSidebar />
        <SidebarInset className="flex flex-col h-svh bg-background">
          {/* Mobile header with trigger and logo */}
          <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-card p-2 md:hidden h-[60px]">
            <div className="flex items-center gap-2">
                {/*
                  Removed asChild and the explicit span.
                  SidebarTrigger will now render its default Button with PanelLeft icon.
                  The default button within SidebarTrigger has a className of h-7 w-7.
                  If h-8 w-8 is strictly needed, className can be passed to SidebarTrigger.
                */}
                <SidebarTrigger className="h-8 w-8" />
                <ChatterboxLogo />
            </div>
          </header>
          <div className="flex-grow overflow-hidden">
            <ChatView />
          </div>
        </SidebarInset>
      </SidebarProvider>
  );
}
