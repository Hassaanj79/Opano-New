
import type { User, Channel, Message } from '@/types';

export const mockUsers: User[] = [
  { id: 'u1', name: 'Alice Wonderland', avatarUrl: 'https://placehold.co/40x40.png?text=AW', isOnline: true, designation: 'Lead Designer' },
  { id: 'u2', name: 'Bob The Builder', avatarUrl: 'https://placehold.co/40x40.png?text=BB', isOnline: false, designation: 'Engineer' },
  { id: 'u3', name: 'Charlie Brown', avatarUrl: 'https://placehold.co/40x40.png?text=CB', isOnline: true, designation: 'Product Manager' },
  { id: 'u4', name: 'Diana Prince', avatarUrl: 'https://placehold.co/40x40.png?text=DP', isOnline: true, designation: 'UX Researcher' },
  { id: 'u5', name: 'Edward Scissorhands', avatarUrl: 'https://placehold.co/40x40.png?text=ES', isOnline: false, designation: 'Frontend Dev' },
];

export const mockCurrentUser: User = mockUsers[0]; // Alice Wonderland

export const mockChannels: Channel[] = [
  { id: 'c1', name: 'general', memberIds: ['u1', 'u2', 'u3', 'u4', 'u5'], description: 'General team discussions', isPrivate: false },
  { id: 'c2', name: 'random', memberIds: ['u1', 'u3', 'u5'], description: 'Random thoughts and fun stuff', isPrivate: false },
  { id: 'c3', name: 'design_team', memberIds: ['u1', 'u2', 'u4', 'u3'], description: 'Discussion about Project Phoenix', isPrivate: true }, // Made private
  { id: 'c4', name: 'marketing_team', memberIds: ['u1', 'u2'], description: 'Marketing strategies and campaigns', isPrivate: false },
];

export const mockMessages: Record<string, Message[]> = {
  c1: [
    { id: 'm1', userId: 'u2', content: 'Hello team!', timestamp: Date.now() - 1000 * 60 * 60 * 2, reactions: {'👍': ['u1']} },
    { id: 'm2', userId: 'u1', content: 'Hi Bob! How is it going?', timestamp: Date.now() - 1000 * 60 * 58 },
    { id: 'm3', userId: 'u3', content: 'Anyone seen the new designs?', timestamp: Date.now() - 1000 * 60 * 30 },
    { id: 'm4', userId: 'u1', content: 'Yes, Charlie! They look great.', timestamp: Date.now() - 1000 * 60 * 25, reactions: {'🚀': ['u3'], '❤️': ['u2']} },
    { id: 'm5', userId: 'u4', content: 'I agree, Alice. The color scheme is fantastic.', timestamp: Date.now() - 1000 * 60 * 10 },
    { id: 'm6', userId: 'u1', content: 'Let\'s discuss the project timeline in the #design_team channel.', timestamp: Date.now() - 1000 * 60 * 5 },
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
  c3: [ // design_team
    { id: 'msg-design-1', userId: 'u4', content: "I have submitted the Final design of Novex Studio to @Alice", timestamp: Date.now() - 1000 * 60 * 120, reactions: {'👍': ['u1']}},
    { id: 'msg-design-2', userId: 'u1', content: "Yes, I received it", timestamp: Date.now() - 1000 * 60 * 115, reactions: {'👍': ['u4'], '❤️': ['u2']} },
    { id: 'msg-design-3', userId: 'u2', content: "Yep, I just checked it!", timestamp: Date.now() - 1000 * 60 * 60 },
    { id: 'msg-design-4', userId: 'u3', content: "Let me discuss it with @Paoulo", timestamp: Date.now() - 1000 * 60 * 55 },
    { id: 'msg-design-5', userId: 'u1', content: "@Alice waiting for your response", timestamp: Date.now() - 1000 * 60 * 50 },
    { id: 'msg-design-6', userId: 'u1', content: "Yeah, yeah. But 🚀! Is this in Drive Folder?", timestamp: Date.now() - 1000 * 60 * 45 },
    { id: 'msg-design-7', userId: 'u4', content: "@Paoulo, It's okay from my side 👍", timestamp: Date.now() - 1000 * 60 * 10 },
  ],
  c4: [ // marketing_team
    { id: 'm15', userId: 'u2', content: 'Marketing campaign for Q3 ideas?', timestamp: Date.now() - 1000 * 60 * 45 },
  ],
  u2: [ // DM with Bob
    { id: 'dm1', userId: 'u1', content: 'Hey Bob, can we chat privately?', timestamp: Date.now() - 1000 * 60 * 5 },
    { id: 'dm2', userId: 'u2', content: 'Sure Alice, what\'s up?', timestamp: Date.now() - 1000 * 60 * 4 },
  ],
  u3: [ // DM with Charlie
    { id: 'dm3', userId: 'u1', content: 'Hi Charlie!', timestamp: Date.now() - 1000 * 60 * 20 },
    { id: 'dm4', userId: 'u3', content: 'Hey Alice, how are you? Need to discuss the latest drone shots I sent.', timestamp: Date.now() - 1000 * 60 * 18, reactions: { '👍': ['u1']}},
    { id: 'dm5', userId: 'u1', content: 'Sure, let\'s sync up!', timestamp: Date.now() - 1000 * 60 * 15 }
  ],
  u4: [], // Empty DM with Diana
  u5: [], // Empty DM with Edward
};

// Function to get messages for a conversation
export const getMessagesForConversation = (conversationId: string): Message[] => {
  return mockMessages[conversationId] || [];
};
