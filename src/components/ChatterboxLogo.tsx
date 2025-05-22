import type { SVGProps } from 'react';
import { MessageSquareText } from 'lucide-react';

export function ChatterboxLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <div className="flex items-center gap-2 p-2" data-ai-logo>
      <MessageSquareText className="h-8 w-8 text-primary" />
      <span className="text-xl font-bold text-foreground">Chatterbox</span>
    </div>
  );
}
