-- Seed file for test data
-- This file runs with elevated privileges and bypasses RLS

-- Create test users in auth.users
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES 
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '00000000-0000-0000-0000-000000000000',
    'alice@test.com',
    '$2a$10$qKyhxXq7YLg8zOjBLhL1JOvYKKOVZZjBZKhLGJvKv0K9QxhHQGMPO', -- 'password123'
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"username":"alice"}',
    FALSE,
    'authenticated'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '00000000-0000-0000-0000-000000000000',
    'bob@test.com',
    '$2a$10$qKyhxXq7YLg8zOjBLhL1JOvYKKOVZZjBZKhLGJvKv0K9QxhHQGMPO', -- 'password123'
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"username":"bob"}',
    FALSE,
    'authenticated'
  ),
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    '00000000-0000-0000-0000-000000000000',
    'charlie@test.com',
    '$2a$10$qKyhxXq7YLg8zOjBLhL1JOvYKKOVZZjBZKhLGJvKv0K9QxhHQGMPO', -- 'password123'
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"username":"charlie"}',
    FALSE,
    'authenticated'
  );

-- Update profiles with usernames and avatars
UPDATE profiles SET
  username = 'alice',
  avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
  status = 'online'
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

UPDATE profiles SET
  username = 'bob',
  avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
  status = 'online'
WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

UPDATE profiles SET
  username = 'charlie',
  avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=charlie',
  status = 'offline'
WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

-- Create conversations
INSERT INTO conversations (id, created_at, updated_at) VALUES
  ('11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 minutes'),
  ('22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '1 day', NOW() - INTERVAL '30 minutes'),
  ('33333333-3333-3333-3333-333333333333', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '5 minutes');

-- Add participants to conversations
-- Conversation 1: Alice and Bob (this will be the long one)
INSERT INTO conversation_participants (conversation_id, user_id, joined_at) VALUES
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW() - INTERVAL '2 days'),
  ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NOW() - INTERVAL '2 days');

-- Conversation 2: Alice and Charlie
INSERT INTO conversation_participants (conversation_id, user_id, joined_at) VALUES
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW() - INTERVAL '1 day'),
  ('22222222-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccccc', NOW() - INTERVAL '1 day');

-- Conversation 3: Bob and Charlie
INSERT INTO conversation_participants (conversation_id, user_id, joined_at) VALUES
  ('33333333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NOW() - INTERVAL '3 hours'),
  ('33333333-3333-3333-3333-333333333333', 'cccccccc-cccc-cccc-cccc-cccccccccccc', NOW() - INTERVAL '3 hours');

-- Add messages to conversations
-- Conversation 1: Alice and Bob (Extended conversation for UI prototyping)
INSERT INTO messages (conversation_id, sender_id, content, created_at) VALUES
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Hey Bob! How are you doing?', NOW() - INTERVAL '2 days'),
  ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Hi Alice! I''m doing great, thanks for asking! How about you?', NOW() - INTERVAL '2 days' + INTERVAL '2 minutes'),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Pretty good! Just finished a big project at work', NOW() - INTERVAL '2 days' + INTERVAL '5 minutes'),
  ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Oh nice! What was the project about?', NOW() - INTERVAL '2 days' + INTERVAL '7 minutes'),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'A new chat application actually! Been working with React and Supabase', NOW() - INTERVAL '2 days' + INTERVAL '10 minutes'),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'It''s been really fun to build. Learning a lot about real-time features', NOW() - INTERVAL '2 days' + INTERVAL '11 minutes'),
  ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'That sounds awesome! Real-time stuff is always challenging but so rewarding', NOW() - INTERVAL '2 days' + INTERVAL '15 minutes'),
  ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Are you using websockets?', NOW() - INTERVAL '2 days' + INTERVAL '16 minutes'),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Yeah! Supabase has built-in realtime subscriptions which makes it pretty straightforward', NOW() - INTERVAL '2 days' + INTERVAL '20 minutes'),
  ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Sweet! Want to grab coffee sometime this week and you can show me what you''ve built?', NOW() - INTERVAL '1 day'),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Definitely! How about Thursday at 3pm at the usual spot?', NOW() - INTERVAL '1 day' + INTERVAL '30 minutes'),
  ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Perfect! I''ll add it to my calendar', NOW() - INTERVAL '1 day' + INTERVAL '45 minutes'),
  ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'See you then! 👍', NOW() - INTERVAL '1 day' + INTERVAL '46 minutes'),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Looking forward to it! Talk soon', NOW() - INTERVAL '1 day' + INTERVAL '50 minutes'),
  ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Hey! Running about 10 minutes late, be there soon', NOW() - INTERVAL '10 minutes'),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'No worries! I''m already here, grabbed us a table by the window', NOW() - INTERVAL '8 minutes'),
  ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Awesome, almost there!', NOW() - INTERVAL '5 minutes'),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Great demo today! Thanks for coming out', NOW() - INTERVAL '2 minutes');

-- Conversation 2: Alice and Charlie (Shorter, work-related)
INSERT INTO messages (conversation_id, sender_id, content, created_at) VALUES
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Charlie, did you finish the project documentation?', NOW() - INTERVAL '1 day'),
  ('22222222-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Not yet, working on it now. Should have it done by EOD', NOW() - INTERVAL '1 day' + INTERVAL '30 minutes'),
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Perfect! Let me know if you need any help', NOW() - INTERVAL '1 day' + INTERVAL '35 minutes'),
  ('22222222-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Will do, thanks!', NOW() - INTERVAL '1 day' + INTERVAL '40 minutes'),
  ('22222222-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Just sent it over. Let me know what you think', NOW() - INTERVAL '30 minutes');

-- Conversation 3: Bob and Charlie (Casual, making plans)
INSERT INTO messages (conversation_id, sender_id, content, created_at) VALUES
  ('33333333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Hey Charlie! 🏀', NOW() - INTERVAL '3 hours'),
  ('33333333-3333-3333-3333-333333333333', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Hey Bob! What''s up?', NOW() - INTERVAL '2 hours' + INTERVAL '30 minutes'),
  ('33333333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Want to play some basketball later?', NOW() - INTERVAL '2 hours'),
  ('33333333-3333-3333-3333-333333333333', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Can''t today unfortunately, got a lot on my plate', NOW() - INTERVAL '1 hour' + INTERVAL '45 minutes'),
  ('33333333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'No worries! Maybe this weekend?', NOW() - INTERVAL '1 hour' + INTERVAL '30 minutes'),
  ('33333333-3333-3333-3333-333333333333', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Yeah, Saturday morning works for me', NOW() - INTERVAL '1 hour'),
  ('33333333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Perfect! 10am at the usual court?', NOW() - INTERVAL '30 minutes'),
  ('33333333-3333-3333-3333-333333333333', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'See you there! 🏀', NOW() - INTERVAL '5 minutes');