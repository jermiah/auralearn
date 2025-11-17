-- =====================================================
-- CATEGORY MAPPING SYSTEM - CRITICAL PATH TESTS
-- Run these tests in Supabase SQL Editor
-- =====================================================

-- TEST 1: Verify detect_guide_categories() function exists and works
-- Expected: Returns array of detected categories
SELECT 'TEST 1: Category Detection Function' as test_name;
SELECT detect_guide_categories('Use visual diagrams and color-coded charts to help students understand concepts. Provide step-by-step instructions with extra time for processing.') as detected_categories;
-- Expected result: ['visual_learner', 'slow_processing']

-- TEST 2: Verify tag_existing_teaching_guides() function exists
-- Expected: Returns list of tagged guides
SELECT 'TEST 2: Batch Tagging Function' as test_name;
SELECT COUNT(*) as guides_to_tag 
FROM teaching_guides_chunks 
WHERE applicable_categories = '{}' OR applicable_categories IS NULL;

-- TEST 3: Check if teaching_guides_chunks table has applicable_categories column
-- Expected: Column exists with TEXT[] type
SELECT 'TEST 3: Schema Verification' as test_name;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'teaching_guides_chunks' 
  AND column_name = 'applicable_categories';

-- TEST 4: Verify get_teaching_guides_for_student() function exists
-- Expected: Function exists in database
SELECT 'TEST 4: Student Retrieval Function' as test_name;
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name = 'get_teaching_guides_for_student'
  AND routine_schema = 'public';

-- TEST 5: Verify get_category_strategies() function exists
-- Expected: Function exists in database
SELECT 'TEST 5: Category Strategies Function' as test_name;
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name = 'get_category_strategies'
  AND routine_schema = 'public';

-- TEST 6: Check if trigger exists for auto-tagging
-- Expected: Trigger exists on teaching_guides_chunks table
SELECT 'TEST 6: Auto-Tag Trigger' as test_name;
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'trigger_auto_tag_guide';

-- TEST 7: Test category detection with various texts
SELECT 'TEST 7: Category Detection Patterns' as test_name;

-- Visual learner text
SELECT 'Visual Learner Test' as subtest,
       detect_guide_categories('Show diagrams, use colorful charts and visual aids') as categories;

-- Slow processing text
SELECT 'Slow Processing Test' as subtest,
       detect_guide_categories('Give extra time, use step-by-step approach, be patient') as categories;

-- Fast processor text
SELECT 'Fast Processor Test' as subtest,
       detect_guide_categories('Provide advanced challenges, enrichment activities, complex problems') as categories;

-- Needs repetition text
SELECT 'Needs Repetition Test' as subtest,
       detect_guide_categories('Practice multiple times, review regularly, reinforce concepts') as categories;

-- High energy text
SELECT 'High Energy Test' as subtest,
       detect_guide_categories('Use hands-on activities, allow movement breaks, kinesthetic learning') as categories;

-- Easily distracted text
SELECT 'Easily Distracted Test' as subtest,
       detect_guide_categories('Minimize distractions, provide clear structure, maintain focus') as categories;

-- Sensitive/Low confidence text
SELECT 'Sensitive Test' as subtest,
       detect_guide_categories('Encourage students, provide positive feedback, build confidence') as categories;

-- Logical learner text
SELECT 'Logical Learner Test' as subtest,
       detect_guide_categories('Use logical sequences, problem-solving activities, systematic approach') as categories;

-- TEST 8: Verify students table has category columns
SELECT 'TEST 8: Student Category Columns' as test_name;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'students' 
  AND column_name IN ('primary_category', 'secondary_category', 'category_scores');

-- TEST 9: Check if any students have category scores
SELECT 'TEST 9: Student Category Data' as test_name;
SELECT 
  COUNT(*) as total_students,
  COUNT(CASE WHEN category_scores IS NOT NULL THEN 1 END) as students_with_scores,
  COUNT(CASE WHEN primary_category IS NOT NULL THEN 1 END) as students_with_primary
FROM students;

-- TEST 10: Sample student category scores
SELECT 'TEST 10: Sample Student Categories' as test_name;
SELECT 
  id,
  first_name,
  last_name,
  grade,
  primary_category,
  secondary_category,
  category_scores
FROM students
WHERE category_scores IS NOT NULL
LIMIT 3;

-- =====================================================
-- SUMMARY
-- =====================================================
SELECT 'TEST SUMMARY' as section;
SELECT 
  'All tests completed. Review results above.' as message,
  'If any tests failed, run the migration: supabase-teaching-guides-category-mapping.sql' as action;
