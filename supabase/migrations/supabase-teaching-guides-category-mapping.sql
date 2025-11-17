-- =====================================================
-- TEACHING GUIDES CATEGORY MAPPING
-- Adds category filtering to teaching guides system
-- =====================================================

-- Step 1: Add applicable_categories column to teaching_guides_chunks
ALTER TABLE teaching_guides_chunks 
ADD COLUMN IF NOT EXISTS applicable_categories TEXT[] DEFAULT '{}';

-- Step 2: Add index for efficient category filtering
CREATE INDEX IF NOT EXISTS idx_teaching_guides_categories 
ON teaching_guides_chunks USING GIN(applicable_categories);

-- Step 3: Create function to detect categories from guide text
CREATE OR REPLACE FUNCTION detect_guide_categories(guide_text TEXT)
RETURNS TEXT[] AS $$
DECLARE
  categories TEXT[] := '{}';
  text_lower TEXT;
BEGIN
  text_lower := LOWER(guide_text);
  
  -- Visual Learner detection
  IF text_lower ~ '(visual|diagram|chart|image|picture|graphic|color|illustration|map|video)' THEN
    categories := array_append(categories, 'visual_learner');
  END IF;
  
  -- Slow Processing detection
  IF text_lower ~ '(slow|extra time|extended time|pace|step-by-step|gradual|patient|wait)' THEN
    categories := array_append(categories, 'slow_processing');
  END IF;
  
  -- Fast Processor detection
  IF text_lower ~ '(fast|quick|advanced|challenge|extension|accelerat|enrich|complex)' THEN
    categories := array_append(categories, 'fast_processor');
  END IF;
  
  -- Needs Repetition detection
  IF text_lower ~ '(repetition|repeat|practice|review|reinforce|drill|multiple times|again)' THEN
    categories := array_append(categories, 'needs_repetition');
  END IF;
  
  -- High Energy detection
  IF text_lower ~ '(movement|active|physical|kinesthetic|hands-on|manipulative|break|activity)' THEN
    categories := array_append(categories, 'high_energy');
  END IF;
  
  -- Easily Distracted detection
  IF text_lower ~ '(focus|attention|distract|quiet|minimize|structure|routine|clear)' THEN
    categories := array_append(categories, 'easily_distracted');
  END IF;
  
  -- Sensitive/Low Confidence detection
  IF text_lower ~ '(confidence|encourage|support|praise|positive|gentle|reassure|safe)' THEN
    categories := array_append(categories, 'sensitive_low_confidence');
  END IF;
  
  -- Logical Learner detection
  IF text_lower ~ '(logic|pattern|sequence|reason|problem-solving|analyz|systematic|order)' THEN
    categories := array_append(categories, 'logical_learner');
  END IF;
  
  -- If no specific categories detected, mark as general
  IF array_length(categories, 1) IS NULL THEN
    categories := array_append(categories, 'general');
  END IF;
  
  RETURN categories;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 4: Create function to auto-tag existing guides
CREATE OR REPLACE FUNCTION tag_existing_teaching_guides()
RETURNS TABLE (
  guide_id UUID,
  detected_categories TEXT[],
  updated BOOLEAN
) AS $$
DECLARE
  guide_record RECORD;
  detected_cats TEXT[];
BEGIN
  FOR guide_record IN 
    SELECT id, chunk_text 
    FROM teaching_guides_chunks
    WHERE applicable_categories = '{}'
       OR applicable_categories IS NULL
  LOOP
    -- Detect categories from text
    detected_cats := detect_guide_categories(guide_record.chunk_text);
    
    -- Update the record
    UPDATE teaching_guides_chunks
    SET applicable_categories = detected_cats
    WHERE id = guide_record.id;
    
    -- Return result
    guide_id := guide_record.id;
    detected_categories := detected_cats;
    updated := TRUE;
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create view for category-filtered guide retrieval
CREATE OR REPLACE VIEW teaching_guides_by_category AS
SELECT 
  tg.id,
  tg.doc_id,
  tg.guide_type,
  tg.applicable_grades,
  tg.topic,
  tg.subtopic,
  tg.section_header,
  tg.chunk_text,
  tg.applicable_categories,
  tg.is_general,
  tg.lang,
  unnest(tg.applicable_categories) as category
FROM teaching_guides_chunks tg;

