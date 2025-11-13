import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Profile shape for reference
export const ProfileShape = {
  id: '',
  username: '',
  full_name: '',
  avatar_url: null,
  status_text: '',
  is_online: false,
  last_seen: '',
  created_at: '',
  updated_at: ''
};

// Conversation shape for reference
export const ConversationShape = {
  id: '',
  name: null,
  is_group: false,
  avatar_url: null,
  created_by: null,
  created_at: '',
  updated_at: ''
};

// Message shape for reference
export const MessageShape = {
  id: '',
  conversation_id: '',
  sender_id: '',
  content: null,
  message_type: 'text', // 'text' | 'image' | 'video' | 'audio' | 'document'
  attachment_url: null,
  attachment_name: null,
  attachment_size: null,
  is_read: false,
  created_at: '',
  updated_at: ''
};

// Call shape for reference
export const CallShape = {
  id: '',
  conversation_id: '',
  caller_id: '',
  call_type: 'voice', // 'voice' | 'video'
  status: 'ongoing', // 'ongoing' | 'completed' | 'missed' | 'rejected'
  duration: 0,
  started_at: '',
  ended_at: null,
  created_at: ''
};

// StatusUpdate shape for reference
export const StatusUpdateShape = {
  id: '',
  user_id: '',
  content_type: 'image', // 'image' | 'video' | 'text'
  content_url: null,
  caption: null,
  expires_at: '',
  created_at: ''
};