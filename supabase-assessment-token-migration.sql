-- Assessment Token Migration
-- Adds token-based authentication for secure, personalized student assessments

-- =====================================================
-- ADD TOKEN FIELDS TO STUDENTS TABLE
-- =====================================================

-- Add assessment token and related fields
ALTER TABLE students
ADD COLUMN IF NOT EXISTS assessment_token UUID DEFAULT uuid_generate_v4() UNIQUE,
ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
ADD COLUMN IF NOT EXISTS token_last_used_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS parent_email TEXT,
ADD COLUMN IF NOT EXISTS parent_email_2 TEXT;

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_students_assessment_token ON students(assessment_token);
CREATE INDEX IF NOT EXISTS idx_students_parent_email ON students(parent_email);

-- =====================================================
-- ASSESSMENT ACCESS LOG TABLE
-- =====================================================

-- Track how assessments are accessed (token vs manual selection)
CREATE TABLE IF NOT EXISTS assessment_access_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  access_method TEXT NOT NULL, -- 'token' or 'manual_selection'
  token_used UUID,
  ip_address TEXT,
  user_agent TEXT,
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assessment_started BOOLEAN DEFAULT FALSE,
  assessment_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_access_log_student ON assessment_access_log(student_id);
CREATE INDEX IF NOT EXISTS idx_access_log_class ON assessment_access_log(class_id);
CREATE INDEX IF NOT EXISTS idx_access_log_token ON assessment_access_log(token_used);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to regenerate assessment token for a student
CREATE OR REPLACE FUNCTION regenerate_assessment_token(student_uuid UUID)
RETURNS UUID AS $$
DECLARE
  new_token UUID;
BEGIN
  new_token := uuid_generate_v4();
  UPDATE students
  SET assessment_token = new_token,
      token_expires_at = NOW() + INTERVAL '30 days',
      token_last_used_at = NULL
  WHERE id = student_uuid;
  RETURN new_token;
END;
$$ LANGUAGE plpgsql;

-- Function to validate assessment token
CREATE OR REPLACE FUNCTION validate_assessment_token(token_uuid UUID)
RETURNS TABLE(
  valid BOOLEAN,
  student_id UUID,
  student_name TEXT,
  class_id UUID,
  primary_category student_category,
  error_message TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE
      WHEN s.id IS NULL THEN FALSE
      WHEN s.token_expires_at < NOW() THEN FALSE
      ELSE TRUE
    END AS valid,
    s.id AS student_id,
    s.name AS student_name,
    s.class_id AS class_id,
    s.primary_category AS primary_category,
    CASE
      WHEN s.id IS NULL THEN 'Invalid token'
      WHEN s.token_expires_at < NOW() THEN 'Token has expired'
      ELSE NULL
    END AS error_message
  FROM students s
  WHERE s.assessment_token = token_uuid;
  
  -- If no rows found, return invalid result
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, NULL::UUID, NULL::student_category, 'Invalid token'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to mark token as used
CREATE OR REPLACE FUNCTION mark_token_used(token_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE students
  SET token_last_used_at = NOW()
  WHERE assessment_token = token_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to log assessment access
CREATE OR REPLACE FUNCTION log_assessment_access(
  p_student_id UUID,
  p_class_id UUID,
  p_access_method TEXT,
  p_token_used UUID DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO assessment_access_log (
    student_id,
    class_id,
    access_method,
    token_used,
    ip_address,
    user_agent,
    assessment_started
  ) VALUES (
    p_student_id,
    p_class_id,
    p_access_method,
    p_token_used,
    p_ip_address,
    p_user_agent,
    TRUE
  )
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on assessment_access_log
ALTER TABLE assessment_access_log ENABLE ROW LEVEL SECURITY;

-- Teachers can view access logs for their classes
CREATE POLICY "Teachers can view access logs for their classes" ON assessment_access_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM classes
      WHERE classes.id = assessment_access_log.class_id
      AND classes.teacher_id = auth.uid()
    )
  );

-- Anyone can insert access logs (for tracking)
CREATE POLICY "Anyone can insert access logs" ON assessment_access_log
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- UPDATE EXISTING STUDENTS
-- =====================================================

-- Generate tokens for all existing students that don't have one
UPDATE students
SET 
  assessment_token = uuid_generate_v4(),
  token_expires_at = NOW() + INTERVAL '30 days'
WHERE assessment_token IS NULL;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON COLUMN students.assessment_token IS 'Unique token for secure assessment access via email link';
COMMENT ON COLUMN students.token_expires_at IS 'Expiration date for assessment token (default 30 days)';
COMMENT ON COLUMN students.token_last_used_at IS 'Last time the token was used to access an assessment';
COMMENT ON COLUMN students.parent_email IS 'Primary parent email for sending assessment links';
COMMENT ON COLUMN students.parent_email_2 IS 'Secondary parent email for sending assessment links';

COMMENT ON TABLE assessment_access_log IS 'Tracks how students access assessments (token vs manual selection)';
COMMENT ON FUNCTION regenerate_assessment_token IS 'Generates a new assessment token for a student';
COMMENT ON FUNCTION validate_assessment_token IS 'Validates an assessment token and returns student info';
COMMENT ON FUNCTION mark_token_used IS 'Marks a token as used when student accesses assessment';
COMMENT ON FUNCTION log_assessment_access IS 'Logs assessment access for audit trail';

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify all students have tokens
DO $$
DECLARE
  student_count INTEGER;
  token_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO student_count FROM students;
  SELECT COUNT(*) INTO token_count FROM students WHERE assessment_token IS NOT NULL;
  
  RAISE NOTICE 'Total students: %', student_count;
  RAISE NOTICE 'Students with tokens: %', token_count;
  
  IF student_count = token_count THEN
    RAISE NOTICE '✅ All students have assessment tokens';
  ELSE
    RAISE WARNING '⚠️ Some students are missing tokens';
  END IF;
END $$;
