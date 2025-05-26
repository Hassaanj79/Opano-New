
"use client";
import { useAppContext } from '@/contexts/AppContext';
import { Hash, UserCircle2 } from 'lucide-react'; // Removed Sparkles, UserPlus, Phone, Users

export function ChatHeader() {
  const { activeConversation, currentUser } = useAppContext();

  if (!activeConversation || !currentUser) return null;

  const name = activeConversation.name;
  const description = activeConversation.type === 'channel'
    ? `${activeConversation.channel?.memberIds.length || 0} Members`
    : (activeConversation.recipient?.designation || (activeConversation.recipient?.isOnline ? 'Online' : 'Offline'));

  return (
    <>
      <div className="flex items-center justify-between p-3 border-b border-border h-[60px] bg-background">
        <div className="flex items-center gap-2">
          {activeConversation.type === 'channel' ? (
            <Hash className="h-5 w-5 text-muted-foreground" />
          ) : (
            <UserCircle2 className="h-5 w-5 text-muted-foreground" />
          )}
          <div>
            <h2 className="text-base font-semibold text-foreground">{name}</h2>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Call, Summary, Add/View Members buttons removed for simplicity */}
        </div>
      </div>
      {/* Dialogs removed */}
    </>
  );
}
