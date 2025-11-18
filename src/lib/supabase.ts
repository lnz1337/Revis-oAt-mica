import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface StudySession {
  id: string;
  user_id: string;
  theme: string;
  content: string;
  total_questions: number;
  correct_questions: number;
  accuracy_percentage: number;
  session_date: string;
  created_at: string;
  updated_at: string;
}

export interface ScheduledReview {
  id: string;
  user_id: string;
  study_session_id: string;
  theme: string;
  review_date: string;
  is_completed: boolean;
  was_rescheduled: boolean;
  created_at: string;
  completed_at: string | null;
}

export interface StudyContent {
  id: string;
  user_id: string;
  theme: string;
  content_type: 'note' | 'link' | 'pdf';
  title: string;
  content: string | null;
  file_path: string | null;
  file_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserPoints {
  id: string;
  user_id: string;
  points: number;
  updated_at: string;
}

export interface StudyStreak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_study_date: string | null;
  updated_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_type: string;
  earned_at: string;
  metadata: Record<string, any>;
}

export interface PointsHistory {
  id: string;
  user_id: string;
  points: number;
  source: string;
  source_id: string | null;
  description: string | null;
  created_at: string;
}
