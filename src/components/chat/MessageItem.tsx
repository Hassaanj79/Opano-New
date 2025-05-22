
"use client";
import type { Message, User } from '@/types';
import { useAppContext } from '@/contexts/AppContext';
import { UserAvatar } from '@/components/UserAvatar';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface MessageItemProps {
  message: Message;
}

export function MessageItem({ message }: MessageItemProps) {
  const { users, currentUser } = useAppContext();
  const sender = users.find(u => u.id === message.userId) || (message.userId === currentUser.id ? currentUser : undefined);

  return (
    <div className="flex gap-3 py-3 px-4 hover:bg-muted/50 rounded-md">
      <UserAvatar user={sender} className="h-10 w-10 flex-shrink-0 mt-1" />
      <div className="flex-grow">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">{sender?.name || 'Unknown User'}</span>
          <span className="text-xs text-muted-foreground">
            {format(new Date(message.timestamp), 'p')}
          </span>
        </div>
        <p className="text-sm text-foreground/90 whitespace-pre-wrap">{message.content}</p>
        {message.file && (
          <Card className="mt-2 max-w-xs bg-card/50 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                {message.file.type === 'image' ? (
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <FileText className="h-5 w-5 text-muted-foreground" />
                )}
                <a href={message.file.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate">
                  {message.file.name}
                </a>
              </div>
              {message.file.type === 'image' && message.file.url.startsWith('https://placehold.co') && (
                 <Image 
                    src={message.file.url} 
                    alt={message.file.name} 
                    width={200} 
                    height={150} 
                    className="mt-2 rounded-md object-cover"
                    data-ai-hint="placeholder image"
                 />
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
