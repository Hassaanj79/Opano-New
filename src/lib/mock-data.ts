
import type { User, Channel, Message, Draft, DocumentCategory, Document } from '@/types';
import * as Icons from 'lucide-react';

// User definitions (assuming hassyku786@gmail.com is the primary admin user)
export const initialMockUsers: User[] = [
  {
    id: 'u1-admin',
    name: 'Hassaan',
    email: 'hassyku786@gmail.com',
    avatarUrl: 'https://placehold.co/40x40.png?text=HA',
    isOnline: true,
    designation: 'Org Admin',
    role: 'admin',
    phoneNumber: '123-456-7890',
    linkedinProfileUrl: 'https://linkedin.com/in/hassaan',
    pronouns: 'He/Him',
  },
  {
    id: 'u5',
    name: 'Areeb',
    email: 'areeb@example.com',
    avatarUrl: 'https://placehold.co/40x40.png?text=AR',
    isOnline: true,
    designation: 'UI/UX Designer',
    role: 'member',
    pronouns: 'He/Him',
  },
  {
    id: 'u2',
    name: 'Hanzlah',
    email: 'hanzlah@example.com',
    avatarUrl: 'https://placehold.co/40x40.png?text=HZ',
    isOnline: false,
    designation: 'Frontend Developer',
    role: 'member',
    pronouns: 'He/Him',
  },
  {
    id: 'u3',
    name: 'Huzaifa',
    email: 'huzaifa@example.com',
    avatarUrl: 'https://placehold.co/40x40.png?text=HU',
    isOnline: true,
    designation: 'Backend Developer',
    role: 'member',
    pronouns: 'He/Him',
  },
  {
    id: 'u4',
    name: 'Fahad',
    email: 'fahad@example.com',
    avatarUrl: 'https://placehold.co/40x40.png?text=FA',
    isOnline: false,
    designation: 'QA Engineer',
    role: 'member',
    pronouns: 'He/Him',
  },
];

// Helper to get user IDs
const u1AdminId = initialMockUsers.find(u => u.email === 'hassyku786@gmail.com')!.id;
const u2HanzlahId = initialMockUsers.find(u => u.email === 'hanzlah@example.com')!.id;
const u3HuzaifaId = initialMockUsers.find(u => u.email === 'huzaifa@example.com')!.id;
const u4FahadId = initialMockUsers.find(u => u.email === 'fahad@example.com')!.id;
const u5AreebId = initialMockUsers.find(u => u.email === 'areeb@example.com')!.id;

const allUserIds = initialMockUsers.map(u => u.id);

// Dynamically get all admin IDs specifically for the admin lounge
const allAdminUserIds = initialMockUsers.filter(u => u.role === 'admin').map(u => u.id);

export let initialMockChannels: Channel[] = [
  {
    id: 'c1',
    name: 'general',
    description: 'Company-wide announcements and general chat.',
    memberIds: allUserIds,
    isPrivate: false,
  },
  {
    id: 'c2',
    name: 'project-phoenix',
    description: 'Discussions related to Project Phoenix.',
    memberIds: [u1AdminId, u2HanzlahId, u3HuzaifaId],
    isPrivate: false,
  },
  {
    id: 'c3',
    name: 'design-critiques',
    description: 'Feedback and discussions on UI/UX designs.',
    memberIds: [u1AdminId, u5AreebId],
    isPrivate: false,
  },
  {
    id: 'c4',
    name: 'random',
    description: 'Off-topic discussions, water cooler chat.',
    memberIds: allUserIds,
    isPrivate: false,
  },
  {
    id: 'c5',
    name: 'admin-private-lounge',
    description: 'Private channel for admin discussions.',
    memberIds: allAdminUserIds, // Updated to use allAdminUserIds
    isPrivate: true,
  },
].sort((a, b) => a.name.localeCompare(b.name));

