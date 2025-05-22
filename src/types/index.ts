export type User = {
  id: string;
  name: string;
  avatarUrl?: string;
  isOnline: boolean;
};

export type Channel = {
  id: string;
  name: string;
  memberCount: number;
  description?: string;
};

export type MessageFile = {
  name: string;
  url: string; // For simplicity, direct URL. In reality, might be more complex.
  type: 'image' | 'document' | 'other'; // To potentially render previews or icons
};

export type Message = {
  id: string;
  userId: string;
  content: string;
  timestamp: number; // Unix timestamp
  file?: MessageFile;
};

export type ActiveConversation = {
  type: 'channel' | 'dm';
  id: string;
  name: string;
  recipient?: User; // For DMs
  channel?: Channel; // For channels
} | null;
