
export type User = {
  id: string;
  name: string;
  avatarUrl?: string;
  isOnline: boolean;
  designation?: string; // Keep for basic profile
  email?: string; // Keep for basic profile
};

export type Channel = {
  id: string;
  name: string;
  memberIds: string[];
  description?: string;
  isPrivate?: boolean; // Keep basic private channel concept
};

export type MessageFile = {
  name: string;
  url: string;
  type: 'image' | 'document' | 'audio' | 'other';
};

export type Message = {
  id:string;
  userId: string;
  content: string;
  timestamp: number;
  file?: MessageFile;
  reactions?: { [emoji: string]: string[] }; // Basic reactions
  isEdited?: boolean;
  isSystemMessage?: boolean;
};

export type ActiveConversation = {
  type: 'channel' | 'dm';
  id: string;
  name: string;
  recipient?: User;
  channel?: Channel;
} | null;

// Removed PendingInvitation, Draft, ActivityItem, Document types, LeaveRequest, UserRole
// CurrentView is simplified or handled implicitly by activeConversation
export type CurrentView = 'chat'; // Simplified
