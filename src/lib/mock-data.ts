
import type { User, Channel, Message, Draft, DocumentCategory, Document } from '@/types';
import * as Icons from 'lucide-react';

// User definitions (assuming hassyku786@gmail.com is the primary admin user)
export const initialMockUsers: User[] = [
  {
    id: 'u1-admin',
    name: 'Hassaan',
    email: 'hassyku786@gmail.com',
    avatarUrl: 'https://placehold.co/40x40/orange/white.png?text=HA', // Orange accent
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
    avatarUrl: 'https://placehold.co/40x40/green/white.png?text=AR', // Green accent
    isOnline: true,
    designation: 'UI/UX Designer',
    role: 'member',
    pronouns: 'He/Him',
  },
  {
    id: 'u2',
    name: 'Hanzlah',
    email: 'hanzlah@example.com',
    avatarUrl: 'https://placehold.co/40x40/blue/white.png?text=HZ', // Blue accent
    isOnline: false,
    designation: 'Frontend Developer',
    role: 'member',
    pronouns: 'He/Him',
  },
  {
    id: 'u3',
    name: 'Huzaifa',
    email: 'huzaifa@example.com',
    avatarUrl: 'https://placehold.co/40x40/purple/white.png?text=HU', // Purple accent
    isOnline: true,
    designation: 'Backend Developer',
    role: 'member',
    pronouns: 'He/Him',
  },
  {
    id: 'u4',
    name: 'Fahad',
    email: 'fahad@example.com',
    avatarUrl: 'https://placehold.co/40x40/red/white.png?text=FA', // Red accent
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
    description: 'Company-wide announcements and general chat for Opano.',
    memberIds: allUserIds,
    isPrivate: false,
  },
  {
    id: 'c2',
    name: 'project-phoenix',
    description: 'All things Project Phoenix: updates, blockers, and discussions.',
    memberIds: [u1AdminId, u2HanzlahId, u3HuzaifaId, u5AreebId], // Added Areeb for design input
    isPrivate: false,
  },
  {
    id: 'c3',
    name: 'design-critiques',
    description: 'Share your designs for feedback and constructive criticism.',
    memberIds: [u1AdminId, u5AreebId, u2HanzlahId], // Hanzlah (frontend) might be interested
    isPrivate: false,
  },
  {
    id: 'c4',
    name: 'random',
    description: 'Off-topic discussions, water cooler chat, memes, and fun stuff.',
    memberIds: allUserIds,
    isPrivate: false,
  },
  {
    id: 'c5',
    name: 'admin-private-lounge',
    description: 'Private channel for admin discussions and coordination.',
    memberIds: allAdminUserIds, 
    isPrivate: true,
  },
].sort((a, b) => a.name.localeCompare(b.name));

