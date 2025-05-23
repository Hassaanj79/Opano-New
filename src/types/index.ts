
export type User = {
  id: string;
  name: string;
  avatarUrl?: string;
  isOnline: boolean;
  designation?: string;
  email: string; // Made email non-optional for profile editing
  phoneNumber?: string;
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
  type: 'image' | 'document' | 'audio' | 'other'; // Added 'audio'
  duration?: number; // Optional: for audio/video duration
};

export type Message = {
  id: string;
  userId: string;
  content: string;
  timestamp: number; // Unix timestamp
  file?: MessageFile;
  reactions?: { [emoji: string]: string[] }; // emoji: array of userIds
  isEdited?: boolean; // To indicate if a message was edited
  isSystemMessage?: boolean; // Added for system messages
  replyToMessageId?: string; // ID of the message this is a reply to
  originalMessageSenderName?: string; // Name of the sender of the original message
  originalMessageContent?: string; // Snippet of the original message content
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

export type Draft = {
  id: string;
  targetConversationId: string; // Can be a channel ID or a user ID for DMs
  targetConversationName: string; // e.g., "#general" or "Hanzlah"
  targetConversationType: 'channel' | 'dm';
  content: string;
  timestamp: number;
};

export type ActivityItem = {
  id: string; // Unique ID for the activity item, e.g., messageId + reactorId + emoji
  message: Message;
  reactor: User;
  emoji: string;
  timestamp: number; // Could be reaction timestamp if available, or message timestamp
  conversationName: string; // e.g. "#general" or "DM with Hanzlah"
  conversationId: string;
  conversationType: 'channel' | 'dm';
};

export type CurrentView = 'chat' | 'replies' | 'activity' | 'drafts';

export type AttendanceLogEntry = {
  id: string;
  clockInTime: Date;
  clockOutTime: Date;
  totalHoursWorked: number; // in seconds
  totalActivityPercent: number;
};

// Document Management Types
export interface Document {
  id: string;
  name: string;
  type: string; // e.g., 'pdf', 'docx', 'png' for file uploads, 'text/plain' for created docs, 'external/link' for URLs
  docType: 'file' | 'text' | 'url'; // Distinguishes between uploaded files, in-app created text docs, and external links
  lastModified: string; // ISO string or formatted date
  fileUrl?: string; // For local preview of uploaded files (URL.createObjectURL) OR the external URL for 'url' type
  fileObject?: File; // Store the actual file object if needed (not persisted for files)
  textContent?: string; // Content for in-app created text documents
}

export interface DocumentCategory {
  id: string;
  name: string;
  description: string;
  // Storing icon name as string, to be resolved to component in UI
  iconName: keyof typeof import("lucide-react") | 'Users' | 'Briefcase' | 'Megaphone' | 'Settings' | 'DollarSign' | 'FolderKanban';
  documents: Document[];
}
