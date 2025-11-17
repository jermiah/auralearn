-- Student Assessment & Admin Features Schema
-- Run this in Supabase SQL Editor

-- =====================================================
-- STUDENT ASSESSMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS student_assessments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  assessment_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),

  -- Assessment data
  questions_data JSONB NOT NULL, -- Questions asked
  answers JSONB NOT NULL, -- Student's answers
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,

  -- Results
  category_determined TEXT,
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00

  -- Timing
  time_taken INTEGER, -- seconds
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Reassessment tracking
  needs_reassessment BOOLEAN DEFAULT false,
  next_assessment_date DATE,
  previous_assessment_id UUID REFERENCES student_assessments(id),

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for performance
CREATE INDEX idx_student_assessments_student ON student_assessments(student_id);
CREATE INDEX idx_student_assessments_date ON student_assessments(assessment_date DESC);
CREATE INDEX idx_student_assessments_needs_reassessment ON student_assessments(needs_reassessment) WHERE needs_reassessment = true;

-- =====================================================
-- ASSESSMENT QUESTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS assessment_questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Question details
  category TEXT NOT NULL, -- What category this question tests for
  difficulty_level INTEGER NOT NULL CHECK (difficulty_level BETWEEN 1 AND 10),
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer', 'math')),

  -- Question content
  base_question TEXT NOT NULL,
  variants JSONB DEFAULT '[]', -- AI-generated question variants
  options JSONB, -- For multiple choice questions
  correct_answer TEXT NOT NULL,
  explanation TEXT,

  -- Metadata
  tags TEXT[],
  created_by UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes
CREATE INDEX idx_assessment_questions_category ON assessment_questions(category);
CREATE INDEX idx_assessment_questions_difficulty ON assessment_questions(difficulty_level);
CREATE INDEX idx_assessment_questions_active ON assessment_questions(is_active) WHERE is_active = true;

-- =====================================================
-- SCORING CONFIGURATION TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS scoring_config (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Configuration name
  config_name TEXT UNIQUE NOT NULL,
  config_version INTEGER DEFAULT 1,

  -- Category thresholds (percentage correct for each category)
  category_thresholds JSONB NOT NULL,
  -- Example: {"slow_processing": {"min": 0, "max": 40}, "fast_processor": {"min": 80, "max": 100}}

  -- Assessment settings
  total_questions INTEGER DEFAULT 10,
  time_limit_minutes INTEGER,
  adaptive_difficulty BOOLEAN DEFAULT true,

  -- Active status
  is_active BOOLEAN DEFAULT false,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Only one config can be active at a time
CREATE UNIQUE INDEX idx_scoring_config_active ON scoring_config(is_active) WHERE is_active = true;

-- =====================================================
-- UPDATE USERS TABLE - ADD ADMIN FLAG
-- =====================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Index for admin users
CREATE INDEX IF NOT EXISTS idx_users_admin ON users(is_admin) WHERE is_admin = true;

-- =====================================================
-- STUDENT NOTES TABLE (for teacher observations)
-- =====================================================

CREATE TABLE IF NOT EXISTS student_notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,

  note_text TEXT NOT NULL,
  note_type TEXT CHECK (note_type IN ('observation', 'behavior', 'academic', 'parent_contact', 'other')),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_student_notes_student ON student_notes(student_id);
CREATE INDEX idx_student_notes_teacher ON student_notes(teacher_id);

-- =====================================================
-- REASSESSMENT REMINDERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS reassessment_reminders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,

  due_date DATE NOT NULL,
  reminded_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_reassessment_reminders_due ON reassessment_reminders(due_date);
CREATE INDEX idx_reassessment_reminders_student ON reassessment_reminders(student_id);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Student Assessments
ALTER TABLE student_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view assessments for their students" ON student_assessments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM students s
      JOIN classes c ON s.class_id = c.id
      WHERE s.id = student_assessments.student_id
      AND c.user_id = (SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub')
    )
  );

CREATE POLICY "Anyone can insert assessments" ON student_assessments
  FOR INSERT WITH CHECK (true);

-- Assessment Questions (Admin only for modifications)
ALTER TABLE assessment_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read active questions" ON assessment_questions
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage questions" ON assessment_questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
      AND is_admin = true
    )
  );

-- Scoring Config (Read for all, write for admin)
ALTER TABLE scoring_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read active config" ON scoring_config
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage scoring config" ON scoring_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
      AND is_admin = true
    )
  );

-- Student Notes (Teacher access)
ALTER TABLE student_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage their students' notes" ON student_notes
  FOR ALL USING (
    teacher_id = (SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub')
  );

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to automatically create reassessment reminder after 30 days
CREATE OR REPLACE FUNCTION create_reassessment_reminder()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO reassessment_reminders (student_id, teacher_id, due_date)
  SELECT
    NEW.student_id,
    c.user_id,
    NEW.assessment_date::date + INTERVAL '30 days'
  FROM students s
  JOIN classes c ON s.class_id = c.id
  WHERE s.id = NEW.student_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_reassessment_reminder
AFTER INSERT ON student_assessments
FOR EACH ROW
EXECUTE FUNCTION create_reassessment_reminder();

-- Function to get student progress summary
CREATE OR REPLACE FUNCTION get_student_progress(p_student_id UUID)
RETURNS TABLE (
  total_assessments INTEGER,
  latest_score INTEGER,
  latest_category TEXT,
  improvement_percentage DECIMAL,
  needs_reassessment BOOLEAN,
  next_assessment_date DATE
) AS $$
BEGIN
  RETURN QUERY
  WITH assessments AS (
    SELECT
      score,
      category_determined,
      assessment_date,
      needs_reassessment,
      next_assessment_date,
      ROW_NUMBER() OVER (ORDER BY assessment_date DESC) as rn
    FROM student_assessments
    WHERE student_id = p_student_id
  ),
  latest AS (
    SELECT * FROM assessments WHERE rn = 1
  ),
  previous AS (
    SELECT * FROM assessments WHERE rn = 2
  )
  SELECT
    (SELECT COUNT(*)::INTEGER FROM student_assessments WHERE student_id = p_student_id),
    latest.score,
    latest.category_determined,
    CASE
      WHEN previous.score IS NOT NULL THEN
        ((latest.score - previous.score)::DECIMAL / previous.score * 100)
      ELSE 0
    END,
    latest.needs_reassessment,
    latest.next_assessment_date
  FROM latest
  LEFT JOIN previous ON true;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SEED DATA - Default Scoring Configuration
-- =====================================================

INSERT INTO scoring_config (config_name, category_thresholds, total_questions, is_active)
VALUES (
  'Default Configuration',
  '{
    "slow_processing": {"min": 0, "max": 40},
    "fast_processor": {"min": 80, "max": 100},
    "high_energy": {"min": 40, "max": 70},
    "visual_learner": {"min": 50, "max": 80},
    "logical_learner": {"min": 70, "max": 90},
    "sensitive_low_confidence": {"min": 30, "max": 60},
    "easily_distracted": {"min": 20, "max": 50},
    "needs_repetition": {"min": 30, "max": 60}
  }'::jsonb,
  10,
  true
)
ON CONFLICT (config_name) DO NOTHING;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE student_assessments IS 'Stores all student assessment attempts and results';
COMMENT ON TABLE assessment_questions IS 'Question bank with AI-generated variants';
COMMENT ON TABLE scoring_config IS 'Configurable scoring thresholds and assessment settings';
COMMENT ON TABLE student_notes IS 'Teacher notes and observations about students';
COMMENT ON TABLE reassessment_reminders IS 'Tracks when students need reassessment after 30 days';
