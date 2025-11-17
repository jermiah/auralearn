-- =====================================================
-- COGNITIVE ASSESSMENT SYSTEM SCHEMA
-- LearnAura - Triangulated Cognitive Assessment
-- =====================================================
-- This schema supports:
-- 1. Student self-perception assessments
-- 2. Parent observation assessments
-- 3. Teacher assessment (existing system)
-- 4. Triangulation analysis comparing all three perspectives
-- 5. 15-day periodic reassessment tracking
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUMS
-- =====================================================

-- Assessment type: student self-perception vs parent observation
CREATE TYPE cognitive_assessment_type AS ENUM ('student', 'parent');

-- Cognitive domains based on research (MSLQ, BRIEF-2, WISC-V)
CREATE TYPE cognitive_domain AS ENUM (
  'processing_speed',
  'working_memory',
  'attention_focus',
  'learning_style',
  'self_efficacy',
  'motivation_engagement'
);

-- Assessment status
CREATE TYPE cognitive_assessment_status AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'expired'
);

-- =====================================================
-- TABLE 1: COGNITIVE ASSESSMENT QUESTIONS
-- Stores the generated 15 questions (bilingual, parallel versions)
-- =====================================================

CREATE TABLE cognitive_assessment_questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  questions JSONB NOT NULL, -- Array of 15 question objects
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW() + INTERVAL '30 days') NOT NULL,
  generation_metadata JSONB, -- Gemini model version, prompt used, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Index for faster student lookups
CREATE INDEX idx_cognitive_questions_student ON cognitive_assessment_questions(student_id);
CREATE INDEX idx_cognitive_questions_expires ON cognitive_assessment_questions(expires_at);

-- Add comment
COMMENT ON TABLE cognitive_assessment_questions IS 'Stores Gemini-generated cognitive assessment questions (15 questions, 6 domains, bilingual)';

-- =====================================================
-- TABLE 2: COGNITIVE ASSESSMENTS
-- Tracks individual assessment sessions (student or parent)
-- =====================================================

CREATE TABLE cognitive_assessments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  questions_id UUID REFERENCES cognitive_assessment_questions(id) ON DELETE CASCADE NOT NULL,
  assessment_type cognitive_assessment_type NOT NULL,
  status cognitive_assessment_status DEFAULT 'pending' NOT NULL,
  language TEXT CHECK (language IN ('en', 'fr')) DEFAULT 'fr' NOT NULL,
  
  -- Session tracking
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Voice agent integration (LiveKit)
  voice_session_id TEXT, -- LiveKit room/session ID
  voice_recording_url TEXT, -- Optional: URL to recorded session
  
  -- Metadata
  user_agent TEXT, -- Browser/device info
  ip_address INET, -- For security/analytics
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_completion CHECK (
    (status = 'completed' AND completed_at IS NOT NULL) OR
    (status != 'completed')
  )
);

-- Indexes
CREATE INDEX idx_cognitive_assessments_student ON cognitive_assessments(student_id);
CREATE INDEX idx_cognitive_assessments_type ON cognitive_assessments(assessment_type);
CREATE INDEX idx_cognitive_assessments_status ON cognitive_assessments(status);
CREATE INDEX idx_cognitive_assessments_completed ON cognitive_assessments(completed_at);

-- Add comment
COMMENT ON TABLE cognitive_assessments IS 'Tracks individual cognitive assessment sessions (student self-perception or parent observation)';

-- =====================================================
-- TABLE 3: COGNITIVE ASSESSMENT RESPONSES
-- Stores individual question responses (1-5 Likert scale)
-- =====================================================