export let mockMessages: Record<string, Message[]> = {
  c1: [ // General (channel ID: c1)
    { id: 'm1-c1', userId: 'system', content: `${initialMockUsers.find(u=>u.id === u1AdminId)?.name || 'Admin'} created the channel #general.`, timestamp: Date.now() - 1000 * 60 * 60 * 48, isSystemMessage: true },
    { id: 'm2-c1', userId: u1AdminId, content: 'Welcome everyone to the #general channel! Feel free to use this for company-wide announcements and general discussions. 🎉', timestamp: Date.now() - 1000 * 60 * 60 * 24, reactions: { '🎉': [u2HanzlahId, u5AreebId, u4FahadId], '👍': [u3HuzaifaId] } },
    { id: 'm3-c1', userId: u2HanzlahId, content: 'Thanks, @Hassaan! Glad to be here.', timestamp: Date.now() - 1000 * 60 * 50 },
    { id: 'm4-c1', userId: u5AreebId, content: 'Quick question: where can I find the updated holiday schedule for this year?', timestamp: Date.now() - 1000 * 60 * 30, reactions: { '🤔': [u4FahadId] } },
    { id: 'm5-c1', userId: u1AdminId, content: 'Hey @Areeb, it\'s pinned in the (soon-to-be-created) #announcements channel! For now, you can also check the company portal under HR documents.', timestamp: Date.now() - 1000 * 60 * 28, replyToMessageId: 'm4-c1', originalMessageSenderName: initialMockUsers.find(u=>u.id === u5AreebId)?.name, originalMessageContent: 'Quick question: where can I find the updated holiday schedule for this year?' },
    { id: 'm6-c1', userId: u4FahadId, content: 'Looking forward to the team lunch next Friday! Hope everyone can make it.', timestamp: Date.now() - 1000 * 60 * 15 },
    { id: 'm7-c1', userId: u3HuzaifaId, content: 'I\'ll be there! What\'s the plan for the menu?', timestamp: Date.now() - 1000 * 60 * 10, reactions: { '👍': [u1AdminId] } },
    { id: 'm8-c1', userId: u1AdminId, content: 'We\'re still finalizing, @Huzaifa. Likely a mix of options to cater to everyone. We\'ll send out a poll soon.', timestamp: Date.now() - 1000 * 60 * 5 },
  ],
  c2: [ // Project Phoenix (channel ID: c2)
    { id: 'm1-c2', userId: u1AdminId, content: 'Alright team, let\'s kick off Project Phoenix! The main goal for this phase is to deliver the new user dashboard with real-time analytics.', timestamp: Date.now() - 1000 * 60 * 120, reactions: { '🚀': [u2HanzlahId, u3HuzaifaId, u5AreebId] } },
    { id: 'm2-c2', userId: u2HanzlahId, content: 'Sounds exciting! I\'ll start scaffolding the frontend components for the dashboard. @Areeb, do we have the initial wireframes for the layout?', timestamp: Date.now() - 1000 * 60 * 110, reactions: { '👍': [u1AdminId, u5AreebId] } },
    { id: 'm3-c2', userId: u3HuzaifaId, content: 'I can handle the API endpoints for the dashboard data. What are the key data points we need to surface initially, @Hassaan?', timestamp: Date.now() - 1000 * 60 * 100 },
    { id: 'm4-c2', userId: u5AreebId, content: '@Hanzlah, yes! I just uploaded them to the "Project Specs" document category. File name: `Phoenix_Dashboard_Wireframes_v1.pdf`. Let me know if you have trouble accessing it.', timestamp: Date.now() - 1000 * 60 * 95, file: { name: 'Phoenix_Dashboard_Wireframes_v1.pdf', url: 'https://placehold.co/300x200.png?text=PDF+Mock', type: 'document'}},
    { id: 'm5-c2', userId: u1AdminId, content: '@Huzaifa, let\'s start with: active users, new sign-ups (daily/weekly), and top 5 most used features. We can expand later.', timestamp: Date.now() - 1000 * 60 * 90 },
    { id: 'm6-c2', userId: u2HanzlahId, content: 'Got the wireframes, @Areeb! Looks great. @Hassaan, let\'s sync on the design for the main graph component tomorrow morning. I have a few ideas.', timestamp: Date.now() - 1000 * 60 * 85, replyToMessageId: 'm4-c2', originalMessageSenderName: initialMockUsers.find(u=>u.id === u5AreebId)?.name, originalMessageContent: '@Hanzlah, yes! I just uploaded them to the "Project Specs" document category...' },
    { id: 'm7-c2', userId: u3HuzaifaId, content: 'Endpoints for initial data points are now live on the dev server. `/api/dashboard/summary`. Documentation is in `API_Docs_Phoenix.md` under Project Specs.', timestamp: Date.now() - 1000 * 60 * 30, reactions: {'👍': [u1AdminId, u2HanzlahId]}},
  ],
  c3: [ // Design Critiques (channel ID: c3)
    { id: 'm1-c3', userId: u5AreebId, content: 'Hey team! Here\'s the first draft of the new login page design. Looking for feedback on the overall flow and aesthetics. Link: [Figma Link Placeholder]', timestamp: Date.now() - 1000 * 60 * 150, file: {name: 'login_v1.png', url: 'https://placehold.co/600x400.png?text=Login+V1', type: 'image'}},
    { id: 'm2-c3', userId: u1AdminId, content: 'Looks very clean, @Areeb! The orange primary button really pops. One thought: maybe the password field could be a bit wider for better usability on smaller screens?', timestamp: Date.now() - 1000 * 60 * 140, reactions: {'❤️': [u5AreebId], '🤔': [u2HanzlahId]}},
    { id: 'm3-c3', userId: u2HanzlahId, content: 'I agree with @Hassaan on the password field. Also, what about adding an option to show/hide password? From a frontend perspective, that\'s a common request.', timestamp: Date.now() - 1000 * 60 * 138},
    { id: 'm4-c3', userId: u5AreebId, content: 'Great points, both! I\'ll adjust the width and add the show/hide password toggle. Thanks for the feedback! V2 coming soon.', timestamp: Date.now() - 1000 * 60 * 135, reactions: { '👍': [u1AdminId, u2HanzlahId] } },
    { id: 'm5-c3', userId: u5AreebId, content: 'Updated version with changes: [Figma Link V2 Placeholder]', timestamp: Date.now() - 1000 * 60 * 60, file: {name: 'login_v2_preview.jpg', url: 'https://placehold.co/600x400.png?text=Login+V2', type: 'image'}},
  ],
  c4: [ // Random (channel ID: c4)
    { id: 'm1-c4', userId: u4FahadId, content: 'Anyone watch that new cat video compilation on YouTube? The one where the cat tries to jump onto the counter but hilariously misses? 😂', timestamp: Date.now() - 1000 * 60 * 10, reactions: { '😂': [u2HanzlahId, u1AdminId] } },
    { id: 'm2-c4', userId: u2HanzlahId, content: 'Haha, yeah! Classic! The one with the cucumber and the cat jumping 5 feet in the air is still my all-time favorite though.', timestamp: Date.now() - 1000 * 60 * 5 },
    { id: 'm3-c4', userId: u3HuzaifaId, content: 'I prefer dog videos, to be honest. More loyalty, less chaos. 😉', timestamp: Date.now() - 1000 * 60 * 2, reactions: { '🤔': [u4FahadId] } },
    { id: 'm4-c4', userId: u5AreebId, content: 'Just found this amazing coffee shop downtown, "The Daily Grind". Highly recommend their cold brew!', timestamp: Date.now() - 1000 * 60 * 1 },
    { id: 'm5-c4', userId: u1AdminId, content: '@Areeb, ooh, noted! Always on the lookout for good coffee spots.', timestamp: Date.now() - 1000 * 30, replyToMessageId: 'm4-c4', originalMessageSenderName: initialMockUsers.find(u => u.id === u5AreebId)?.name, originalMessageContent: 'Just found this amazing coffee shop downtown...'},
  ],
  c5: [ // Admin Private Lounge (channel ID: c5)
    { id: 'm1-c5', userId: u1AdminId, content: 'Need to plan the next team outing for Q3. Any initial suggestions for venues or activities?', timestamp: Date.now() - 1000 * 60 * 200 },
    // Add more admin messages if there are other admins
  ],
  [u2HanzlahId]: [ // DM with Hanzlah (u2)
    { id: 'dm1-u1a-u2', userId: u1AdminId, content: 'Hey @Hanzlah, how\'s the new button component refactor coming along? Any blockers?', timestamp: Date.now() - 1000 * 60 * 45 },
    { id: 'dm2-u1a-u2', userId: u2HanzlahId, content: 'Hey @Hassaan! Almost done. Just polishing the focus states and ensuring accessibility. Should be ready to push to the feature branch by EOD.', timestamp: Date.now() - 1000 * 60 * 40, reactions: {'👍': [u1AdminId]}},
    { id: 'dm3-u1a-u2', userId: u1AdminId, content: 'Great to hear! Let me know if you need a second pair of eyes on it before merging.', timestamp: Date.now() - 1000 * 60 * 38 },
    { id: 'dm4-u1a-u2', userId: u2HanzlahId, content: 'Will do, thanks! Probably around 4 PM?', timestamp: Date.now() - 1000 * 60 * 35 },
  ],
  [u5AreebId]: [ // DM with Areeb (u5)
    { id: 'dm1-u1a-u5', userId: u5AreebId, content: 'Hi @Hassaan, can I get your quick feedback on this icon set for the new settings page? Just a quick glance if you have a moment. Attached the preview.', timestamp: Date.now() - 1000 * 60 * 35, file: { name: 'settings_icons.png', url: 'https://placehold.co/300x150.png?text=Icons', type: 'image' }, reactions: {'👍': [u1AdminId]} },
    { id: 'dm2-u1a-u5', userId: u1AdminId, content: 'Sure, @Areeb, send it over! I have some time now. The attachment looks good at first glance - very consistent style.', timestamp: Date.now() - 1000 * 60 * 33 },
    { id: 'dm3-u1a-u5', userId: u5AreebId, content: 'Awesome, thanks! Specifically, what do you think about the "notifications" icon? Too similar to the "messages" one?', timestamp: Date.now() - 1000 * 60 * 30 },
    { id: 'dm4-u1a-u5', userId: u1AdminId, content: 'Hmm, good point. Maybe we can try a bell with a slash for "muted notifications" or something to differentiate more clearly?', timestamp: Date.now() - 1000 * 60 * 25, replyToMessageId: 'dm3-u1a-u5', originalMessageSenderName: initialMockUsers.find(u=>u.id === u5AreebId)?.name, originalMessageContent: 'Awesome, thanks! Specifically, what do you think about the "notifications" icon?'},
  ],
  [u1AdminId]: [ // "Self" DM for u1AdminId (Hassaan)
    { id: 'self-dm1-u1a', userId: u1AdminId, content: 'To-do: Review Q3 budget proposal and finalize by EOW. #self #todo #finance', timestamp: Date.now() - 1000 * 60 * 60 * 2 },
    { id: 'self-dm2-u1a', userId: u1AdminId, content: 'Remember to buy milk on the way home today. And pick up the dry cleaning!', timestamp: Date.now() - 1000 * 60 * 30 },
    { id: 'self-dm3-u1a', userId: u1AdminId, content: 'Idea for new feature: AI-powered meeting summarizer. Need to draft a proposal.', timestamp: Date.now() - 1000 * 60 * 10, reactions: {'💡': [u1AdminId]}},
  ],
};

