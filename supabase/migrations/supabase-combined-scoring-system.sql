-- =====================================================================
-- COMBINED SCORING SYSTEM: Cognitive + Academic Assessments
-- =====================================================================
-- This system combines TWO assessment types to calculate category scores:
-- 1. Cognitive Assessment (HOW they learn - learning profile)
-- 2. Academic Assessment (WHAT they struggle with - curriculum performance)
--
-- RESULT: Students can fall into MULTIPLE buckets based on combined evidence
-- =====================================================================

-- Drop existing function to replace with combined approach
DROP FUNCTION IF EXISTS calculate_combined_category_scores(UUID);

-- =====================================================================
-- MAIN FUNCTION: Calculate Combined Category Scores
-- =====================================================================

CREATE OR REPLACE FUNCTION calculate_combined_category_scores(
  p_student_id UUID
)
RETURNS JSONB AS $$
DECLARE
  -- Cognitive assessment variables
  v_cognitive_scores JSONB;
  v_processing_speed FLOAT;
  v_working_memory FLOAT;
  v_attention_focus FLOAT;
  v_learning_style FLOAT;
  v_self_efficacy FLOAT;
  v_motivation FLOAT;

  -- Academic assessment variables
  v_academic_score_pct DECIMAL;
  v_academic_time_taken INTEGER;
  v_has_academic_assessment BOOLEAN := FALSE;
  v_has_cognitive_assessment BOOLEAN := FALSE;

  -- Combined category scores (0-100)
  v_slow_processing INTEGER := 0;
  v_fast_processor INTEGER := 0;
  v_high_energy INTEGER := 0;
  v_visual_learner INTEGER := 0;
  v_logical_learner INTEGER := 0;
  v_sensitive_low_confidence INTEGER := 0;
  v_easily_distracted INTEGER := 0;
  v_needs_repetition INTEGER := 0;

  -- Weights for combining scores
  v_cognitive_weight FLOAT := 0.6;  -- 60% weight to cognitive
  v_academic_weight FLOAT := 0.4;   -- 40% weight to academic
