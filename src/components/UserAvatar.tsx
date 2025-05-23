
import type { User } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type UserAvatarProps = {
  user?: User | null; // Allow user to be null
  className?: string;
};

export function UserAvatar({ user, className }: UserAvatarProps) {
  if (!user) {
    // Fallback for when user is null (e.g., not logged in)
    return (
      <Avatar className={className}>
        <AvatarFallback>??</AvatarFallback>
      </Avatar>
    );
  }

  const fallbackName = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : '??';

  return (
    <div className="relative">
      <Avatar className={className}>
        <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="profile picture" />
        <AvatarFallback>{fallbackName}</AvatarFallback>
      </Avatar>
      {user.isOnline && (
        <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
      )}
    </div>
  );
}