-- Step 6: Create function to get guides for student
CREATE OR REPLACE FUNCTION get_teaching_guides_for_student(
  p_student_id UUID,
  p_subject TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  guide_type TEXT,
  topic TEXT,
  subtopic TEXT,
  section_header TEXT,
  chunk_text TEXT,
  applicable_categories TEXT[],
  relevance_score FLOAT
) AS $$
DECLARE
  v_grade TEXT;
  v_primary_category TEXT;
  v_secondary_category TEXT;
  v_category_scores JSONB;
BEGIN
  -- Get student info
  SELECT 
    s.grade,
    s.primary_category,
    s.secondary_category,
    s.category_scores
  INTO 
    v_grade,
    v_primary_category,
    v_secondary_category,
    v_category_scores
  FROM students s
  WHERE s.id = p_student_id;
  
  -- Return guides filtered by grade and categories
  RETURN QUERY
  SELECT 
    tg.id,
    tg.guide_type,
    tg.topic,
    tg.subtopic,
    tg.section_header,
    tg.chunk_text,
    tg.applicable_categories,
    -- Calculate relevance score
    CASE 
      WHEN v_primary_category = ANY(tg.applicable_categories) THEN 1.0
      WHEN v_secondary_category = ANY(tg.applicable_categories) THEN 0.8
      WHEN 'general' = ANY(tg.applicable_categories) THEN 0.5
      ELSE 0.3
    END as relevance_score
  FROM teaching_guides_chunks tg
  WHERE 
    -- Match grade
    (v_grade = ANY(tg.applicable_grades) OR tg.is_general = true)
    -- Match subject if provided
    AND (p_subject IS NULL OR tg.topic ILIKE '%' || p_subject || '%')
    -- Match categories or general
    AND (
      v_primary_category = ANY(tg.applicable_categories)
      OR v_secondary_category = ANY(tg.applicable_categories)
      OR 'general' = ANY(tg.applicable_categories)
    )
  ORDER BY relevance_score DESC, tg.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create function to get category-specific strategies
CREATE OR REPLACE FUNCTION get_category_strategies(
  p_category TEXT,
  p_grade TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  guide_type TEXT,
  topic TEXT,
  section_header TEXT,
  chunk_text TEXT,
  applicable_grades TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tg.id,
    tg.guide_type,
    tg.topic,
    tg.section_header,
    tg.chunk_text,
    tg.applicable_grades
  FROM teaching_guides_chunks tg
  WHERE 
    p_category = ANY(tg.applicable_categories)
    AND (p_grade IS NULL OR p_grade = ANY(tg.applicable_grades) OR tg.is_general = true)
  ORDER BY tg.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Add comments
COMMENT ON COLUMN teaching_guides_chunks.applicable_categories IS 'Array of learning categories this guide addresses (visual_learner, slow_processing, etc.)';
COMMENT ON FUNCTION detect_guide_categories IS 'Automatically detects applicable learning categories from guide text content';
COMMENT ON FUNCTION tag_existing_teaching_guides IS 'Batch function to tag all existing teaching guides with categories';
COMMENT ON FUNCTION get_teaching_guides_for_student IS 'Retrieves teaching guides filtered by student grade and learning categories';
COMMENT ON FUNCTION get_category_strategies IS 'Retrieves strategies specific to a learning category';

-- Step 9: Run auto-tagging on existing guides (optional - comment out if guides don't exist yet)
-- SELECT * FROM tag_existing_teaching_guides();

-- Step 10: Create trigger for new guide inserts
CREATE OR REPLACE FUNCTION auto_tag_new_guide()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-detect categories if not provided
  IF NEW.applicable_categories = '{}' OR NEW.applicable_categories IS NULL THEN
    NEW.applicable_categories := detect_guide_categories(NEW.chunk_text);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_tag_guide ON teaching_guides_chunks;
CREATE TRIGGER trigger_auto_tag_guide
  BEFORE INSERT OR UPDATE ON teaching_guides_chunks
  FOR EACH ROW
  EXECUTE FUNCTION auto_tag_new_guide();

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Teaching Guides Category Mapping installed successfully!';
  RAISE NOTICE 'Run: SELECT * FROM tag_existing_teaching_guides(); to tag existing guides';
  RAISE NOTICE 'Use: SELECT * FROM get_teaching_guides_for_student(''student-uuid''); to retrieve filtered guides';
END $$;
