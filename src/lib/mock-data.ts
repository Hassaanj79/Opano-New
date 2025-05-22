
import type { User, Channel, Message } from '@/types';

export const mockUsers: User[] = [
  { id: 'u1', name: 'Alice Wonderland', avatarUrl: 'https://placehold.co/40x40.png?text=AW', isOnline: true },
  { id: 'u2', name: 'Bob The Builder', avatarUrl: 'https://placehold.co/40x40.png?text=BB', isOnline: false },
  { id: 'u3', name: 'Charlie Brown', avatarUrl: 'https://placehold.co/40x40.png?text=CB', isOnline: true },
  { id: 'u4', name: 'Diana Prince', avatarUrl: 'https://placehold.co/40x40.png?text=DP', isOnline: true },
  { id: 'u5', name: 'Edward Scissorhands', avatarUrl: 'https://placehold.co/40x40.png?text=ES', isOnline: false },
];

export const mockCurrentUser: User = mockUsers[0]; // Alice Wonderland

export const mockChannels: Channel[] = [
  { id: 'c1', name: 'general', memberIds: ['u1', 'u2', 'u3', 'u4', 'u5'], description: 'General team discussions' },
  { id: 'c2', name: 'random', memberIds: ['u1', 'u3', 'u5'], description: 'Random thoughts and fun stuff' },
  { id: 'c3', name: 'project-phoenix', memberIds: ['u1', 'u2', 'u4', 'u3'], description: 'Discussion about Project Phoenix' },
  { id: 'c4', name: 'marketing', memberIds: ['u1', 'u2'], description: 'Marketing strategies and campaigns' },
];

export const mockMessages: Record<string, Message[]> = {
  c1: [
    { id: 'm1', userId: 'u2', content: 'Hello team!', timestamp: Date.now() - 1000 * 60 * 60 * 2 },
    { id: 'm2', userId: 'u1', content: 'Hi Bob! How is it going?', timestamp: Date.now() - 1000 * 60 * 58 },
    { id: 'm3', userId: 'u3', content: 'Anyone seen the new designs?', timestamp: Date.now() - 1000 * 60 * 30 },
    { id: 'm4', userId: 'u1', content: 'Yes, Charlie! They look great.', timestamp: Date.now() - 1000 * 60 * 25 },
    { id: 'm5', userId: 'u4', content: 'I agree, Alice. The color scheme is fantastic.', timestamp: Date.now() - 1000 * 60 * 10 },
    { id: 'm6', userId: 'u1', content: 'Let\'s discuss the project timeline in the #project-phoenix channel.', timestamp: Date.now() - 1000 * 60 * 5 },
  ],
  c2: [
    { id: 'm7', userId: 'u3', content: 'What\'s everyone\'s favorite pizza topping?', timestamp: Date.now() - 1000 * 60 * 15 },
    { id: 'm8', userId: 'u5', content: 'Pepperoni, classic!', timestamp: Date.now() - 1000 * 60 * 10 },
    {
      id: 'm9',
      userId: 'u1',
      content: 'I found this cool document about cats.',
      timestamp: Date.now() - 1000 * 60 * 5,
      file: { name: 'cats_are_awesome.pdf', url: '#', type: 'document' }
    },
  ],
  c3: [
    { id: 'm10', userId: 'u4', content: 'Project Phoenix update: We are on track for the Q3 deadline.', timestamp: Date.now() - 1000 * 60 * 120 },
    { id: 'm11', userId: 'u1', content: 'That\'s great news, Diana!', timestamp: Date.now() - 1000 * 60 * 115 },
    {
      id: 'm12',
      userId: 'u2',
      content: 'Here are the new mockups for the dashboard.',
      timestamp: Date.now() - 1000 * 60 * 60,
      file: { name: 'dashboard_mockups_v2.png', url: 'https://placehold.co/300x200.png', type: 'image' }
    },
    { id: 'm13', userId: 'u1', content: 'These mockups are fantastic, Bob! I love the new layout. The use of whitespace is really effective, and the color palette feels modern and inviting. The data visualizations are much clearer now. One small suggestion: perhaps we could make the primary call-to-action button a bit more prominent? Maybe by increasing its size slightly or using a stronger contrasting color. Also, have we considered A/B testing the placement of the search bar? I think it could be interesting to see if users find it more easily in the top right corner versus its current position. Overall, amazing progress!', timestamp: Date.now() - 1000 * 60 * 30},
    { id: 'm14', userId: 'u4', content: 'Good points, Alice. Let\'s consider those. I\'ll add them to the agenda for our next sync.', timestamp: Date.now() - 1000 * 60 * 20},
  ],
  c4: [
    { id: 'm15', userId: 'u2', content: 'Marketing campaign for Q3 ideas?', timestamp: Date.now() - 1000 * 60 * 45 },
  ],
  u2: [ // DM with Bob
    { id: 'dm1', userId: 'u1', content: 'Hey Bob, can we chat privately?', timestamp: Date.now() - 1000 * 60 * 5 },
    { id: 'dm2', userId: 'u2', content: 'Sure Alice, what\'s up?', timestamp: Date.now() - 1000 * 60 * 4 },
  ],
  u3: [ // DM with Charlie
    { id: 'dm3', userId: 'u1', content: 'Hi Charlie!', timestamp: Date.now() - 1000 * 60 * 20 },
  ],
  u4: [], // Empty DM with Diana
  u5: [], // Empty DM with Edward
};

// Function to get messages for a conversation
export const getMessagesForConversation = (conversationId: string): Message[] => {
  return mockMessages[conversationId] || [];
};