export let mockMessages: Record<string, Message[]> = {
  c1: [ // General (channel ID: c1)
    { id: 'm1-c1', userId: 'system', content: `${initialMockUsers.find(u=>u.id === u1AdminId)?.name || 'Admin'} created the channel #general.`, timestamp: Date.now() - 1000 * 60 * 60 * 24 * 2, isSystemMessage: true },
    { id: 'm2-c1', userId: u1AdminId, content: 'Welcome everyone to the #general channel!', timestamp: Date.now() - 1000 * 60 * 60 * 24, reactions: { '🎉': [u2HanzlahId, u5AreebId] } },
    { id: 'm3-c1', userId: u2HanzlahId, content: 'Thanks! Glad to be here.', timestamp: Date.now() - 1000 * 60 * 50 },
    { id: 'm4-c1', userId: u5AreebId, content: 'Quick question: where can I find the holiday schedule?', timestamp: Date.now() - 1000 * 60 * 30 },
    { id: 'm5-c1', userId: u1AdminId, content: 'Hey @Areeb, it\'s pinned in the #announcements channel (if we had one!), or you can check the company portal.', timestamp: Date.now() - 1000 * 60 * 28, replyToMessageId: 'm4-c1', originalMessageSenderName: initialMockUsers.find(u=>u.id === u5AreebId)?.name, originalMessageContent: 'Quick question: where can I find the holiday schedule?' },
    { id: 'm6-c1', userId: u4FahadId, content: 'Looking forward to the team lunch next week!', timestamp: Date.now() - 1000 * 60 * 15 },
  ],
  c2: [ // Project Phoenix (channel ID: c2)
    { id: 'm1-c2', userId: u1AdminId, content: 'Kicking off Project Phoenix! Main goal: new user dashboard.', timestamp: Date.now() - 1000 * 60 * 120 },
    { id: 'm2-c2', userId: u2HanzlahId, content: 'Sounds good. I\'ll start on the frontend components for the dashboard.', timestamp: Date.now() - 1000 * 60 * 110, reactions: { '👍': [u1AdminId] } },
    { id: 'm3-c2', userId: u3HuzaifaId, content: 'I can handle the API endpoints for the dashboard data. What data points do we need initially?', timestamp: Date.now() - 1000 * 60 * 100 },
    { id: 'm4-c2', userId: u1AdminId, content: '@Hanzlah, let\'s sync on the design for the main graph component tomorrow morning.', timestamp: Date.now() - 1000 * 60 * 90, replyToMessageId: 'm2-c2', originalMessageSenderName: initialMockUsers.find(u=>u.id === u2HanzlahId)?.name, originalMessageContent: 'Sounds good. I\'ll start on the frontend components for the dashboard.' },
  ],
  c3: [ // Design Critiques (channel ID: c3)
    { id: 'm1-c3', userId: u5AreebId, content: 'Here\'s the first draft of the new login page: [Figma Link Placeholder]. Thoughts?', timestamp: Date.now() - 1000 * 60 * 150 },
    { id: 'm2-c3', userId: u1AdminId, content: 'Looks clean, Areeb! The orange primary button really pops. Maybe the password field could be a bit wider?', timestamp: Date.now() - 1000 * 60 * 140, reactions: {'❤️': [u5AreebId]}},
    { id: 'm3-c3', userId: u5AreebId, content: 'Good point, I\'ll adjust that. Thanks!', timestamp: Date.now() - 1000 * 60 * 135 },
  ],
  c4: [ // Random (channel ID: c4)
    { id: 'm1-c4', userId: u4FahadId, content: 'Anyone watch that new cat video compilation? Hilarious!', timestamp: Date.now() - 1000 * 60 * 10 },
    { id: 'm2-c4', userId: u2HanzlahId, content: 'Haha, yeah! The one with the cucumber and the cat jumping 5 feet in the air?', timestamp: Date.now() - 1000 * 60 * 5 },
    { id: 'm3-c4', userId: u3HuzaifaId, content: 'I prefer dog videos, to be honest.', timestamp: Date.now() - 1000 * 60 * 2 },
  ],
  c5: [ // Admin Private Lounge (channel ID: c5)
    { id: 'm1-c5', userId: u1AdminId, content: 'Need to plan the next team outing. Any suggestions for venues?', timestamp: Date.now() - 1000 * 60 * 200 },
  ],
  // DM conversations - Key is the other user's ID (since current user is dynamic)
  // These will be displayed if currentUser.id is one of the participants.
  // For mock setup, we'll assume u1AdminId is often the current user when testing these.
  [u2HanzlahId]: [ // DM with Hanzlah
    { id: 'dm1-u1a-u2', userId: u1AdminId, content: 'Hey Hanzlah, how\'s the new button component coming along?', timestamp: Date.now() - 1000 * 60 * 45 },
    { id: 'dm2-u1a-u2', userId: u2HanzlahId, content: 'Almost done! Just polishing the focus states. Should be ready by EOD.', timestamp: Date.now() - 1000 * 60 * 40 },
    { id: 'dm3-u1a-u2', userId: u1AdminId, content: 'Great to hear!', timestamp: Date.now() - 1000 * 60 * 38 },
  ],
  [u5AreebId]: [ // DM with Areeb
    { id: 'dm1-u1a-u5', userId: u5AreebId, content: 'Can I get your feedback on this icon set for the settings page?', timestamp: Date.now() - 1000 * 60 * 35, reactions: {'👍': [u1AdminId]} },
    { id: 'dm2-u1a-u5', userId: u1AdminId, content: 'Sure, send it over! I have some time now.', timestamp: Date.now() - 1000 * 60 * 33 },
  ],
  // "Self" DM for u1AdminId
  [u1AdminId]: [
    { id: 'self-dm1-u1a', userId: u1AdminId, content: 'To-do: Review Q3 budget proposal. #self #todo', timestamp: Date.now() - 1000 * 60 * 60 * 2 },
    { id: 'self-dm2-u1a', userId: u1AdminId, content: 'Remember to buy milk on the way home.', timestamp: Date.now() - 1000 * 60 * 30 },
  ],
};