CREATE TABLE cognitive_assessment_responses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  assessment_id UUID REFERENCES cognitive_assessments(id) ON DELETE CASCADE NOT NULL,
  question_id INTEGER NOT NULL CHECK (question_id BETWEEN 1 AND 15),
  domain cognitive_domain NOT NULL,
  
  -- Response data
  response_value INTEGER NOT NULL CHECK (response_value BETWEEN 1 AND 5),
  response_time_ms INTEGER, -- Time taken to answer (milliseconds)
  
  -- Voice-specific data
  voice_transcript TEXT, -- What the student/parent said
  voice_confidence FLOAT CHECK (voice_confidence BETWEEN 0 AND 1), -- Speech recognition confidence
  
  -- Metadata
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  
  -- Ensure one response per question per assessment
  UNIQUE(assessment_id, question_id)
);

-- Indexes
CREATE INDEX idx_cognitive_responses_assessment ON cognitive_assessment_responses(assessment_id);
CREATE INDEX idx_cognitive_responses_domain ON cognitive_assessment_responses(domain);

-- Add comment
COMMENT ON TABLE cognitive_assessment_responses IS 'Individual question responses with Likert scale values (1-5)';

-- =====================================================
-- TABLE 4: COGNITIVE ASSESSMENT RESULTS
-- Stores calculated domain scores and overall profile
-- =====================================================

CREATE TABLE cognitive_assessment_results (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  assessment_id UUID REFERENCES cognitive_assessments(id) ON DELETE CASCADE NOT NULL UNIQUE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  assessment_type cognitive_assessment_type NOT NULL,
  
  -- Domain scores (average of questions in each domain)
  domain_scores JSONB NOT NULL, -- {processing_speed: 4.2, working_memory: 3.8, ...}
  
  -- Overall metrics
  overall_score FLOAT NOT NULL CHECK (overall_score BETWEEN 1 AND 5),
  confidence_score FLOAT CHECK (confidence_score BETWEEN 0 AND 1),
  
  -- Profile interpretation
  profile_summary TEXT, -- AI-generated summary
  strengths JSONB, -- Array of identified strengths
  areas_for_support JSONB, -- Array of areas needing support
  
  -- Comparison with previous assessments
  improvement_indicators JSONB, -- Changes from last assessment
  
  -- Metadata
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Indexes
CREATE INDEX idx_cognitive_results_student ON cognitive_assessment_results(student_id);
CREATE INDEX idx_cognitive_results_type ON cognitive_assessment_results(assessment_type);
CREATE INDEX idx_cognitive_results_calculated ON cognitive_assessment_results(calculated_at);

-- Add comment
COMMENT ON TABLE cognitive_assessment_results IS 'Calculated domain scores and cognitive profile analysis';

-- =====================================================
-- TABLE 5: PARENT ASSESSMENT LINKS
-- Manages secure access tokens for parent assessments
-- =====================================================

CREATE TABLE parent_assessment_links (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  questions_id UUID REFERENCES cognitive_assessment_questions(id) ON DELETE CASCADE NOT NULL,
  
  -- Access control
  access_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  parent_email TEXT NOT NULL,
  
  -- Status tracking
  sent_at TIMESTAMP WITH TIME ZONE,
  accessed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Expiration (30 days from creation)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW() + INTERVAL '30 days') NOT NULL,
  
  -- Metadata
  email_sent_count INTEGER DEFAULT 0,
  last_email_sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT valid_access CHECK (
    (accessed_at IS NULL OR accessed_at >= created_at) AND
    (completed_at IS NULL OR completed_at >= accessed_at)
  )
);

-- Indexes
CREATE INDEX idx_parent_links_student ON parent_assessment_links(student_id);
CREATE INDEX idx_parent_links_token ON parent_assessment_links(access_token);
CREATE INDEX idx_parent_links_email ON parent_assessment_links(parent_email);
CREATE INDEX idx_parent_links_expires ON parent_assessment_links(expires_at);

-- Add comment
COMMENT ON TABLE parent_assessment_links IS 'Secure access tokens for parent cognitive assessments';

-- =====================================================
-- TABLE 6: COGNITIVE ASSESSMENT SCHEDULE
-- Tracks 15-day periodic assessment schedule
-- =====================================================

