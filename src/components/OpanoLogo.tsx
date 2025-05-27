
import type { SVGProps } from 'react';
import { Link } from 'lucide-react'; // Changed from MessageSquareText to Link

export function OpanoLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <div className="flex items-center gap-1.5 p-1 group-data-[collapsible=icon]:justify-center" data-ai-logo>
      {/* The Link icon is used here to represent the logo mark, styled with the primary color */}
      <Link className="h-6 w-6 text-primary group-data-[collapsible=icon]:h-7 group-data-[collapsible=icon]:w-7" />
      <span className="text-lg font-bold text-foreground group-data-[collapsible=icon]:hidden">Opano</span>
    </div>
  );
}
