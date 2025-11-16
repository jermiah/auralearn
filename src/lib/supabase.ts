import { createClient } from '@supabase/supabase-js';

// Helper to get environment variables - works in both browser and Node.js
const getEnvVar = (key: string, defaultValue: string = ''): string => {
  // Browser environment (Vite)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key] || defaultValue;
  }
  // Node.js environment (for testing)
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || defaultValue;
  }
  return defaultValue;
};

// Supabase configuration
const supabaseUrl = getEnvVar('VITE_SUPABASE_URL', 'https://placeholder.supabase.co');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTI4MDAsImV4cCI6MTk2MDc2ODgwMH0.placeholder');

// Warn if using placeholder values
if (!getEnvVar('VITE_SUPABASE_URL') || !getEnvVar('VITE_SUPABASE_ANON_KEY')) {
  console.warn('⚠️ Supabase not configured. Using placeholder values. Features requiring database will not work.');
  console.warn('📝 To enable full functionality, add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.');
}

// Create Supabase client with global configuration
// Note: For Clerk integration, we'll set auth headers in AuthContext
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      // Headers will be set dynamically in AuthContext when Clerk session is available
    }
  }
});

// Types
export type UserRole = 'teacher' | 'parent' | 'admin';

export type StudentCategory =
  | 'slow_processing'
  | 'fast_processor'
  | 'high_energy'
  | 'visual_learner'
  | 'logical_learner'
  | 'sensitive_low_confidence'
  | 'easily_distracted'
  | 'needs_repetition';

export type ResourceType = 'article' | 'blog' | 'pdf' | 'video' | 'website';

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Class {
  id: string;
  teacher_id: string;
  name: string;
  grade_level?: string;
  subject?: string;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  class_id: string;
  name: string;
  primary_category?: StudentCategory;
  secondary_category?: StudentCategory;
  created_at: string;
  updated_at: string;
}

export interface InternetResource {
  id: string;
  student_category: StudentCategory;
  curriculum_topic: string;
  title: string;
  url: string;
  snippet?: string;
  resource_type: ResourceType;
  source?: string;
  relevance_score?: number;
  created_at: string;
  updated_at: string;
}

export interface YoutubeTranscript {
  id: string;
  video_url: string;
  video_id: string;
  title?: string;
  transcript_text: string;
  student_category?: StudentCategory;
  curriculum_topic?: string;
  duration_seconds?: number;
  created_at: string;
  updated_at: string;
}

export interface TeachingGuide {
  id: string;
  class_id: string;
  student_category: StudentCategory;
  curriculum_topic: string;
  audience: 'teacher' | 'parent';
  summary: string;
  strategies: Strategy[];
  activities: Activity[];
  resources: ResourceLink[];
  lesson_plan?: string;
  home_support_checklist?: ChecklistItem[];
  generated_at: string;
  expires_at?: string;
}

export interface Strategy {
  title: string;
  description: string;
  why_it_works: string;
}

export interface Activity {
  name: string;
  duration: string;
  materials: string[];
  steps: string[];
  differentiation?: string;
}

export interface ResourceLink {
  title: string;
  url: string;
  type: ResourceType;
  description?: string;
}

export interface ChecklistItem {
  task: string;
  frequency: string;
  tips: string[];
}

// Helper function to map category enum to display name
export const categoryDisplayNames: Record<StudentCategory, string> = {
  slow_processing: 'Slow Processing',
  fast_processor: 'Fast Processor',
  high_energy: 'High Energy / Needs Movement',
  visual_learner: 'Visual Learner',
  logical_learner: 'Logical Learner',
  sensitive_low_confidence: 'Sensitive / Low Confidence',
  easily_distracted: 'Easily Distracted',
  needs_repetition: 'Needs Repetition',
};

// Helper function to map category to icon
export const categoryIcons: Record<StudentCategory, string> = {
  slow_processing: 'clock',
  fast_processor: 'zap',
  high_energy: 'activity',
  visual_learner: 'eye',
  logical_learner: 'brain',
  sensitive_low_confidence: 'heart',
  easily_distracted: 'target',
  needs_repetition: 'repeat',
};