CREATE TABLE cognitive_assessment_schedule (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  
  -- Schedule tracking
  last_assessment_date TIMESTAMP WITH TIME ZONE,
  next_assessment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Completion tracking
  student_completed BOOLEAN DEFAULT FALSE,
  parent_completed BOOLEAN DEFAULT FALSE,
  
  -- Reminder tracking
  reminder_sent_at TIMESTAMP WITH TIME ZONE,
  reminder_count INTEGER DEFAULT 0,
  
  -- Status (computed, not generated)
  is_overdue BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  
  -- Ensure one schedule per student
  UNIQUE(student_id)
);

-- Indexes
CREATE INDEX idx_schedule_student ON cognitive_assessment_schedule(student_id);
CREATE INDEX idx_schedule_next_date ON cognitive_assessment_schedule(next_assessment_date);
CREATE INDEX idx_schedule_overdue ON cognitive_assessment_schedule(is_overdue) WHERE is_overdue = TRUE;

-- Add comment
COMMENT ON TABLE cognitive_assessment_schedule IS 'Tracks 15-day periodic cognitive assessment schedule for each student';

-- =====================================================
-- TABLE 7: TRIANGULATION ANALYSIS
-- Stores comparison analysis between student, parent, and teacher perspectives
-- =====================================================

CREATE TABLE cognitive_triangulation_analysis (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  
  -- Assessment references
  student_assessment_id UUID REFERENCES cognitive_assessments(id) ON DELETE CASCADE,
  parent_assessment_id UUID REFERENCES cognitive_assessments(id) ON DELETE CASCADE,
  teacher_category TEXT, -- From existing student.primary_category
  
  -- Domain-level comparison
  domain_comparisons JSONB NOT NULL, -- Detailed comparison per domain
  
  -- Discrepancy analysis
  discrepancies JSONB, -- Areas where perspectives differ significantly
  agreements JSONB, -- Areas where perspectives align
  
  -- Overall insights
  triangulation_score FLOAT CHECK (triangulation_score BETWEEN 0 AND 1), -- Agreement level
  key_insights TEXT[], -- AI-generated insights
  recommended_actions TEXT[], -- Suggested interventions
  
  -- Metadata
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Indexes
CREATE INDEX idx_triangulation_student ON cognitive_triangulation_analysis(student_id);
CREATE INDEX idx_triangulation_analyzed ON cognitive_triangulation_analysis(analyzed_at);

-- Add comment
COMMENT ON TABLE cognitive_triangulation_analysis IS 'Comparative analysis of student, parent, and teacher perspectives';

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE cognitive_assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cognitive_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cognitive_assessment_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE cognitive_assessment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_assessment_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE cognitive_assessment_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE cognitive_triangulation_analysis ENABLE ROW LEVEL SECURITY;

-- Teachers can view/manage assessments for their students
CREATE POLICY "Teachers can view cognitive questions for their students" ON cognitive_assessment_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM students
      JOIN classes ON students.class_id = classes.id
      WHERE students.id = cognitive_assessment_questions.student_id
      AND classes.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can create cognitive questions for their students" ON cognitive_assessment_questions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM students
      JOIN classes ON students.class_id = classes.id
      WHERE students.id = cognitive_assessment_questions.student_id
      AND classes.teacher_id = auth.uid()
    )
  );

-- Public access for student assessments (no auth required)
CREATE POLICY "Anyone can view cognitive assessments" ON cognitive_assessments
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create cognitive assessments" ON cognitive_assessments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update cognitive assessments" ON cognitive_assessments
  FOR UPDATE USING (true);

-- Public access for responses (no auth required for students)
CREATE POLICY "Anyone can view cognitive responses" ON cognitive_assessment_responses
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create cognitive responses" ON cognitive_assessment_responses
  FOR INSERT WITH CHECK (true);

-- Teachers can view results for their students
CREATE POLICY "Teachers can view cognitive results" ON cognitive_assessment_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM students
      JOIN classes ON students.class_id = classes.id
      WHERE students.id = cognitive_assessment_results.student_id
      AND classes.teacher_id = auth.uid()
    )
  );

