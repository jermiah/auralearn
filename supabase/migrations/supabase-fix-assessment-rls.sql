-- Fix RLS Policies for Student Assessment Submission
-- This migration fixes the issue where unauthenticated students cannot submit assessments
-- Run this in Supabase SQL Editor

-- =====================================================
-- DROP EXISTING PROBLEMATIC POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Teachers can view assessments for their students" ON student_assessments;
DROP POLICY IF EXISTS "Anyone can insert assessments" ON student_assessments;

-- =====================================================
-- CREATE NEW FIXED POLICIES
-- =====================================================

-- Policy 1: Allow anonymous/unauthenticated INSERT for student assessment submissions
-- This is critical because students taking assessments are NOT logged in users
CREATE POLICY "Allow anonymous assessment submission" ON student_assessments
  FOR INSERT 
  WITH CHECK (true);

-- Policy 2: Allow anonymous/unauthenticated UPDATE for assessment corrections
-- In case we need to update assessment records after submission
CREATE POLICY "Allow anonymous assessment updates" ON student_assessments
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Policy 3: Teachers can view assessments for students in their classes
-- This uses a more robust check that works with both Clerk and Supabase auth
CREATE POLICY "Teachers can view their students assessments" ON student_assessments
  FOR SELECT USING (
    -- Check if the current user is a teacher of the class containing this student
    EXISTS (
      SELECT 1 
      FROM students s
      JOIN classes c ON s.class_id = c.id
      JOIN users u ON c.user_id = u.id
      WHERE s.id = student_assessments.student_id
      AND (
        -- Check with Clerk ID (primary method)
        u.clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
        OR
        -- Fallback: Check with Supabase auth.uid() for direct Supabase auth
        u.id::text = auth.uid()::text
      )
    )
    OR
    -- Also allow if user is admin
    EXISTS (
      SELECT 1 FROM users
      WHERE (
        clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
        OR id::text = auth.uid()::text
      )
      AND is_admin = true
    )
  );

-- =====================================================
-- VERIFY POLICIES
-- =====================================================

-- List all policies on student_assessments table to verify
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'student_assessments';

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON POLICY "Allow anonymous assessment submission" ON student_assessments IS 
  'Allows unauthenticated students to submit assessment results. Students access via tokens or manual selection without authentication.';

COMMENT ON POLICY "Teachers can view their students assessments" ON student_assessments IS 
  'Allows teachers to view assessment results for students in their classes. Supports both Clerk and Supabase authentication.';

COMMENT ON POLICY "Allow anonymous assessment updates" ON student_assessments IS 
  'Allows updates to assessment records if needed for corrections or additional data.';
