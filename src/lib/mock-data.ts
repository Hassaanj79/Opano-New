
import type { User, Channel, Message, Draft } from '@/types';

export const mockUsers: User[] = [
  { id: 'u1', name: 'Hassaan', avatarUrl: 'https://placehold.co/40x40.png?text=HA', isOnline: true, designation: 'Lead Designer', email: 'hassaan@example.com', phoneNumber: '123-456-7890' },
  { id: 'u2', name: 'Hanzlah', avatarUrl: 'https://placehold.co/40x40.png?text=HA', isOnline: false, designation: 'Engineer', email: 'hanzlah@example.com' },
  { id: 'u3', name: 'Huzaifa', avatarUrl: 'https://placehold.co/40x40.png?text=HU', isOnline: true, designation: 'Product Manager', email: 'huzaifa@example.com' },
  { id: 'u4', name: 'Fahad', avatarUrl: 'https://placehold.co/40x40.png?text=FA', isOnline: true, designation: 'UX Researcher', email: 'fahad@example.com' },
  { id: 'u5', name: 'Areeb', avatarUrl: 'https://placehold.co/40x40.png?text=AR', isOnline: false, designation: 'Frontend Dev', email: 'areeb@example.com' },
];

// Ensure mockCurrentUser's email is non-optional
export const mockCurrentUser: User = { ...mockUsers[0], email: mockUsers[0].email || 'currentuser@example.com' };

export const mockChannels: Channel[] = [
  { id: 'c1', name: 'general', memberIds: ['u1', 'u2', 'u3', 'u4', 'u5'], description: 'General team discussions', isPrivate: false },
  { id: 'c2', name: 'random', memberIds: ['u1', 'u3', 'u5'], description: 'Random thoughts and fun stuff', isPrivate: false },
  { id: 'c3', name: 'design-team', memberIds: ['u1', 'u2', 'u4', 'u3'], description: 'Discussion about Project Phoenix', isPrivate: true }, // Renamed from design_team
  { id: 'c4', name: 'marketing-updates', memberIds: ['u1', 'u2'], description: 'Marketing strategies and campaigns', isPrivate: false }, // Renamed from marketing_team
];