-- Parents can view results for their children
CREATE POLICY "Parents can view their children's cognitive results" ON cognitive_assessment_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM parent_students
      WHERE parent_students.student_id = cognitive_assessment_results.student_id
      AND parent_students.parent_id = auth.uid()
    )
  );

-- Parent links: public read by token, teachers can create
CREATE POLICY "Anyone can view parent links by token" ON parent_assessment_links
  FOR SELECT USING (true);

CREATE POLICY "Teachers can create parent links" ON parent_assessment_links
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM students
      JOIN classes ON students.class_id = classes.id
      WHERE students.id = parent_assessment_links.student_id
      AND classes.teacher_id = auth.uid()
    )
  );

-- Teachers can view schedule for their students
CREATE POLICY "Teachers can view cognitive schedule" ON cognitive_assessment_schedule
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM students
      JOIN classes ON students.class_id = classes.id
      WHERE students.id = cognitive_assessment_schedule.student_id
      AND classes.teacher_id = auth.uid()
    )
  );

-- Teachers can view triangulation analysis
CREATE POLICY "Teachers can view triangulation analysis" ON cognitive_triangulation_analysis
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM students
      JOIN classes ON students.class_id = classes.id
      WHERE students.id = cognitive_triangulation_analysis.student_id
      AND classes.teacher_id = auth.uid()
    )
  );

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_cognitive_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_cognitive_questions_updated_at 
  BEFORE UPDATE ON cognitive_assessment_questions
  FOR EACH ROW EXECUTE FUNCTION update_cognitive_updated_at();

CREATE TRIGGER update_cognitive_assessments_updated_at 
  BEFORE UPDATE ON cognitive_assessments
  FOR EACH ROW EXECUTE FUNCTION update_cognitive_updated_at();

CREATE TRIGGER update_cognitive_results_updated_at 
  BEFORE UPDATE ON cognitive_assessment_results
  FOR EACH ROW EXECUTE FUNCTION update_cognitive_updated_at();

CREATE TRIGGER update_cognitive_schedule_updated_at 
  BEFORE UPDATE ON cognitive_assessment_schedule
  FOR EACH ROW EXECUTE FUNCTION update_cognitive_updated_at();

CREATE TRIGGER update_cognitive_triangulation_updated_at 
  BEFORE UPDATE ON cognitive_triangulation_analysis
  FOR EACH ROW EXECUTE FUNCTION update_cognitive_updated_at();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to calculate domain scores from responses
