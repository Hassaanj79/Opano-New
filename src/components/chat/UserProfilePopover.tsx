
"use client";

import type { User } from '@/types';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { UserAvatar } from '@/components/UserAvatar';
import { Badge } from '@/components/ui/badge';

interface UserProfilePopoverProps {
  user: User | undefined; // Make user potentially undefined to handle edge cases
  children: React.ReactNode;
  popoverSide?: "top" | "bottom" | "left" | "right";
  popoverAlign?: "start" | "center" | "end";
}

export function UserProfilePopover({ user, children, popoverSide = "right", popoverAlign = "start" }: UserProfilePopoverProps) {
  if (!user) {
    return <>{children}</>; // If no user data, just render the trigger
  }

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-auto max-w-xs p-4" side={popoverSide} align={popoverAlign}>
        <div className="flex flex-col items-center text-center">
          <UserAvatar user={user} className="h-16 w-16 mb-3" />
          <h3 className="text-lg font-semibold text-foreground">{user.name}</h3>
          {user.designation && (
            <p className="text-sm text-muted-foreground mt-0.5">{user.designation}</p>
          )}
          <Badge variant={user.isOnline ? "default" : "secondary"} className={`mt-2 text-xs ${user.isOnline ? 'bg-green-500 hover:bg-green-600 text-white' : ''}`}>
            {user.isOnline ? "Online" : "Offline"}
          </Badge>
        </div>
      </PopoverContent>
    </Popover>
  );
}
