-- LearnAura Authentication & Parent Linking Schema
-- Run this AFTER the main supabase-schema.sql

-- =====================================================
-- USERS TABLE (Maps Clerk → Supabase)
-- =====================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  clerk_id TEXT UNIQUE NOT NULL, -- Clerk user ID
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('teacher', 'parent')),
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Index for fast lookups
CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- =====================================================
-- UPDATE STUDENTS TABLE (Add Parent Emails)
-- =====================================================

-- Add parent email columns to existing students table
ALTER TABLE students
ADD COLUMN IF NOT EXISTS parent_email TEXT,
ADD COLUMN IF NOT EXISTS parent_email_2 TEXT;

-- Index for parent lookups
CREATE INDEX IF NOT EXISTS idx_students_parent_email ON students(parent_email);
CREATE INDEX IF NOT EXISTS idx_students_parent_email_2 ON students(parent_email_2);

-- =====================================================
-- STRATEGY HISTORY TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS strategy_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  student_category student_category NOT NULL,
  curriculum_topic TEXT NOT NULL,
  audience TEXT NOT NULL CHECK (audience IN ('teacher', 'parent')),

  -- Resources used
  resources_used JSONB NOT NULL DEFAULT '[]', -- Array of URLs

  -- Generated content
  summary TEXT NOT NULL,
  strategies JSONB NOT NULL,
  activities JSONB NOT NULL,
  resources JSONB NOT NULL,
  home_support_checklist JSONB,

  -- Metadata
  generated_by UUID REFERENCES users(id),
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),

  -- Track which URLs were used
  brave_search_urls TEXT[] DEFAULT '{}',
  youtube_urls TEXT[] DEFAULT '{}'
);

-- Index for fast queries
CREATE INDEX idx_strategy_history_student ON strategy_history(student_id);
CREATE INDEX idx_strategy_history_generated_at ON strategy_history(generated_at DESC);

-- =====================================================
-- UPDATE CLASSES TABLE (Link to Teacher User)
-- =====================================================

-- Add user_id foreign key to classes
ALTER TABLE classes
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Migrate existing teacher_id if needed
-- UPDATE classes SET user_id = (SELECT id FROM users WHERE clerk_id = classes.teacher_id) WHERE user_id IS NULL;

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on new/updated tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_history ENABLE ROW LEVEL SECURITY;

-- Users: Can read and update their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (clerk_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (clerk_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Classes: Teachers can CRUD their own classes
DROP POLICY IF EXISTS "Teachers can view own classes" ON classes;
CREATE POLICY "Teachers can view own classes" ON classes
  FOR SELECT USING (
    user_id = (
      SELECT id FROM users
      WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

DROP POLICY IF EXISTS "Teachers can create classes" ON classes;
CREATE POLICY "Teachers can create classes" ON classes
  FOR INSERT WITH CHECK (
    user_id = (
      SELECT id FROM users
      WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

DROP POLICY IF EXISTS "Teachers can update own classes" ON classes;
CREATE POLICY "Teachers can update own classes" ON classes
  FOR UPDATE USING (
    user_id = (
      SELECT id FROM users
      WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

DROP POLICY IF EXISTS "Teachers can delete own classes" ON classes;
CREATE POLICY "Teachers can delete own classes" ON classes
  FOR DELETE USING (
    user_id = (
      SELECT id FROM users
      WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- Students: Teachers see their students, Parents see their children
DROP POLICY IF EXISTS "Teachers can view students in their classes" ON students;
CREATE POLICY "Teachers can view students in their classes" ON students
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM classes
      JOIN users ON classes.user_id = users.id
      WHERE classes.id = students.class_id
      AND users.clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

DROP POLICY IF EXISTS "Teachers can add students to their classes" ON students;
CREATE POLICY "Teachers can add students to their classes" ON students
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM classes
      JOIN users ON classes.user_id = users.id
      WHERE classes.id = students.class_id
      AND users.clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

CREATE POLICY "Teachers can update students in their classes" ON students
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM classes
      JOIN users ON classes.user_id = users.id
      WHERE classes.id = students.class_id
      AND users.clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

DROP POLICY IF EXISTS "Parents can view their children" ON students;
CREATE POLICY "Parents can view their children" ON students
  FOR SELECT USING (
    parent_email = (
      SELECT email FROM users
      WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
    OR parent_email_2 = (
      SELECT email FROM users
      WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- Strategy History: Users can view strategies for students they have access to
CREATE POLICY "Teachers can view strategy history for their students" ON strategy_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM students
      JOIN classes ON students.class_id = classes.id
      JOIN users ON classes.user_id = users.id
      WHERE students.id = strategy_history.student_id
      AND users.clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

CREATE POLICY "Parents can view strategy history for their children" ON strategy_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM students
      JOIN users ON (students.parent_email = users.email OR students.parent_email_2 = users.email)
      WHERE students.id = strategy_history.student_id
      AND users.clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

CREATE POLICY "Users can create strategy history" ON strategy_history
  FOR INSERT WITH CHECK (
    generated_by = (
      SELECT id FROM users
      WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to get user role from Clerk ID
CREATE OR REPLACE FUNCTION get_user_role(clerk_user_id TEXT)
RETURNS TEXT AS $$
  SELECT role FROM users WHERE clerk_id = clerk_user_id;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Function to get parent's children
CREATE OR REPLACE FUNCTION get_parent_children(parent_clerk_id TEXT)
RETURNS TABLE (
  student_id UUID,
  student_name TEXT,
  primary_category student_category,
  class_id UUID,
  class_name TEXT
) AS $$
  SELECT
    s.id,
    s.name,
    s.primary_category,
    s.class_id,
    c.name as class_name
  FROM students s
  JOIN classes c ON s.class_id = c.id
  JOIN users u ON (s.parent_email = u.email OR s.parent_email_2 = u.email)
  WHERE u.clerk_id = parent_clerk_id
  ORDER BY s.name;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Function to check if URL was used before for a student
CREATE OR REPLACE FUNCTION is_url_used_for_student(
  p_student_id UUID,
  p_url TEXT
) RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM strategy_history
    WHERE student_id = p_student_id
    AND (
      p_url = ANY(brave_search_urls) OR
      p_url = ANY(youtube_urls)
    )
  );
$$ LANGUAGE SQL;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at for users table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE users IS 'Maps Clerk authentication to Supabase users with roles';
COMMENT ON TABLE strategy_history IS 'Tracks all generated strategies and resources used to avoid duplicates';
COMMENT ON COLUMN students.parent_email IS 'Primary parent email for automatic linking';
COMMENT ON COLUMN students.parent_email_2 IS 'Secondary parent email for automatic linking';