BEGIN

  -- ===================================================================
  -- PART 1: GET COGNITIVE ASSESSMENT DATA
  -- ===================================================================

  SELECT domain_scores INTO v_cognitive_scores
  FROM cognitive_assessment_results
  WHERE student_id = p_student_id
  ORDER BY calculated_at DESC
  LIMIT 1;

  IF v_cognitive_scores IS NOT NULL THEN
    v_has_cognitive_assessment := TRUE;

    -- Extract domain scores
    v_processing_speed := COALESCE((v_cognitive_scores->>'processing_speed')::FLOAT, 3.0);
    v_working_memory := COALESCE((v_cognitive_scores->>'working_memory')::FLOAT, 3.0);
    v_attention_focus := COALESCE((v_cognitive_scores->>'attention_focus')::FLOAT, 3.0);
    v_learning_style := COALESCE((v_cognitive_scores->>'learning_style')::FLOAT, 3.0);
    v_self_efficacy := COALESCE((v_cognitive_scores->>'self_efficacy')::FLOAT, 3.0);
    v_motivation := COALESCE((v_cognitive_scores->>'motivation_engagement')::FLOAT, 3.0);
  END IF;

  -- ===================================================================
  -- PART 2: GET ACADEMIC ASSESSMENT DATA
  -- ===================================================================

  SELECT
    (score::DECIMAL / total_questions::DECIMAL) * 100,
    time_taken
  INTO v_academic_score_pct, v_academic_time_taken
  FROM student_assessments
  WHERE student_id = p_student_id
  ORDER BY assessment_date DESC
  LIMIT 1;

  IF v_academic_score_pct IS NOT NULL THEN
    v_has_academic_assessment := TRUE;
  END IF;

  -- ===================================================================
  -- FALLBACK: If no assessments exist, return balanced profile
  -- ===================================================================

  IF NOT v_has_cognitive_assessment AND NOT v_has_academic_assessment THEN
    RETURN jsonb_build_object(
      'slow_processing', 50,
      'fast_processor', 50,
      'high_energy', 50,
      'visual_learner', 50,
      'logical_learner', 50,
      'sensitive_low_confidence', 50,
      'easily_distracted', 50,
      'needs_repetition', 50
    );
  END IF;

  -- ===================================================================
  -- PART 3: CALCULATE CATEGORY SCORES (COMBINED APPROACH)
  -- ===================================================================

  -- ---------------------------------------------------------------------
  -- 1. SLOW_PROCESSING
  -- Cognitive: Low processing_speed (< 2.5)
  -- Academic: High time_taken (> 600 seconds = 10 minutes)
  -- ---------------------------------------------------------------------

  IF v_has_cognitive_assessment THEN
    IF v_processing_speed < 2.5 THEN
      v_slow_processing := ROUND(((2.5 - v_processing_speed) / 1.5) * 50 + 50);
    ELSIF v_processing_speed > 3.5 THEN
      v_slow_processing := ROUND(((5.0 - v_processing_speed) / 1.5) * 30);
    ELSE
      v_slow_processing := 40;
    END IF;
  END IF;

  IF v_has_academic_assessment AND v_academic_time_taken > 600 THEN
    -- Academic evidence: Slow completion time
    DECLARE
      v_academic_slow_score INTEGER := LEAST(100, 100 - ((v_academic_time_taken - 600) / 10));
    BEGIN
      IF v_has_cognitive_assessment THEN
        -- Combine cognitive + academic
        v_slow_processing := ROUND(v_slow_processing * v_cognitive_weight + v_academic_slow_score * v_academic_weight);
      ELSE
        -- Use academic only
        v_slow_processing := v_academic_slow_score;
      END IF;
    END;
  END IF;

  -- ---------------------------------------------------------------------
  -- 2. FAST_PROCESSOR
  -- Cognitive: High processing_speed (> 4.0)
  -- Academic: High score (>= 80%) + Low time (< 300 seconds = 5 minutes)
  -- ---------------------------------------------------------------------

  IF v_has_cognitive_assessment THEN
    IF v_processing_speed > 4.0 THEN
      v_fast_processor := ROUND(((v_processing_speed - 3.0) / 2.0) * 50 + 50);
    ELSIF v_processing_speed < 2.5 THEN
      v_fast_processor := ROUND((v_processing_speed / 2.5) * 30);
    ELSE
      v_fast_processor := 40;
    END IF;
  END IF;

  IF v_has_academic_assessment AND v_academic_score_pct >= 80 AND v_academic_time_taken < 300 THEN
    -- Academic evidence: Fast + Accurate
    DECLARE
      v_academic_fast_score INTEGER := ROUND(v_academic_score_pct);
    BEGIN
      IF v_has_cognitive_assessment THEN
        v_fast_processor := ROUND(v_fast_processor * v_cognitive_weight + v_academic_fast_score * v_academic_weight);
      ELSE
        v_fast_processor := v_academic_fast_score;
      END IF;
    END;
  END IF;

  -- ---------------------------------------------------------------------
  -- 3. NEEDS_REPETITION
  -- Cognitive: Low working_memory (< 2.5)
  -- Academic: Moderate score (40-70%) indicates understanding gaps
  -- ---------------------------------------------------------------------

  IF v_has_cognitive_assessment THEN
    IF v_working_memory < 2.5 THEN
      v_needs_repetition := ROUND(((2.5 - v_working_memory) / 1.5) * 50 + 50);
    ELSIF v_working_memory > 3.5 THEN
      v_needs_repetition := ROUND(((5.0 - v_working_memory) / 1.5) * 30);
    ELSE
      v_needs_repetition := 40;
    END IF;
  END IF;

  IF v_has_academic_assessment AND v_academic_score_pct >= 40 AND v_academic_score_pct < 70 THEN
    -- Academic evidence: Moderate performance suggests foundational gaps
    DECLARE
      v_academic_repetition_score INTEGER := ROUND(100 - v_academic_score_pct);
    BEGIN
      IF v_has_cognitive_assessment THEN
        v_needs_repetition := ROUND(v_needs_repetition * v_cognitive_weight + v_academic_repetition_score * v_academic_weight);
      ELSE
        v_needs_repetition := v_academic_repetition_score;
      END IF;
    END;
  END IF;

  -- ---------------------------------------------------------------------
  -- 4. LOGICAL_LEARNER
  -- Cognitive: High learning_style (> 4.0) + High processing_speed (>= 4.0)
  -- Academic: High score (>= 70%) on curriculum assessment
  -- ---------------------------------------------------------------------

  IF v_has_cognitive_assessment THEN
    IF v_learning_style > 4.0 AND v_processing_speed >= 4.0 THEN
      v_logical_learner := ROUND(((v_learning_style - 3.0) / 2.0) * 50 + 50);
    ELSIF v_learning_style >= 3.0 THEN
      v_logical_learner := ROUND((v_learning_style / 5.0) * 60);
    ELSE
      v_logical_learner := ROUND((v_learning_style / 5.0) * 40);
    END IF;
  END IF;

  IF v_has_academic_assessment AND v_academic_score_pct >= 70 THEN
    -- Academic evidence: Strong curriculum performance
    DECLARE
      v_academic_logical_score INTEGER := ROUND(v_academic_score_pct);
    BEGIN
      IF v_has_cognitive_assessment THEN
        v_logical_learner := ROUND(v_logical_learner * v_cognitive_weight + v_academic_logical_score * v_academic_weight);
      ELSE
        v_logical_learner := v_academic_logical_score;
      END IF;
    END;
  END IF;

  -- ---------------------------------------------------------------------
  -- 5. VISUAL_LEARNER
  -- Cognitive: High learning_style (> 4.0) + Low processing_speed (< 3.5)
  -- Academic: Moderate-High score (>= 60%) suggests visual strength
  -- ---------------------------------------------------------------------

  IF v_has_cognitive_assessment THEN
    IF v_learning_style > 4.0 AND v_processing_speed < 3.5 THEN
      v_visual_learner := ROUND(((v_learning_style - 3.0) / 2.0) * 50 + 50);
    ELSIF v_learning_style >= 3.0 THEN
      v_visual_learner := ROUND((v_learning_style / 5.0) * 60);
    ELSE
      v_visual_learner := ROUND((v_learning_style / 5.0) * 40);
    END IF;
  END IF;

  IF v_has_academic_assessment AND v_academic_score_pct >= 60 THEN
    -- Academic evidence: Solid performance (placeholder - ideally check visual question types)
    DECLARE
      v_academic_visual_score INTEGER := 60;
    BEGIN
      IF v_has_cognitive_assessment THEN
        v_visual_learner := ROUND(v_visual_learner * v_cognitive_weight + v_academic_visual_score * v_academic_weight);
      ELSE
        v_visual_learner := v_academic_visual_score;
      END IF;
    END;
  END IF;

  -- ---------------------------------------------------------------------
  -- 6. SENSITIVE_LOW_CONFIDENCE
  -- Cognitive: Low self_efficacy (< 2.5)
  -- Academic: (Future: Could analyze question skipping patterns)
  -- ---------------------------------------------------------------------

  IF v_has_cognitive_assessment THEN
    IF v_self_efficacy < 2.5 THEN
      v_sensitive_low_confidence := ROUND(((2.5 - v_self_efficacy) / 1.5) * 50 + 50);
    ELSIF v_self_efficacy > 3.5 THEN
      v_sensitive_low_confidence := ROUND(((5.0 - v_self_efficacy) / 1.5) * 30);
    ELSE
      v_sensitive_low_confidence := 40;
    END IF;
  END IF;

  -- ---------------------------------------------------------------------
  -- 7. EASILY_DISTRACTED
  -- Cognitive: Low attention_focus (< 2.5) + Low motivation (< 3.5)
  -- Academic: (Future: Could analyze time variance per question)
  -- ---------------------------------------------------------------------

  IF v_has_cognitive_assessment THEN
    IF v_attention_focus < 2.5 AND v_motivation < 3.5 THEN
      v_easily_distracted := ROUND(((2.5 - v_attention_focus) / 1.5) * 50 + 50);
    ELSIF v_attention_focus < 2.5 THEN
      v_easily_distracted := ROUND(((2.5 - v_attention_focus) / 1.5) * 40 + 40);
    ELSIF v_attention_focus > 3.5 THEN
      v_easily_distracted := ROUND(((5.0 - v_attention_focus) / 1.5) * 30);
    ELSE
      v_easily_distracted := 40;
    END IF;
  END IF;

  -- ---------------------------------------------------------------------
  -- 8. HIGH_ENERGY
  -- Cognitive: Low attention_focus (< 2.5) + HIGH motivation (> 3.5)
  -- Academic: (Future: Could analyze completion pace)
  -- ---------------------------------------------------------------------

  IF v_has_cognitive_assessment THEN
    IF v_attention_focus < 2.5 AND v_motivation > 3.5 THEN
      v_high_energy := ROUND(((v_motivation - 2.0) / 3.0) * 40 + 50);
    ELSIF v_motivation > 4.0 THEN
      v_high_energy := ROUND(((v_motivation - 3.0) / 2.0) * 30 + 40);
    ELSE
      v_high_energy := ROUND((v_motivation / 5.0) * 50);
    END IF;
  END IF;

  -- ===================================================================
  -- ENSURE ALL SCORES ARE WITHIN 0-100 RANGE
  -- ===================================================================

  v_slow_processing := GREATEST(0, LEAST(100, v_slow_processing));
  v_fast_processor := GREATEST(0, LEAST(100, v_fast_processor));
  v_needs_repetition := GREATEST(0, LEAST(100, v_needs_repetition));
  v_logical_learner := GREATEST(0, LEAST(100, v_logical_learner));
  v_visual_learner := GREATEST(0, LEAST(100, v_visual_learner));
  v_sensitive_low_confidence := GREATEST(0, LEAST(100, v_sensitive_low_confidence));
  v_easily_distracted := GREATEST(0, LEAST(100, v_easily_distracted));
  v_high_energy := GREATEST(0, LEAST(100, v_high_energy));

  -- ===================================================================
  -- RETURN COMBINED CATEGORY SCORES
  -- ===================================================================

  RETURN jsonb_build_object(
    'slow_processing', v_slow_processing,
    'fast_processor', v_fast_processor,
    'high_energy', v_high_energy,
    'visual_learner', v_visual_learner,
    'logical_learner', v_logical_learner,
    'sensitive_low_confidence', v_sensitive_low_confidence,
    'easily_distracted', v_easily_distracted,
    'needs_repetition', v_needs_repetition
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- FUNCTION: Get Multiple Buckets for Student
-- Students can belong to MULTIPLE buckets if their scores are >= 60
-- =====================================================================

CREATE OR REPLACE FUNCTION get_student_buckets(
  p_student_id UUID,
  p_threshold INTEGER DEFAULT 60
)
RETURNS TEXT[] AS $$
DECLARE
  v_category_scores JSONB;
  v_buckets TEXT[] := ARRAY[]::TEXT[];
  v_category TEXT;
  v_score INTEGER;
BEGIN
  -- Get combined category scores
  v_category_scores := calculate_combined_category_scores(p_student_id);

  -- Iterate through all categories and add to buckets if score >= threshold
  FOR v_category, v_score IN
    SELECT key, value::INTEGER
    FROM jsonb_each_text(v_category_scores)
    ORDER BY value::INTEGER DESC
  LOOP
    IF v_score >= p_threshold THEN
      v_buckets := array_append(v_buckets, v_category);
    END IF;
  END LOOP;

  RETURN v_buckets;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- TRIGGER: Auto-update on either assessment type completion
-- =====================================================================

CREATE OR REPLACE FUNCTION update_combined_category_scores()
RETURNS TRIGGER AS $$
DECLARE
  v_category_scores JSONB;
  v_buckets TEXT[];
  v_primary_category TEXT;
  v_secondary_category TEXT;
BEGIN
  -- Calculate combined scores
  v_category_scores := calculate_combined_category_scores(NEW.student_id);

  -- Get all buckets (categories with score >= 60)
  v_buckets := get_student_buckets(NEW.student_id, 60);

  -- Determine primary and secondary categories (highest scores)
  SELECT INTO v_primary_category, v_secondary_category
    (SELECT key FROM jsonb_each_text(v_category_scores) ORDER BY value::INTEGER DESC LIMIT 1),
    (SELECT key FROM jsonb_each_text(v_category_scores) ORDER BY value::INTEGER DESC OFFSET 1 LIMIT 1);

  -- Update students table
  UPDATE students
  SET
    category_scores = v_category_scores,
    primary_category = v_primary_category::student_category,
    secondary_category = v_secondary_category::student_category,
    updated_at = TIMEZONE('utc', NOW())
  WHERE id = NEW.student_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop old triggers if they exist
DROP TRIGGER IF EXISTS trigger_update_category_scores_from_cognitive ON cognitive_assessment_results;
DROP TRIGGER IF EXISTS trigger_update_student_categories ON student_assessments;

-- Create new combined triggers
CREATE TRIGGER trigger_combined_scores_from_cognitive
AFTER INSERT OR UPDATE ON cognitive_assessment_results
FOR EACH ROW
EXECUTE FUNCTION update_combined_category_scores();

CREATE TRIGGER trigger_combined_scores_from_academic
AFTER INSERT OR UPDATE ON student_assessments
FOR EACH ROW
EXECUTE FUNCTION update_combined_category_scores();

-- =====================================================================
-- HELPER VIEW: Students with their buckets
-- =====================================================================

CREATE OR REPLACE VIEW student_category_buckets AS
SELECT
  s.id as student_id,
  s.name as student_name,
  s.primary_category,
  s.secondary_category,
  s.category_scores,
  get_student_buckets(s.id, 60) as assigned_buckets,
  array_length(get_student_buckets(s.id, 60), 1) as bucket_count
FROM students s;

-- =====================================================================
-- COMMENTS
-- =====================================================================

COMMENT ON FUNCTION calculate_combined_category_scores IS
'Calculates category scores (0-100) by combining cognitive assessment (60% weight) and academic assessment (40% weight). Students can score high in multiple categories.';

COMMENT ON FUNCTION get_student_buckets IS
'Returns array of category names where student scores >= threshold (default 60). Enables multi-bucket assignment.';

COMMENT ON VIEW student_category_buckets IS
'Shows all students with their assigned category buckets (categories where score >= 60).';

-- =====================================================================
-- Example Usage:
-- =====================================================================

-- Get combined scores for a student
-- SELECT calculate_combined_category_scores('student-uuid');

-- Get all buckets for a student
-- SELECT get_student_buckets('student-uuid');

-- View all students with their buckets
-- SELECT * FROM student_category_buckets;

-- Find students in specific bucket
-- SELECT * FROM student_category_buckets
-- WHERE 'slow_processing' = ANY(assigned_buckets);
