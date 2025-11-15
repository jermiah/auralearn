-- LearnAura Supabase Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS & AUTHENTICATION
-- =====================================================

-- User roles enum
CREATE TYPE user_role AS ENUM ('teacher', 'parent', 'admin');

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'teacher',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =====================================================
-- CLASSES & STUDENTS
-- =====================================================

-- Classes table
CREATE TABLE classes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  grade_level TEXT,
  subject TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Student categories enum
CREATE TYPE student_category AS ENUM (
  'slow_processing',
  'fast_processor',
  'high_energy',
  'visual_learner',
  'logical_learner',
  'sensitive_low_confidence',
  'easily_distracted',
  'needs_repetition'
);

-- Students table
CREATE TABLE students (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  primary_category student_category,
  secondary_category student_category,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Parent-student relationships
CREATE TABLE parent_students (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  parent_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  relationship TEXT, -- 'mother', 'father', 'guardian', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(parent_id, student_id)
);

-- =====================================================
-- ASSESSMENTS & RESULTS
-- =====================================================

-- Assessments table
CREATE TABLE assessments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  topic TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Assessment results
CREATE TABLE assessment_results (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  score INTEGER NOT NULL, -- 0-100
  level INTEGER NOT NULL, -- 1-5
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(assessment_id, student_id)
);

-- =====================================================
-- INTERNET RESOURCES (NEW)
-- =====================================================

-- Resource types enum
CREATE TYPE resource_type AS ENUM ('article', 'blog', 'pdf', 'video', 'website');

-- Internet resources table
CREATE TABLE internet_resources (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_category student_category NOT NULL,
  curriculum_topic TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  snippet TEXT,
  resource_type resource_type NOT NULL,
  source TEXT, -- 'brave_search', 'youtube', etc.
  relevance_score FLOAT, -- 0.0 to 1.0
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Index for faster queries
CREATE INDEX idx_internet_resources_category_topic
ON internet_resources(student_category, curriculum_topic);

-- =====================================================
-- YOUTUBE TRANSCRIPTS (NEW)
-- =====================================================

-- YouTube transcripts table
CREATE TABLE youtube_transcripts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  video_url TEXT UNIQUE NOT NULL,
  video_id TEXT NOT NULL,
  title TEXT,
  transcript_text TEXT NOT NULL,
  student_category student_category,
  curriculum_topic TEXT,
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Index for faster lookups
CREATE INDEX idx_youtube_transcripts_category_topic
ON youtube_transcripts(student_category, curriculum_topic);

-- =====================================================
-- TEACHING GUIDES (NEW)
-- =====================================================

-- Teaching guides table (cached AI-generated insights)
CREATE TABLE teaching_guides (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  student_category student_category NOT NULL,
  curriculum_topic TEXT NOT NULL,
  audience TEXT NOT NULL, -- 'teacher' or 'parent'
  summary TEXT NOT NULL,
  strategies JSONB NOT NULL, -- Array of strategy objects
  activities JSONB NOT NULL, -- Array of activity objects
  resources JSONB NOT NULL, -- Array of resource links
  lesson_plan TEXT, -- Only for teachers
  home_support_checklist JSONB, -- Only for parents
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  expires_at TIMESTAMP WITH TIME ZONE, -- Cache expiration
  UNIQUE(class_id, student_category, curriculum_topic, audience)
);

-- Index for faster queries
CREATE INDEX idx_teaching_guides_class_category
ON teaching_guides(class_id, student_category);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE internet_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE youtube_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE teaching_guides ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read and update their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Classes: Teachers can CRUD their own classes
CREATE POLICY "Teachers can view own classes" ON classes
  FOR SELECT USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can create classes" ON classes
  FOR INSERT WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update own classes" ON classes
  FOR UPDATE USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete own classes" ON classes
  FOR DELETE USING (auth.uid() = teacher_id);

-- Students: Teachers can CRUD students in their classes
CREATE POLICY "Teachers can view students in their classes" ON students
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM classes
      WHERE classes.id = students.class_id
      AND classes.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can add students to their classes" ON students
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM classes
      WHERE classes.id = students.class_id
      AND classes.teacher_id = auth.uid()
    )
  );

-- Parents can view their own children
CREATE POLICY "Parents can view their children" ON students
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM parent_students
      WHERE parent_students.student_id = students.id
      AND parent_students.parent_id = auth.uid()
    )
  );

-- Parent-Student relationships
CREATE POLICY "Parents can view their relationships" ON parent_students
  FOR SELECT USING (auth.uid() = parent_id);

-- Teachers can view relationships for students in their classes
CREATE POLICY "Teachers can view parent relationships" ON parent_students
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM students
      JOIN classes ON students.class_id = classes.id
      WHERE students.id = parent_students.student_id
      AND classes.teacher_id = auth.uid()
    )
  );

-- Assessment Results: Teachers and parents can view
CREATE POLICY "Teachers can view assessment results" ON assessment_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM students
      JOIN classes ON students.class_id = classes.id
      WHERE students.id = assessment_results.student_id
      AND classes.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Parents can view their children's results" ON assessment_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM parent_students
      WHERE parent_students.student_id = assessment_results.student_id
      AND parent_students.parent_id = auth.uid()
    )
  );

-- Internet Resources: Public read (shared resources)
CREATE POLICY "Anyone can view internet resources" ON internet_resources
  FOR SELECT USING (true);

-- YouTube Transcripts: Public read
CREATE POLICY "Anyone can view transcripts" ON youtube_transcripts
  FOR SELECT USING (true);

-- Teaching Guides: Teachers can view guides for their classes
CREATE POLICY "Teachers can view teaching guides" ON teaching_guides
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM classes
      WHERE classes.id = teaching_guides.class_id
      AND classes.teacher_id = auth.uid()
    )
  );

-- Parents can view guides for their children's categories
CREATE POLICY "Parents can view guides for their children" ON teaching_guides
  FOR SELECT USING (
    teaching_guides.audience = 'parent' AND
    EXISTS (
      SELECT 1 FROM parent_students
      JOIN students ON parent_students.student_id = students.id
      WHERE parent_students.parent_id = auth.uid()
      AND students.primary_category = teaching_guides.student_category
    )
  );

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_internet_resources_updated_at BEFORE UPDATE ON internet_resources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_youtube_transcripts_updated_at BEFORE UPDATE ON youtube_transcripts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SEED DATA (Optional)
-- =====================================================

-- Insert sample student categories data
-- (You can customize this based on your needs)

COMMENT ON TABLE internet_resources IS 'Stores web resources fetched from Brave Search for teaching strategies';
COMMENT ON TABLE youtube_transcripts IS 'Stores YouTube video transcripts fetched via MCP for educational content';
COMMENT ON TABLE teaching_guides IS 'Cached AI-generated teaching insights for teachers and parents';
