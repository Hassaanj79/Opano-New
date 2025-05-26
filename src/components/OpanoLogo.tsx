
import type { SVGProps } from 'react';
import { MessageSquareText } from 'lucide-react'; // Reverted to MessageSquareText

export function OpanoLogo(props: SVGProps<SVGSVGElement>) { // Function name changed to OpanoLogo
  return (
    <div className="flex items-center gap-1.5 p-1 group-data-[collapsible=icon]:justify-center" data-ai-logo>
      <MessageSquareText className="h-6 w-6 text-primary group-data-[collapsible=icon]:h-7 group-data-[collapsible=icon]:w-7" />
      <span className="text-lg font-bold text-foreground group-data-[collapsible=icon]:hidden">Opano</span> {/* Text changed */}
    </div>
  );
}
