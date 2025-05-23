
export type User = {
  id: string;
  name: string;
  avatarUrl?: string;
  isOnline: boolean;
  designation?: string; // Added designation
};

export type Channel = {
  id: string;
  name: string;
  memberIds: string[];
  description?: string;
  isPrivate?: boolean; // Added for lock icon
};

export type MessageFile = {
  name: string;
  url: string;
  type: 'image' | 'document' | 'other';
};

export type Message = {
  id: string;
  userId: string;
  content: string;
  timestamp: number; // Unix timestamp
  file?: MessageFile;
  reactions?: { [emoji: string]: string[] }; // userId array for who reacted
};

export type ActiveConversation = {
  type: 'channel' | 'dm';
  id: string;
  name: string;
  recipient?: User;
  channel?: Channel;
} | null;

export type PendingInvitation = {
  email: string;
  token: string;
  timestamp: number;
};