export let initialMockDrafts: Draft[] = [
  {
    id: 'd1',
    content: 'This is a draft message for #general...',
    targetConversationId: 'c1',
    targetConversationName: 'general',
    targetConversationType: 'channel',
    timestamp: Date.now() - 1000 * 60 * 5,
  },
  {
    id: 'd2',
    content: 'Follow up with Hanzlah about the API integration.',
    targetConversationId: u2HanzlahId,
    targetConversationName: initialMockUsers.find(u => u.id === u2HanzlahId)?.name || 'Hanzlah',
    targetConversationType: 'dm',
    timestamp: Date.now() - 1000 * 60 * 60,
  },
];

// Helper function for creating document mock data
const createFileDoc = (idSuffix: string, name: string, type: string, lastModifiedDaysAgo: number, categoryId: string, hint: string = "document"): Document => ({
  id: `doc-file-${categoryId}-${idSuffix}`,
  name,
  type,
  docType: 'file',
  lastModified: new Date(Date.now() - 1000 * 60 * 60 * 24 * lastModifiedDaysAgo).toLocaleDateString(),
  fileUrl: `https://placehold.co/200x150.png?text=${encodeURIComponent(name.substring(0,10))}`,
  fileObject: new File(["mock content for " + name], name, { type }),
});

const createTextDoc = (idSuffix: string, name: string, content: string, lastModifiedDaysAgo: number, categoryId: string): Document => ({
  id: `doc-text-${categoryId}-${idSuffix}`,
  name,
  type: 'text/plain',
  docType: 'text',
  lastModified: new Date(Date.now() - 1000 * 60 * 60 * 24 * lastModifiedDaysAgo).toLocaleDateString(),
  textContent: content,
});

const createUrlDoc = (idSuffix: string, name: string, url: string, lastModifiedDaysAgo: number, categoryId: string): Document => ({
  id: `doc-url-${categoryId}-${idSuffix}`,
  name,
  type: 'url',
  docType: 'url',
  lastModified: new Date(Date.now() - 1000 * 60 * 60 * 24 * lastModifiedDaysAgo).toLocaleDateString(),
  fileUrl: url,
});


export let initialDocumentCategories: DocumentCategory[] = [
  {
    id: 'cat1',
    name: 'Project Specs',
    description: 'Detailed specifications for ongoing projects.',
    iconName: 'FileText',
    documents: [
      createFileDoc('spec1', 'Phoenix Project Brief.pdf', 'application/pdf', 2, 'cat1', 'brief document'),
      createTextDoc('notes1', 'Client Meeting Notes - Phoenix.txt', 'Client wants a blue button. Very important.', 5, 'cat1'),
    ],
  },
  {
    id: 'cat2',
    name: 'HR Policies',
    description: 'Company HR policies and guidelines.',
    iconName: 'BookUser',
    documents: [
      createFileDoc('hr1', 'Employee Handbook 2024.pdf', 'application/pdf', 30, 'cat2', 'handbook policy'),
      createUrlDoc('hr2', 'Online Benefits Portal', 'https://example.com/benefits', 10, 'cat2'),
    ],
  },
  {
    id: 'cat3',
    name: 'Marketing Materials',
    description: 'Brochures, presentations, and other marketing assets.',
    iconName: 'Megaphone',
    documents: [
      createFileDoc('mktg1', 'Company Brochure.pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 7, 'cat3', 'brochure presentation'),
      createFileDoc('mktg2', 'Logo Assets.zip', 'application/zip', 15, 'cat3', 'logo assets'),
      createTextDoc('mktg3', 'Ad Copy Q3.txt', 'New campaign slogan: "Opano: Connecting a Future!"', 1, 'cat3'),
    ],
  }
].sort((a, b) => a.name.localeCompare(b.name));


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

    
