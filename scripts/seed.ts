import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

// Local Supabase configuration
const SUPABASE_URL = 'http://127.0.0.1:54321';
const SERVICE_ROLE_KEY = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';

// Create admin client with service role key
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Fixed UUIDs for development (same across seed runs)
// This allows frontend to hardcode Alice's ID for testing
const ALICE_ID = '00000000-0000-0000-0000-000000000001';
const BOB_ID = '00000000-0000-0000-0000-000000000002';
const CHARLIE_ID = '00000000-0000-0000-0000-000000000003';
const DIANA_ID = '00000000-0000-0000-0000-000000000004';

async function seed() {
  console.log('🌱 Starting seed process...\n');

  try {
    // Step 1: Create users
    console.log('👥 Creating users...');
    await createUsers();
    console.log('✅ Users created\n');

    // Step 2: Create conversations
    console.log('💬 Creating conversations...');
    const conversationIds = await createConversations();
    console.log('✅ Conversations created\n');

    // Step 3: Add participants to conversations
    console.log('🤝 Adding participants to conversations...');
    await createParticipants(conversationIds);
    console.log('✅ Participants added\n');

    // Step 4: Create messages
    console.log('📨 Creating messages...');
    await createMessages(conversationIds);
    console.log('✅ Messages created\n');

    console.log('🎉 Seed completed successfully!');
    console.log('\nYou can view the data at: http://127.0.0.1:54323');
    console.log('\n📝 Test user credentials:');
    console.log(`   Alice: alice@test.com / password123 (ID: ${ALICE_ID})`);
    console.log(`   Bob: bob@test.com / password123 (ID: ${BOB_ID})`);
    console.log(`   Charlie: charlie@test.com / password123 (ID: ${CHARLIE_ID})`);
    console.log(`   Diana: diana@test.com / password123 (ID: ${DIANA_ID})`);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

async function createUsers() {
  const users = [
    {
      id: ALICE_ID,
      email: 'alice@test.com',
      password: 'password123',
      user_metadata: { username: 'alice' },
    },
    {
      id: BOB_ID,
      email: 'bob@test.com',
      password: 'password123',
      user_metadata: { username: 'bob' },
    },
    {
      id: CHARLIE_ID,
      email: 'charlie@test.com',
      password: 'password123',
      user_metadata: { username: 'charlie' },
    },
    {
      id: DIANA_ID,
      email: 'diana@test.com',
      password: 'password123',
      user_metadata: { username: 'diana' },
    },
  ];

  for (const user of users) {
    const { data, error } = await supabase.auth.admin.createUser({
      id: user.id,
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: user.user_metadata,
    });

    if (error) {
      throw new Error(`Failed to create user ${user.email}: ${error.message}`);
    }

    console.log(`  ✓ Created user: ${user.user_metadata.username} (${user.email})`);
  }
}

async function createConversations() {
  const conversations = [
    { id: randomUUID(), name: 'Alice & Bob Chat' },
    { id: randomUUID(), name: 'Team Discussion' },
    { id: randomUUID(), name: 'Charlie & Diana' },
  ];

  for (const conversation of conversations) {
    const { error } = await supabase
      .from('conversations')
      .insert({ id: conversation.id });

    if (error) {
      throw new Error(`Failed to create conversation: ${error.message}`);
    }

    console.log(`  ✓ Created conversation: ${conversation.id}`);
  }

  return conversations.map((c) => c.id);
}

async function createParticipants(conversationIds: string[]) {
  const participants = [
    // Conversation 1: Alice & Bob (1-on-1)
    { conversation_id: conversationIds[0], user_id: ALICE_ID },
    { conversation_id: conversationIds[0], user_id: BOB_ID },

    // Conversation 2: Alice, Bob, Charlie, Diana (group)
    { conversation_id: conversationIds[1], user_id: ALICE_ID },
    { conversation_id: conversationIds[1], user_id: BOB_ID },
    { conversation_id: conversationIds[1], user_id: CHARLIE_ID },
    { conversation_id: conversationIds[1], user_id: DIANA_ID },

    // Conversation 3: Charlie & Diana (1-on-1)
    { conversation_id: conversationIds[2], user_id: CHARLIE_ID },
    { conversation_id: conversationIds[2], user_id: DIANA_ID },
  ];

  const { error } = await supabase
    .from('conversation_participants')
    .insert(participants);

  if (error) {
    throw new Error(`Failed to create participants: ${error.message}`);
  }

  console.log(`  ✓ Added ${participants.length} participants to conversations`);
}

async function createMessages(conversationIds: string[]) {
  const now = new Date();
  const hoursAgo = (hours: number) =>
    new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();

  const messages = [
    // Conversation 1: Alice & Bob
    {
      conversation_id: conversationIds[0],
      sender_id: ALICE_ID,
      content: 'Hey Bob! How are you doing?',
      created_at: hoursAgo(5),
    },
    {
      conversation_id: conversationIds[0],
      sender_id: BOB_ID,
      content: "Hi Alice! I'm doing great, thanks for asking!",
      created_at: hoursAgo(4.5),
    },
    {
      conversation_id: conversationIds[0],
      sender_id: ALICE_ID,
      content: 'Did you finish the project we were working on?',
      created_at: hoursAgo(4),
    },
    {
      conversation_id: conversationIds[0],
      sender_id: BOB_ID,
      content: 'Almost done! Just need to fix a few bugs.',
      created_at: hoursAgo(3.5),
    },
    {
      conversation_id: conversationIds[0],
      sender_id: ALICE_ID,
      content: 'Great! Let me know if you need any help.',
      created_at: hoursAgo(3),
    },

    // Conversation 2: Team Discussion
    {
      conversation_id: conversationIds[1],
      sender_id: ALICE_ID,
      content: 'Hey team! Quick sync - how is everyone progressing?',
      created_at: hoursAgo(2),
    },
    {
      conversation_id: conversationIds[1],
      sender_id: BOB_ID,
      content: 'Working on the frontend components. Should be done by EOD.',
      created_at: hoursAgo(1.9),
    },
    {
      conversation_id: conversationIds[1],
      sender_id: CHARLIE_ID,
      content: "I've finished the API integration. Running tests now.",
      created_at: hoursAgo(1.8),
    },
    {
      conversation_id: conversationIds[1],
      sender_id: DIANA_ID,
      content: 'Database migrations are complete. Everything looks good!',
      created_at: hoursAgo(1.7),
    },
    {
      conversation_id: conversationIds[1],
      sender_id: ALICE_ID,
      content: 'Excellent work everyone! 🎉',
      created_at: hoursAgo(1.6),
    },
    {
      conversation_id: conversationIds[1],
      sender_id: BOB_ID,
      content: 'Thanks Alice! Team effort!',
      created_at: hoursAgo(1.5),
    },

    // Conversation 3: Charlie & Diana
    {
      conversation_id: conversationIds[2],
      sender_id: CHARLIE_ID,
      content: 'Diana, do you have time for a quick call?',
      created_at: hoursAgo(1),
    },
    {
      conversation_id: conversationIds[2],
      sender_id: DIANA_ID,
      content: 'Sure! Give me 5 minutes.',
      created_at: hoursAgo(0.9),
    },
    {
      conversation_id: conversationIds[2],
      sender_id: CHARLIE_ID,
      content: 'Perfect, joining the call now.',
      created_at: hoursAgo(0.8),
    },
    {
      conversation_id: conversationIds[2],
      sender_id: DIANA_ID,
      content: 'That was a productive call! Thanks Charlie.',
      created_at: hoursAgo(0.3),
    },
  ];

  const { error } = await supabase.from('messages').insert(messages);

  if (error) {
    throw new Error(`Failed to create messages: ${error.message}`);
  }

  console.log(`  ✓ Created ${messages.length} messages across conversations`);
}

// Run the seed function
seed();
