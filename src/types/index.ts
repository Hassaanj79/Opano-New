
export type UserRole = 'admin' | 'member';

export type User = {
  id: string;
  name: string;
  avatarUrl?: string;
  isOnline: boolean;
  designation?: string;
  email: string;
  phoneNumber?: string;
  linkedinProfileUrl?: string;
  pronouns?: string;
  role: UserRole; // Added role
};

export type Channel = {
  id: string;
  name: string;
  memberIds: string[];
  description?: string;
  isPrivate?: boolean;
};

export type MessageFile = {
  name: string;
  url: string;
  type: 'image' | 'document' | 'audio' | 'other';
  duration?: number;
};

export type Message = {
  id: string;
  userId: string;
  content: string;
  timestamp: number;
  file?: MessageFile;
  reactions?: { [emoji: string]: string[] };
  isEdited?: boolean;
  isSystemMessage?: boolean;
  replyToMessageId?: string;
  originalMessageSenderName?: string;
  originalMessageContent?: string;
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
  targetConversationId: string;
  targetConversationName: string;
  targetConversationType: 'channel' | 'dm';
  content: string;
  timestamp: number;
};

export type ActivityItem = {
  id: string;
  message: Message;
  reactor: User;
  emoji: string;
  timestamp: number;
  conversationName: string;
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

export type LeaveRequest = {
  id: string;
  userId: string;
  startDate: Date;
  endDate: Date;
  reason: string;
  status: 'pending' | 'approved' | 'rejected'; // Basic statuses
  requestDate: Date;
};

export interface Document {
  id: string;
  name: string;
  type: string;
  docType: 'file' | 'text' | 'url';
  lastModified: string;
  fileUrl?: string;
  fileObject?: File;
  textContent?: string;
}

export interface DocumentCategory {
  id: string;
  name: string;
  description: string;
  iconName: keyof typeof import("lucide-react") | 'Users' | 'Briefcase' | 'Megaphone' | 'Settings' | 'DollarSign' | 'FolderKanban';
  documents: Document[];
}
