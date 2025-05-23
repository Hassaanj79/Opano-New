
import type { SVGProps } from 'react';
import { MessageSquareText } from 'lucide-react';

export function ChatterboxLogo(props: SVGProps<SVGSVGElement>) {
  // The image shows "Loopz" as text. For now, we keep Chatterbox but can make it dynamic.
  // The image also implies a different logo icon.
  return (
    <div className="flex items-center gap-1.5 p-1 group-data-[collapsible=icon]:justify-center" data-ai-logo>
      <MessageSquareText className="h-6 w-6 text-primary group-data-[collapsible=icon]:h-7 group-data-[collapsible=icon]:w-7" />
      <span className="text-lg font-bold text-foreground group-data-[collapsible=icon]:hidden">Chatterbox</span>
      {/* If we want to match "Loopz": 
      <span className="text-lg font-bold text-foreground group-data-[collapsible=icon]:hidden">Loopz</span> 
      */}
    </div>
  );
}