export let initialMockDrafts: Draft[] = [
  {
    id: 'd1',
    content: 'This is a draft message for #general... I was thinking we could discuss the upcoming company picnic and get some ideas for activities. What does everyone think about a BBQ theme?',
    targetConversationId: 'c1',
    targetConversationName: 'general',
    targetConversationType: 'channel',
    timestamp: Date.now() - 1000 * 60 * 5,
  },
  {
    id: 'd2',
    content: 'Follow up with @Hanzlah about the API integration for Project Phoenix. Need to confirm the expected response structure for the user activity feed.',
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
    description: 'Detailed specifications for ongoing projects, including requirements, designs, and API docs.',
    iconName: 'FileText',
    documents: [
      createFileDoc('spec1', 'Phoenix Project Brief v1.2.pdf', 'application/pdf', 2, 'cat1', 'brief document'),
      createTextDoc('notes1', 'Client Meeting Notes - Phoenix - 2024-05-15.txt', 'Client emphasized the need for a responsive mobile design. Key takeaway: simplify the user registration flow. Blue button is a must.', 5, 'cat1'),
      createFileDoc('api_docs', 'API_Docs_Phoenix_v1.md', 'text/markdown', 3, 'cat1', 'api documentation'),
      createFileDoc('wireframes', 'Phoenix_Dashboard_Wireframes_v1.pdf', 'application/pdf', 7, 'cat1', 'dashboard wireframes'),
    ],
  },
  {
    id: 'cat2',
    name: 'HR Policies',
    description: 'Company HR policies, employee handbook, and benefits information.',
    iconName: 'BookUser',
    documents: [
      createFileDoc('hr1', 'Employee Handbook 2024_final.pdf', 'application/pdf', 30, 'cat2', 'handbook policy'),
      createUrlDoc('hr2', 'Online Benefits Portal - HRConnect', 'https://example.com/hr/benefits', 10, 'cat2'),
      createTextDoc('pto', 'PTO Request Process.txt', 'Submit all PTO requests through the attendance portal at least 2 weeks in advance.', 90, 'cat2'),
    ],
  },
  {
    id: 'cat3',
    name: 'Marketing Materials',
    description: 'Brochures, presentations, logo assets, and ad campaign details.',
    iconName: 'Megaphone',
    documents: [
      createFileDoc('mktg1', 'Opano Company Brochure - 2024.pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 7, 'cat3', 'brochure presentation'),
      createFileDoc('mktg2', 'Opano Brand Logo Assets (Full Kit).zip', 'application/zip', 15, 'cat3', 'logo assets'),
      createTextDoc('mktg3', 'Ad Copy Q3 - "Connect & Collaborate".txt', 'New campaign slogan: "Opano: Connecting Your Future!" Focus on seamless integration and ease of use. Target audience: SMBs.', 1, 'cat3'),
      createUrlDoc('mktg4', 'Competitor Analysis Q2 2024', 'https://example.com/marketing/reports/comp-q2-2024', 25, 'cat3'),
    ],
  }
].sort((a, b) => a.name.localeCompare(b.name));


export const getMessagesForConversation = (conversationId: string): Message[] => {
  const msgs = mockMessages[conversationId] || [];
  // Deep copy reactions to avoid mutation issues if needed, though current toggleReaction handles this well
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