export const mockMessages: Record<string, Message[]> = {
  c1: [ // General channel
    { id: 'm1', userId: 'u2', content: 'Hello team!', timestamp: Date.now() - 1000 * 60 * 60 * 2, reactions: {'👍': ['u1', 'u3']} },
    { id: 'm2', userId: 'u1', content: 'Hi Hanzlah! How is it going?', timestamp: Date.now() - 1000 * 60 * 58 },
    { id: 'm3', userId: 'u3', content: 'Anyone seen the new designs? @Hassaan, your input would be great.', timestamp: Date.now() - 1000 * 60 * 30, reactions: {'👀': ['u2']}}, // Added mention for replies
    { id: 'm4', userId: 'u1', content: 'Yes, Huzaifa! They look great. Just shared them.', timestamp: Date.now() - 1000 * 60 * 25, reactions: {'🚀': ['u3'], '❤️': ['u2', 'u4']} }, // Message by u1 with reactions for activity
    { id: 'm5', userId: 'u4', content: 'I agree, Hassaan. The color scheme is fantastic.', timestamp: Date.now() - 1000 * 60 * 10 },
    { id: 'm6', userId: 'u1', content: 'Let\'s discuss the project timeline in the #design-team channel.', timestamp: Date.now() - 1000 * 60 * 5 },
  ],
  c2: [ // Random channel
    { id: 'm7', userId: 'u3', content: 'What\'s everyone\'s favorite pizza topping?', timestamp: Date.now() - 1000 * 60 * 15, reactions: {'🍕': ['u1', 'u5']} },
    { id: 'm8', userId: 'u5', content: 'Pepperoni, classic!', timestamp: Date.now() - 1000 * 60 * 10 },
    {
      id: 'm9',
      userId: 'u1', // Message by current user
      content: 'I found this cool document about cats. @Hanzlah check it out',
      timestamp: Date.now() - 1000 * 60 * 5,
      file: { name: 'cats_are_awesome.pdf', url: '#', type: 'document' },
      reactions: {'👍': ['u2', 'u5']} // Reaction by Hanzlah (u2) for activity
    },
  ],
  c3: [ // design-team
    { id: 'msg-design-1', userId: 'u4', content: "I have submitted the Final design of Novex Studio to @Hassaan", timestamp: Date.now() - 1000 * 60 * 120, reactions: {'👍': ['u1']}},
    { id: 'msg-design-2', userId: 'u1', content: "Yes, I received it", timestamp: Date.now() - 1000 * 60 * 115, reactions: {'👍': ['u4'], '❤️': ['u2']} },
    { id: 'msg-design-3', userId: 'u2', content: "Yep, I just checked it!", timestamp: Date.now() - 1000 * 60 * 60 },
    { id: 'msg-design-4', userId: 'u3', content: "Let me discuss it with @Areeb", timestamp: Date.now() - 1000 * 60 * 55 },
    { id: 'msg-design-5', userId: 'u1', content: "@Fahad waiting for your response", timestamp: Date.now() - 1000 * 60 * 50 },
    { id: 'msg-design-6', userId: 'u1', content: "Yeah, yeah. But 🚀! Is this in Drive Folder?", timestamp: Date.now() - 1000 * 60 * 45 },
    { id: 'msg-design-7', userId: 'u4', content: "@Areeb, It's okay from my side 👍", timestamp: Date.now() - 1000 * 60 * 10 },
  ],
  c4: [ // marketing-updates
    { id: 'm15', userId: 'u2', content: 'Marketing campaign for Q3 ideas?', timestamp: Date.now() - 1000 * 60 * 45 },
  ],
  u2: [ // DM with Hanzlah
    { id: 'dm1', userId: 'u1', content: 'Hey Hanzlah, can we chat privately?', timestamp: Date.now() - 1000 * 60 * 5 },
    { id: 'dm2', userId: 'u2', content: 'Sure Hassaan, what\'s up?', timestamp: Date.now() - 1000 * 60 * 4, reactions: {'👋': ['u1']}},
  ],
  u3: [ // DM with Huzaifa
    { id: 'dm3', userId: 'u1', content: 'Hi Huzaifa!', timestamp: Date.now() - 1000 * 60 * 20 },
    { id: 'dm4', userId: 'u3', content: 'Hey Hassaan, how are you? Need to discuss the latest drone shots I sent.', timestamp: Date.now() - 1000 * 60 * 18, reactions: { '👍': ['u1']}},
    { id: 'dm5', userId: 'u1', content: 'Sure, let\'s sync up!', timestamp: Date.now() - 1000 * 60 * 15 }
  ],
  u1: [ // DM with Self (Hassaan)
    { id: 'self-dm1', userId: 'u1', content: 'Note to self: Remember to buy milk.', timestamp: Date.now() - 1000 * 60 * 60 * 3 },
    { id: 'self-dm2', userId: 'u1', content: 'Draft: Project Phoenix update email...', timestamp: Date.now() - 1000 * 60 * 30 },
  ],
  u4: [], // Empty DM with Fahad
  u5: [], // Empty DM with Areeb
};

export const mockDrafts: Draft[] = [
  {
    id: 'draft1',
    targetConversationId: 'c1', // #general
    targetConversationName: '#general',
    targetConversationType: 'channel',
    content: 'Remember to ask about the Q3 budget planning and if we have a finalized date for the all-hands meeting.',
    timestamp: Date.now() - 1000 * 60 * 5,
  },
  {
    id: 'draft2',
    targetConversationId: 'u2', // Hanzlah
    targetConversationName: 'Hanzlah',
    targetConversationType: 'dm',
    content: 'Can we reschedule our sync for tomorrow morning? Something came up for the afternoon slot.',
    timestamp: Date.now() - 1000 * 60 * 120,
  },
  {
    id: 'draft3',
    targetConversationId: 'c3', // #design-team
    targetConversationName: '#design-team',
    targetConversationType: 'channel',
    content: 'Final check on the color palette for the new branding guidelines.',
    timestamp: Date.now() - 1000 * 60 * 30,
  }
];


// Function to get messages for a conversation
export const getMessagesForConversation = (conversationId: string): Message[] => {
  const msgs = mockMessages[conversationId] || [];
  return msgs.map(msg => ({ ...msg, reactions: msg.reactions ? { ...msg.reactions } : undefined }));
};

// Helper to update mock messages (simulating backend persistence)
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
