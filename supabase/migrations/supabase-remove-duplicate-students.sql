-- Remove Duplicate Students Script
-- This script identifies and removes duplicate student records

-- =====================================================
-- STEP 1: IDENTIFY DUPLICATES
-- =====================================================

-- Check for duplicate students (same name in same class)
SELECT 
  class_id,
  name,
  COUNT(*) as duplicate_count,
  ARRAY_AGG(id ORDER BY created_at) as student_ids,
  ARRAY_AGG(created_at ORDER BY created_at) as created_dates
FROM students
GROUP BY class_id, name
HAVING COUNT(*) > 1
ORDER BY class_id, name;

-- =====================================================
-- STEP 2: BACKUP DUPLICATES (OPTIONAL)
-- =====================================================

-- Create a backup table for duplicates before deletion
CREATE TABLE IF NOT EXISTS students_duplicates_backup AS
SELECT s.*
FROM students s
WHERE EXISTS (
  SELECT 1
  FROM students s2
  WHERE s2.class_id = s.class_id
  AND s2.name = s.name
  AND s2.id != s.id
);

-- =====================================================
-- STEP 3: REMOVE DUPLICATES (KEEP OLDEST)
-- =====================================================

-- Delete duplicate students, keeping only the oldest record per (class_id, name)
DELETE FROM students
WHERE id IN (
  SELECT id
  FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY class_id, name 
        ORDER BY created_at ASC
      ) as rn
    FROM students
  ) t
  WHERE rn > 1
);

-- =====================================================
-- STEP 4: VERIFY CLEANUP
-- =====================================================

-- Check if any duplicates remain
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT class_id, name, COUNT(*) as cnt
    FROM students
    GROUP BY class_id, name
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF duplicate_count = 0 THEN
    RAISE NOTICE '✅ No duplicate students found';
  ELSE
    RAISE WARNING '⚠️ Still have % duplicate student records', duplicate_count;
  END IF;
END $$;

-- =====================================================
-- STEP 5: ENSURE ALL STUDENTS HAVE UNIQUE TOKENS
-- =====================================================

-- Check for duplicate tokens
SELECT 
  assessment_token,
  COUNT(*) as token_count,
  ARRAY_AGG(name) as student_names
FROM students
WHERE assessment_token IS NOT NULL
GROUP BY assessment_token
HAVING COUNT(*) > 1;

-- Regenerate tokens for any duplicates found
UPDATE students
SET assessment_token = uuid_generate_v4()
WHERE id IN (
  SELECT id
  FROM (
    SELECT 
      id,
      assessment_token,
      ROW_NUMBER() OVER (
        PARTITION BY assessment_token 
        ORDER BY created_at ASC
      ) as rn
    FROM students
    WHERE assessment_token IS NOT NULL
  ) t
  WHERE rn > 1
);

-- =====================================================
-- STEP 6: FINAL VERIFICATION
-- =====================================================

-- Summary report
DO $$
DECLARE
  total_students INTEGER;
  students_with_tokens INTEGER;
  unique_tokens INTEGER;
  duplicate_names INTEGER;
  duplicate_tokens INTEGER;
BEGIN
  -- Count total students
  SELECT COUNT(*) INTO total_students FROM students;
  
  -- Count students with tokens
  SELECT COUNT(*) INTO students_with_tokens 
  FROM students 
  WHERE assessment_token IS NOT NULL;
  
  -- Count unique tokens
  SELECT COUNT(DISTINCT assessment_token) INTO unique_tokens 
  FROM students 
  WHERE assessment_token IS NOT NULL;
  
  -- Count duplicate names
  SELECT COUNT(*) INTO duplicate_names
  FROM (
    SELECT class_id, name, COUNT(*) as cnt
    FROM students
    GROUP BY class_id, name
    HAVING COUNT(*) > 1
  ) dup_names;
  
  -- Count duplicate tokens
  SELECT COUNT(*) INTO duplicate_tokens
  FROM (
    SELECT assessment_token, COUNT(*) as cnt
    FROM students
    WHERE assessment_token IS NOT NULL
    GROUP BY assessment_token
    HAVING COUNT(*) > 1
  ) dup_tokens;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'STUDENT DATABASE CLEANUP REPORT';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total students: %', total_students;
  RAISE NOTICE 'Students with tokens: %', students_with_tokens;
  RAISE NOTICE 'Unique tokens: %', unique_tokens;
  RAISE NOTICE 'Duplicate names: %', duplicate_names;
  RAISE NOTICE 'Duplicate tokens: %', duplicate_tokens;
  RAISE NOTICE '========================================';
  
  IF duplicate_names = 0 AND duplicate_tokens = 0 THEN
    RAISE NOTICE '✅ Database is clean - no duplicates found';
  ELSE
    IF duplicate_names > 0 THEN
      RAISE WARNING '⚠️ Found % duplicate student names', duplicate_names;
    END IF;
    IF duplicate_tokens > 0 THEN
      RAISE WARNING '⚠️ Found % duplicate tokens', duplicate_tokens;
    END IF;
  END IF;
END $$;

-- =====================================================
-- OPTIONAL: VIEW BACKUP
-- =====================================================

-- To view backed up duplicates:
-- SELECT * FROM students_duplicates_backup ORDER BY class_id, name, created_at;

-- To restore from backup (if needed):
-- INSERT INTO students SELECT * FROM students_duplicates_backup WHERE id = 'specific-id';

-- To drop backup table after verification:
-- DROP TABLE IF EXISTS students_duplicates_backup;