CREATE OR REPLACE FUNCTION calculate_domain_scores(p_assessment_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_scores JSONB;
BEGIN
  SELECT jsonb_object_agg(
    domain::TEXT,
    ROUND(AVG(response_value)::numeric, 2)
  )
  INTO v_scores
  FROM cognitive_assessment_responses
  WHERE assessment_id = p_assessment_id
  GROUP BY domain;
  
  RETURN v_scores;
END;
$$ LANGUAGE plpgsql;

-- Function to check if student needs cognitive assessment
CREATE OR REPLACE FUNCTION needs_cognitive_assessment(p_student_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_next_date TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT next_assessment_date INTO v_next_date
  FROM cognitive_assessment_schedule
  WHERE student_id = p_student_id;
  
  -- If no schedule exists or next date has passed
  RETURN (v_next_date IS NULL OR v_next_date <= TIMEZONE('utc', NOW()));
END;
$$ LANGUAGE plpgsql;

-- Function to create/update assessment schedule
CREATE OR REPLACE FUNCTION update_assessment_schedule(
  p_student_id UUID,
  p_assessment_type cognitive_assessment_type
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO cognitive_assessment_schedule (
    student_id,
    last_assessment_date,
    next_assessment_date,
    student_completed,
    parent_completed
  )
  VALUES (
    p_student_id,
    TIMEZONE('utc', NOW()),
    TIMEZONE('utc', NOW()) + INTERVAL '15 days',
    (p_assessment_type = 'student'),
    (p_assessment_type = 'parent')
  )
  ON CONFLICT (student_id) DO UPDATE SET
    last_assessment_date = TIMEZONE('utc', NOW()),
    next_assessment_date = TIMEZONE('utc', NOW()) + INTERVAL '15 days',
    student_completed = CASE 
      WHEN p_assessment_type = 'student' THEN TRUE 
      ELSE cognitive_assessment_schedule.student_completed 
    END,
    parent_completed = CASE 
      WHEN p_assessment_type = 'parent' THEN TRUE 
      ELSE cognitive_assessment_schedule.parent_completed 
    END,
    updated_at = TIMEZONE('utc', NOW());
END;
$$ LANGUAGE plpgsql;

-- Trigger to update schedule when assessment is completed
CREATE OR REPLACE FUNCTION trigger_update_schedule()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    PERFORM update_assessment_schedule(NEW.student_id, NEW.assessment_type);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_schedule_on_completion
  AFTER UPDATE ON cognitive_assessments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_schedule();

-- Trigger to update is_overdue flag
CREATE OR REPLACE FUNCTION update_overdue_status()
RETURNS TRIGGER AS $$
BEGIN
  NEW.is_overdue := (NEW.next_assessment_date < TIMEZONE('utc', NOW()));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_overdue_on_insert_update
  BEFORE INSERT OR UPDATE ON cognitive_assessment_schedule
  FOR EACH ROW
  EXECUTE FUNCTION update_overdue_status();

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Composite indexes for common queries
CREATE INDEX idx_assessments_student_type_status 
  ON cognitive_assessments(student_id, assessment_type, status);

CREATE INDEX idx_responses_assessment_domain 
  ON cognitive_assessment_responses(assessment_id, domain);

CREATE INDEX idx_results_student_type_calculated 
  ON cognitive_assessment_results(student_id, assessment_type, calculated_at DESC);

-- =====================================================
-- COMMENTS & DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN cognitive_assessment_questions.questions IS 'JSONB array of 15 questions with structure: [{id, domain, student_fr, student_en, parent_fr, parent_en, reverse, research_basis}]';

COMMENT ON COLUMN cognitive_assessments.voice_session_id IS 'LiveKit room/session ID for voice-based assessments';

COMMENT ON COLUMN cognitive_assessment_responses.response_value IS 'Likert scale value: 1=Not at all like me, 2=A bit like me, 3=Sometimes like me, 4=Mostly like me, 5=Exactly like me';

COMMENT ON COLUMN cognitive_assessment_results.domain_scores IS 'Average scores per domain: {processing_speed: 4.2, working_memory: 3.8, attention_focus: 3.5, learning_style: 4.0, self_efficacy: 3.2, motivation_engagement: 4.5}';

COMMENT ON COLUMN parent_assessment_links.access_token IS 'Secure random token for parent access (64 hex characters)';

COMMENT ON COLUMN cognitive_assessment_schedule.next_assessment_date IS 'Date when next cognitive assessment is due (15 days after last completion)';

COMMENT ON COLUMN cognitive_triangulation_analysis.triangulation_score IS 'Agreement level between student, parent, and teacher perspectives (0=complete disagreement, 1=perfect agreement)';

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

-- This section can be uncommented for development/testing

/*
-- Example: Insert a sample question set
INSERT INTO cognitive_assessment_questions (student_id, questions) VALUES (
  'sample-student-uuid',
  '[
    {
      "id": 1,
      "domain": "processing_speed",
      "student_fr": "Quand la maîtresse explique, je comprends vite.",
      "student_en": "When the teacher explains, I understand quickly.",
      "parent_fr": "Quand la maîtresse explique, mon enfant comprend vite.",
      "parent_en": "When the teacher explains, my child understands quickly.",
      "reverse": false,
      "research_basis": "WISC-V Processing Speed Index"
    }
  ]'::jsonb
);
*/

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Verify tables created
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name LIKE 'cognitive_%';
  
  RAISE NOTICE 'Cognitive Assessment Schema Migration Complete!';
  RAISE NOTICE 'Created % tables for cognitive assessment system', table_count;
END $$;
