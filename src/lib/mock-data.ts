
import type { User, Channel, Message } from '@/types';

export const initialMockCurrentUser: User = {
  id: 'u1',
  name: 'Hassaan',
  avatarUrl: 'https://placehold.co/40x40.png?text=ME',
  isOnline: true,
  designation: 'Lead Developer',
  email: 'hassaan@example.com',
};

export const initialMockUsers: User[] = [
  initialMockCurrentUser,
  {
    id: 'u2',
    name: 'Hanzlah',
    email: 'hanzlah@example.com',
    avatarUrl: 'https://placehold.co/40x40.png?text=HA',
    isOnline: false,
    designation: 'Frontend Developer',
  },
  {
    id: 'u3',
    name: 'Huzaifa',
    email: 'huzaifa@example.com',
    avatarUrl: 'https://placehold.co/40x40.png?text=HU',
    isOnline: true,
    designation: 'Backend Developer',
  },
  {
    id: 'u4',
    name: 'Fahad',
    email: 'fahad@example.com',
    avatarUrl: 'https://placehold.co/40x40.png?text=FA',
    isOnline: false,
    designation: 'QA Engineer',
  },
  {
    id: 'u5',
    name: 'Areeb',
    email: 'areeb@example.com',
    avatarUrl: 'https://placehold.co/40x40.png?text=AR',
    isOnline: true,
    designation: 'UI/UX Designer',
  },
];

export let initialMockChannels: Channel[] = [
  {
    id: 'c1',
    name: 'general',
    memberIds: ['u1', 'u2', 'u3', 'u4', 'u5'],
    description: 'General chat for everyone',
    isPrivate: false,
  },
  {
    id: 'c2',
    name: 'project-alpha',
    memberIds: ['u1', 'u2', 'u3'],
    description: 'Discussions for Project Alpha',
    isPrivate: true,
  },
];

export let mockMessages: Record<string, Message[]> = {
  c1: [
    { id: 'm1', userId: 'u2', content: 'Hello everyone!', timestamp: Date.now() - 100000, reactions: {'👍': ['u1']} },
    { id: 'm2', userId: 'u1', content: 'Hi Hanzlah!', timestamp: Date.now() - 90000 },
  ],
  c2: [
    { id: 'm3', userId: 'u1', content: 'Project Alpha meeting at 3 PM.', timestamp: Date.now() - 50000 },
  ],
  u2: [ // DM with Hanzlah
    { id: 'dm1', userId: 'u1', content: 'Hey Hanzlah, how are you?', timestamp: Date.now() - 200000 },
    { id: 'dm2', userId: 'u2', content: 'Doing good, Hassaan! You?', timestamp: Date.now() - 190000 },
  ],
  u1: [ // Notes to self
    { id: 'self1', userId: 'u1', content: 'Remember to deploy on Friday.', timestamp: Date.now() - 300000 },
  ]
};

export const getMessagesForConversation = (conversationId: string): Message[] => {
  const msgs = mockMessages[conversationId] || [];
  return msgs.map(msg => ({ ...msg, reactions: msg.reactions ? { ...msg.reactions } : {} }));
};

export const updateMockMessage = (conversationId: string, messageId: string, updatedMessageData: Partial<Message>) => {
  if (mockMessages[conversationId]) {
    const messageIndex = mockMessages[conversationId].findIndex(msg => msg.id === messageId);
    if (messageIndex !== -1) {
      mockMessages[conversationId][messageIndex] = {
        ...mockMessages[conversationId][messageIndex],
        ...updatedMessageData,
      };
    }
  }
};
