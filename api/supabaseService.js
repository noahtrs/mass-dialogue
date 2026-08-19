import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    'Missing Supabase server environment variables. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file.'
  );
}

// Use the service_role key (server-side only) — NOT the anon key
// The service_role key bypasses RLS, so we enforce validation here
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Input validation helpers
export const MAX_POST_LENGTH = 5000;
export const MAX_COMMENT_LENGTH = 2000;
export const MAX_SEARCH_LENGTH = 200;

export const sanitizeInput = (text) => {
  if (typeof text !== 'string') return '';
  // Remove control characters except newlines and tabs
  return text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim();
};

export const validatePostText = (text) => {
  const sanitized = sanitizeInput(text);
  if (!sanitized) return { valid: false, error: 'Post text cannot be empty.' };
  if (sanitized.length > MAX_POST_LENGTH) {
    return { valid: false, error: `Post must be under ${MAX_POST_LENGTH} characters.` };
  }
  return { valid: true, sanitized };
};

export const validateCommentText = (text) => {
  const sanitized = sanitizeInput(text);
  if (!sanitized) return { valid: false, error: 'Comment text cannot be empty.' };
  if (sanitized.length > MAX_COMMENT_LENGTH) {
    return { valid: false, error: `Comment must be under ${MAX_COMMENT_LENGTH} characters.` };
  }
  return { valid: true, sanitized };
};

// DB operations with server-side validation
export const fetchPosts = async () => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false });

  return { data, error };
};

export const createPost = async (text) => {
  const validation = validatePostText(text);
  if (!validation.valid) return { error: validation.error };

  const { data, error } = await supabase
    .from('messages')
    .insert([{ text: validation.sanitized, upvotes: 0 }]);

  return { data, error };
};

export const updatePostVotes = async (postId, delta) => {
  if (typeof delta !== 'number' || !Number.isInteger(delta)) {
    return { error: 'Invalid vote delta.' };
  }
  if (delta !== 1 && delta !== -1) {
    return { error: 'Vote delta must be +1 or -1.' };
  }

  // Get current upvotes and update atomically
  const { data: post, error: fetchError } = await supabase
    .from('messages')
    .select('upvotes')
    .eq('id', postId)
    .single();

  if (fetchError) return { error: 'Post not found.' };

  const { data, error } = await supabase
    .from('messages')
    .update({ upvotes: post.upvotes + delta })
    .eq('id', postId);

  return { data, error };
};

export const fetchComments = async (postId) => {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  return { data, error };
};

export const createComment = async (postId, text) => {
  const validation = validateCommentText(text);
  if (!validation.valid) return { error: validation.error };

  const { data, error } = await supabase
    .from('comments')
    .insert([{ post_id: postId, text: validation.sanitized }]);

  return { data, error };
};

export const recordVote = async (sessionId, postId) => {
  const { data, error } = await supabase
    .from('post_votes')
    .insert([{ session_id: sessionId, post_id: postId }]);

  return { data, error };
};

export const hasUserVoted = async (sessionId, postId) => {
  const { data, error } = await supabase
    .from('post_votes')
    .select('id')
    .eq('session_id', sessionId)
    .eq('post_id', postId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') return { voted: false, error };
  return { voted: !!data, error: null };
};
