-- =====================================================
-- COGNITIVE ASSESSMENT TO CATEGORY SCORE MAPPING
-- Maps cognitive domain scores (1-5) to learning category scores (0-100)
-- =====================================================

-- Function to calculate category scores from cognitive assessment
CREATE OR REPLACE FUNCTION calculate_category_scores_from_cognitive(p_student_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_domain_scores JSONB;
  v_category_scores JSONB;
  v_processing_speed FLOAT;
  v_working_memory FLOAT;
  v_attention_focus FLOAT;
  v_learning_style FLOAT;
  v_self_efficacy FLOAT;
  v_motivation FLOAT;
  v_slow_processing INT;
  v_fast_processor INT;
  v_needs_repetition INT;
  v_sensitive_low_confidence INT;
  v_high_energy INT;
  v_easily_distracted INT;
  v_visual_learner INT;
  v_logical_learner INT;
BEGIN
  -- Get latest cognitive assessment domain scores for student
  SELECT domain_scores INTO v_domain_scores
  FROM cognitive_assessment_results
  WHERE student_id = p_student_id
  ORDER BY calculated_at DESC
  LIMIT 1;
  
  -- If no cognitive assessment exists, return balanced profile
  IF v_domain_scores IS NULL THEN
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
  
  -- Extract domain scores (1-5 scale)
  v_processing_speed := COALESCE((v_domain_scores->>'processing_speed')::FLOAT, 3.0);
  v_working_memory := COALESCE((v_domain_scores->>'working_memory')::FLOAT, 3.0);
  v_attention_focus := COALESCE((v_domain_scores->>'attention_focus')::FLOAT, 3.0);
  v_learning_style := COALESCE((v_domain_scores->>'learning_style')::FLOAT, 3.0);
  v_self_efficacy := COALESCE((v_domain_scores->>'self_efficacy')::FLOAT, 3.0);
  v_motivation := COALESCE((v_domain_scores->>'motivation_engagement')::FLOAT, 3.0);
  
  -- Calculate category scores (0-100 scale) based on thresholds
  
  -- 1. Slow Processing: High score if processing_speed < 2.5
  IF v_processing_speed < 2.5 THEN
    v_slow_processing := ROUND(((2.5 - v_processing_speed) / 2.5 * 40 + 50))::INT;
  ELSE
    v_slow_processing := ROUND((2.5 / v_processing_speed * 50))::INT;
  END IF;
  
  -- 2. Fast Processor: High score if processing_speed > 4.0
  IF v_processing_speed > 4.0 THEN
    v_fast_processor := ROUND(((v_processing_speed - 4.0) / 1.0 * 40 + 50))::INT;
  ELSE
    v_fast_processor := ROUND((v_processing_speed / 4.0 * 50))::INT;
  END IF;
  
  -- 3. Needs Repetition: High score if working_memory < 2.5
  IF v_working_memory < 2.5 THEN
    v_needs_repetition := ROUND(((2.5 - v_working_memory) / 2.5 * 35 + 50))::INT;
  ELSE
    v_needs_repetition := ROUND((2.5 / v_working_memory * 50))::INT;
  END IF;
  
  -- 4. Sensitive/Low Confidence: High score if self_efficacy < 2.5
  IF v_self_efficacy < 2.5 THEN
    v_sensitive_low_confidence := ROUND(((2.5 - v_self_efficacy) / 2.5 * 35 + 50))::INT;
  ELSE
    v_sensitive_low_confidence := ROUND((2.5 / v_self_efficacy * 50))::INT;
  END IF;
  
  -- 5. High Energy: High score if attention < 2.5 AND motivation > 3.5
  IF v_attention_focus < 2.5 AND v_motivation > 3.5 THEN
    v_high_energy := ROUND(((2.5 - v_attention_focus) / 2.5 * 30 + (v_motivation - 3.5) / 1.5 * 20 + 50))::INT;
  ELSIF v_motivation > 3.5 THEN
    v_high_energy := ROUND(((v_motivation - 3.5) / 1.5 * 40 + 30))::INT;
  ELSE
    v_high_energy := ROUND((v_motivation / 5.0 * 50))::INT;
  END IF;
  
  -- 6. Easily Distracted: High score if attention < 2.5 AND motivation < 3.5
  IF v_attention_focus < 2.5 AND v_motivation < 3.5 THEN
    v_easily_distracted := ROUND(((2.5 - v_attention_focus) / 2.5 * 35 + 50))::INT;
  ELSIF v_attention_focus < 2.5 THEN
    v_easily_distracted := ROUND(((2.5 - v_attention_focus) / 2.5 * 40 + 40))::INT;
  ELSE
    v_easily_distracted := ROUND((2.5 / v_attention_focus * 50))::INT;
  END IF;
  
  -- 7. Visual Learner: High score if learning_style > 4.0 (assuming visual preference)
  IF v_learning_style > 4.0 THEN
    v_visual_learner := ROUND(((v_learning_style - 4.0) / 1.0 * 40 + 50))::INT;
  ELSE
    v_visual_learner := ROUND((v_learning_style / 4.0 * 50))::INT;
  END IF;
  
  -- 8. Logical Learner: High score if learning_style > 4.0 (assuming logical preference)
  -- Note: In real implementation, this should check specific question responses
  -- For now, using inverse of visual (if not strongly visual, might be logical)
  IF v_learning_style > 4.0 THEN
    v_logical_learner := ROUND(((v_learning_style - 4.0) / 1.0 * 30 + 40))::INT;
  ELSE
    v_logical_learner := ROUND((v_learning_style / 4.0 * 60))::INT;
  END IF;
  
  -- Ensure all scores are within 0-100 range
  v_slow_processing := GREATEST(0, LEAST(100, v_slow_processing));
  v_fast_processor := GREATEST(0, LEAST(100, v_fast_processor));
  v_needs_repetition := GREATEST(0, LEAST(100, v_needs_repetition));
  v_sensitive_low_confidence := GREATEST(0, LEAST(100, v_sensitive_low_confidence));
  v_high_energy := GREATEST(0, LEAST(100, v_high_energy));
  v_easily_distracted := GREATEST(0, LEAST(100, v_easily_distracted));
  v_visual_learner := GREATEST(0, LEAST(100, v_visual_learner));
  v_logical_learner := GREATEST(0, LEAST(100, v_logical_learner));
  
  -- Build and return category scores JSONB
  v_category_scores := jsonb_build_object(
    'slow_processing', v_slow_processing,
    'fast_processor', v_fast_processor,
    'high_energy', v_high_energy,
    'visual_learner', v_visual_learner,
    'logical_learner', v_logical_learner,
    'sensitive_low_confidence', v_sensitive_low_confidence,
    'easily_distracted', v_easily_distracted,
    'needs_repetition', v_needs_repetition
  );
  
  RETURN v_category_scores;
END;
$$ LANGUAGE plpgsql;

-- Function to update student category scores from cognitive assessment
CREATE OR REPLACE FUNCTION update_student_category_scores()
RETURNS TRIGGER AS $$
DECLARE
  v_category_scores JSONB;
  v_primary_category TEXT;
  v_secondary_category TEXT;
  v_max_score INT := 0;
  v_second_max_score INT := 0;
  v_category TEXT;
  v_score INT;
BEGIN
  -- Calculate category scores from cognitive assessment
  v_category_scores := calculate_category_scores_from_cognitive(NEW.student_id);
  
  -- Determine primary and secondary categories (highest scores)
  FOR v_category, v_score IN 
    SELECT key, value::INT 
    FROM jsonb_each_text(v_category_scores)
    ORDER BY value::INT DESC
  LOOP
    IF v_score > v_max_score THEN
      v_second_max_score := v_max_score;
      v_secondary_category := v_primary_category;
      v_max_score := v_score;
      v_primary_category := v_category;
    ELSIF v_score > v_second_max_score THEN
      v_second_max_score := v_score;
      v_secondary_category := v_category;
    END IF;
  END LOOP;
  
  -- Update students table with category scores and primary/secondary categories
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

-- Create trigger to auto-update category scores when cognitive assessment is completed
DROP TRIGGER IF EXISTS trigger_update_category_scores ON cognitive_assessment_results;
CREATE TRIGGER trigger_update_category_scores
  AFTER INSERT OR UPDATE ON cognitive_assessment_results
  FOR EACH ROW
  EXECUTE FUNCTION update_student_category_scores();

-- Function to recalculate all student category scores (for batch updates)
CREATE OR REPLACE FUNCTION recalculate_all_category_scores()
RETURNS TABLE (
  student_id UUID,
  student_name TEXT,
  category_scores JSONB,
  primary_category TEXT,
  secondary_category TEXT
) AS $$
DECLARE
  v_student RECORD;
  v_category_scores JSONB;
  v_primary TEXT;
  v_secondary TEXT;
  v_max_score INT;
  v_second_max_score INT;
  v_category TEXT;
  v_score INT;
BEGIN
  FOR v_student IN 
    SELECT s.id, s.name 
    FROM students s
  LOOP
    -- Calculate category scores
    v_category_scores := calculate_category_scores_from_cognitive(v_student.id);
    
    -- Determine primary and secondary categories
    v_max_score := 0;
    v_second_max_score := 0;
    v_primary := NULL;
    v_secondary := NULL;
    
    FOR v_category, v_score IN 
      SELECT key, value::INT 
      FROM jsonb_each_text(v_category_scores)
      ORDER BY value::INT DESC
    LOOP
      IF v_score > v_max_score THEN
        v_second_max_score := v_max_score;
        v_secondary := v_primary;
        v_max_score := v_score;
        v_primary := v_category;
      ELSIF v_score > v_second_max_score THEN
        v_second_max_score := v_score;
        v_secondary := v_category;
      END IF;
    END LOOP;
    
    -- Update student record
    UPDATE students
    SET 
      category_scores = v_category_scores,
      primary_category = v_primary::student_category,
      secondary_category = v_secondary::student_category,
      updated_at = TIMEZONE('utc', NOW())
    WHERE id = v_student.id;
    
    -- Return result
    student_id := v_student.id;
    student_name := v_student.name;
    category_scores := v_category_scores;
    primary_category := v_primary;
    secondary_category := v_secondary;
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON FUNCTION calculate_category_scores_from_cognitive IS 'Calculates 8 learning category scores (0-100) from cognitive domain scores (1-5)';
COMMENT ON FUNCTION update_student_category_scores IS 'Trigger function to auto-update student category scores when cognitive assessment is completed';
COMMENT ON FUNCTION recalculate_all_category_scores IS 'Batch function to recalculate category scores for all students';

-- Example usage:
-- SELECT * FROM recalculate_all_category_scores();
-- SELECT calculate_category_scores_from_cognitive('student-uuid-here');
