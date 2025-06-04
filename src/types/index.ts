
import type { LucideIcon } from 'lucide-react';

export type UserRole = 'admin' | 'member';

export interface User {
  id: string;
  name: string;
  avatarUrl?: string;
  isOnline: boolean;
  designation?: string;
  email: string; // Made email mandatory for Firebase
  role: UserRole;
  phoneNumber?: string;
  linkedinProfileUrl?: string;
  pronouns?: string;
}

export interface Channel {
  id: string;
  name: string;
  memberIds: string[];
  description?: string;
  isPrivate: boolean;
}

export interface MessageFile {
  name: string;
  url: string;
  type: 'image' | 'document' | 'audio' | 'other';
  fileObject?: File; // Store the actual file object for sharing
}

export interface Message {
  id:string;
  userId: string; // Can be 'system' for system messages
  content: string;
  timestamp: number;
  file?: MessageFile;
  reactions?: { [emoji: string]: string[] };
  isEdited?: boolean;
  isSystemMessage?: boolean;
  replyToMessageId?: string;
  originalMessageSenderName?: string;
  originalMessageContent?: string;
}

export type ActiveConversation = {
  type: 'channel' | 'dm';
  id: string;
  name: string;
  recipient?: User; // For DMs
  channel?: Channel; // For channels
} | null;

export type CurrentView = 'chat' | 'replies' | 'activity' | 'drafts';

export interface PendingInvitation {
  email: string;
  token: string;
  timestamp: number;
}

export interface Draft {
  id: string;
  content: string;
  targetConversationId: string;
  targetConversationName: string;
  targetConversationType: 'channel' | 'dm';
  timestamp: number;
}

export interface ActivityItem {
  id: string;
  reactor: User;
  message: Message;
  emoji: string;
  timestamp: number;
  conversationId: string;
  conversationName: string;
  conversationType: 'channel' | 'dm';
}

export interface Document {
  id: string;
  name: string;
  type: string; // MIME type for files, or 'text' for in-app, 'url' for external links
  docType: 'file' | 'text' | 'url';
  lastModified: string; // ISO string or formatted date
  fileUrl?: string; // For uploaded files or external URLs
  textContent?: string; // For in-app created text documents
  fileObject?: File; // To store the actual file object
}

export interface DocumentCategory {
  id: string;
  name: string;
  description: string;
  iconName: keyof typeof import("lucide-react");
  documents: Document[];
}

export interface AttendanceLogEntry {
  id: string;
  clockInTime: Date;
  clockOutTime: Date;
  totalHoursWorked: number; // in seconds
  totalActivityPercent: number; // 0-100
  totalBreakDuration?: number; // in seconds
}

export interface LeaveRequest {
  id: string;
  userId: string; // User who requested
  requestDate: Date; // Date the request was made
  startDate: Date;
  endDate: Date;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string; // For admin's reason for approval/rejection
}

