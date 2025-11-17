-- Multiple Categories Support for Students
-- This extends the existing schema to support multiple categories per student

-- =====================================================
-- ADD MULTIPLE CATEGORIES SUPPORT
-- =====================================================

-- Add a JSONB column to store multiple categories with scores
ALTER TABLE students
ADD COLUMN IF NOT EXISTS category_scores JSONB DEFAULT '{}';

-- Add a column to store the full category profile
ALTER TABLE students
ADD COLUMN IF NOT EXISTS category_profile JSONB DEFAULT '{}';

-- Update student_assessments to store category breakdown
ALTER TABLE student_assessments
ADD COLUMN IF NOT EXISTS category_breakdown JSONB DEFAULT '{}';

-- =====================================================
-- LEARNING CATEGORIES REFERENCE TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS learning_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category_key TEXT UNIQUE NOT NULL,
  category_name TEXT NOT NULL,
  description TEXT,
  characteristics JSONB DEFAULT '[]',
  teaching_strategies JSONB DEFAULT '[]',
  typical_behaviors JSONB DEFAULT '[]',
  improvement_tips JSONB DEFAULT '[]',
  detection_questions JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =====================================================
-- SEED LEARNING CATEGORIES
-- =====================================================

INSERT INTO learning_categories (category_key, category_name, description, characteristics, teaching_strategies, typical_behaviors, improvement_tips) VALUES

('slow_processing', 'Slow Processing', 'Takes longer to process and respond to information',
'["Needs extra time to think", "Processes information thoroughly", "May struggle with timed tasks", "Benefits from step-by-step instruction"]'::jsonb,
'["Break down tasks into smaller, manageable steps", "Provide extra time for processing information", "Use visual aids and hands-on materials", "Repeat instructions in different ways", "Check for understanding frequently"]'::jsonb,
'["Takes longer to answer questions", "May appear hesitant", "Double-checks work frequently", "Prefers detailed explanations"]'::jsonb,
'["Practice with timed activities gradually", "Build confidence with achievable goals", "Use scaffolding techniques", "Celebrate progress, not speed"]'::jsonb),

('fast_processor', 'Fast Processor', 'Quickly grasps concepts and completes tasks ahead of peers',
'["Understands concepts quickly", "Finishes work early", "May become bored with repetition", "Seeks challenging material"]'::jsonb,
'["Provide advanced materials and enrichment activities", "Encourage leadership roles in group work", "Offer independent study projects", "Challenge with higher-order thinking questions", "Assign mentoring roles to help other students"]'::jsonb,
'["Finishes assignments early", "May rush through work", "Seeks additional challenges", "Can explain concepts to peers"]'::jsonb,
'["Encourage depth over speed", "Provide extension activities", "Foster critical thinking skills", "Challenge with complex problems"]'::jsonb),

('high_energy', 'High Energy', 'Needs movement and physical activity to learn effectively',
'["Fidgets or moves frequently", "Learns better with hands-on activities", "May struggle sitting still", "Energetic and enthusiastic"]'::jsonb,
'["Incorporate movement breaks into lessons", "Use active learning strategies (games, group work)", "Provide fidget tools or flexible seating", "Channel energy into leadership activities", "Break lessons into shorter, focused segments"]'::jsonb,
'["Difficulty sitting still", "Prefers hands-on learning", "Talks while working", "Energetic participation"]'::jsonb,
'["Provide structured movement opportunities", "Use kinesthetic learning activities", "Set clear expectations for movement times", "Channel energy positively"]'::jsonb),

('visual_learner', 'Visual Learner', 'Learns best through seeing and visualizing information',
'["Remembers what they see", "Prefers diagrams and charts", "Strong spatial awareness", "Likes color-coding and organization"]'::jsonb,
'["Use diagrams, charts, and graphic organizers", "Incorporate videos and demonstrations", "Color-code materials and notes", "Use mind maps for complex concepts", "Provide written instructions alongside verbal"]'::jsonb,
'["Draws pictures while learning", "Prefers written instructions", "Strong visual memory", "Organizes materials visually"]'::jsonb,
'["Teach note-taking with visual elements", "Encourage mind mapping", "Use color strategically", "Provide graphic organizers"]'::jsonb),

('auditory_learner', 'Auditory Learner', 'Learns best through listening and verbal instruction',
'["Remembers what they hear", "Enjoys discussions", "Talks through problems", "Strong verbal skills"]'::jsonb,
'["Use verbal explanations and discussions", "Encourage reading aloud", "Incorporate music and rhythm", "Provide opportunities for verbal repetition", "Use storytelling techniques"]'::jsonb,
'["Talks while working", "Prefers verbal instructions", "Enjoys group discussions", "Remembers spoken information well"]'::jsonb,
'["Encourage self-talk strategies", "Use recorded lessons", "Practice verbal rehearsal", "Incorporate music mnemonics"]'::jsonb),

('logical_learner', 'Logical Learner', 'Thinks in patterns, sequences, and logical connections',
'["Excels at patterns and sequences", "Enjoys problem-solving", "Asks "why" questions", "Likes organized information"]'::jsonb,
'["Present information in a structured, sequential manner", "Use problem-solving activities and puzzles", "Connect lessons to real-world applications", "Encourage pattern recognition and categorization", "Provide opportunities for analysis and reasoning"]'::jsonb,
'["Seeks logical explanations", "Enjoys math and science", "Likes puzzles and brain teasers", "Questions inconsistencies"]'::jsonb,
'["Provide logical frameworks", "Use deductive reasoning activities", "Connect concepts systematically", "Encourage analytical thinking"]'::jsonb),

('kinesthetic_learner', 'Kinesthetic Learner', 'Learns through touch, movement, and doing',
'["Learns by doing", "Needs hands-on activities", "Strong muscle memory", "Prefers active participation"]'::jsonb,
'["Provide hands-on experiments and activities", "Use manipulatives and physical objects", "Incorporate role-playing and simulations", "Allow movement during learning", "Use gesture and body movement"]'::jsonb,
'["Fidgets with objects", "Prefers lab work and experiments", "Uses gestures when explaining", "Learns through physical practice"]'::jsonb,
'["Maximize hands-on opportunities", "Use physical mnemonics", "Incorporate building/creating", "Allow active participation"]'::jsonb),

('sensitive_low_confidence', 'Sensitive/Low Confidence', 'Needs encouragement and supportive environment',
'["Hesitant to try new things", "Fears making mistakes", "Needs reassurance", "Emotionally aware"]'::jsonb,
'["Build confidence through small, achievable goals", "Provide frequent, specific positive feedback", "Create a supportive, low-pressure environment", "Use private check-ins instead of public questioning", "Celebrate effort and progress, not just results"]'::jsonb,
'["Asks for reassurance", "Avoids risks", "Upset by criticism", "Seeks approval"]'::jsonb,
'["Build on strengths first", "Normalize mistakes as learning", "Set achievable milestones", "Provide emotional support"]'::jsonb),

('easily_distracted', 'Easily Distracted', 'Struggles with focus and attention',
'["Attention wanders easily", "Sensitive to environmental stimuli", "Difficulty completing tasks", "Needs redirection"]'::jsonb,
'["Seat near the front, away from distractions", "Use clear, concise instructions", "Break tasks into shorter intervals with breaks", "Provide fidget tools or sensory breaks", "Use visual and auditory cues to regain focus"]'::jsonb,
'["Looks around frequently", "Starts tasks but doesn\'t finish", "Affected by noise/movement", "Needs frequent reminders"]'::jsonb,
'["Minimize environmental distractions", "Use timers and visual schedules", "Teach self-monitoring strategies", "Provide structured breaks"]'::jsonb),

('needs_repetition', 'Needs Repetition', 'Requires multiple exposures to master concepts',
'["Needs multiple examples", "Benefits from review", "Learns through practice", "Improves with repetition"]'::jsonb,
'["Review previous lessons before introducing new material", "Use spaced repetition for key concepts", "Provide multiple examples of the same concept", "Incorporate regular practice and review sessions", "Use different modalities (visual, auditory, kinesthetic)"]'::jsonb,
'["Forgets without review", "Improves with practice", "Asks for examples", "Needs reminders"]'::jsonb,
'["Use spaced repetition systems", "Provide varied practice", "Review regularly", "Use multiple teaching methods"]'::jsonb),

('social_learner', 'Social Learner', 'Learns best through interaction and collaboration',
'["Enjoys group work", "Learns from peers", "Communicative", "Values relationships"]'::jsonb,
'["Use collaborative learning activities", "Encourage peer teaching", "Facilitate group discussions", "Provide opportunities for social interaction", "Use think-pair-share strategies"]'::jsonb,
'["Seeks group activities", "Talks while learning", "Enjoys peer feedback", "Works well in teams"]'::jsonb,
'["Maximize collaborative opportunities", "Use peer tutoring", "Facilitate discussions", "Build learning communities"]'::jsonb),

('independent_learner', 'Independent Learner', 'Prefers to work alone and self-direct learning',
'["Self-motivated", "Prefers working alone", "Takes initiative", "Manages time well"]'::jsonb,
'["Provide independent study options", "Allow self-paced learning", "Give autonomy in project choice", "Minimize group requirements", "Offer advanced reading materials"]'::jsonb,
'["Works best alone", "Self-directed", "Completes work independently", "Prefers individual tasks"]'::jsonb,
'["Provide choice in activities", "Allow flexible pacing", "Encourage self-assessment", "Support independent projects"]'::jsonb);

-- =====================================================
-- CATEGORY DETECTION WEIGHTS
-- =====================================================

-- This helps determine which categories a student belongs to based on assessment results
CREATE TABLE IF NOT EXISTS category_detection_rules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category_key TEXT REFERENCES learning_categories(category_key),
  rule_type TEXT NOT NULL, -- 'score_range', 'time_range', 'pattern', 'answer_analysis'
  rule_condition JSONB NOT NULL,
  weight DECIMAL(3,2) DEFAULT 1.0, -- How much this rule contributes to category detection
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Seed detection rules
INSERT INTO category_detection_rules (category_key, rule_type, rule_condition, weight) VALUES
('fast_processor', 'score_range', '{"min_score_percentage": 80, "max_time_percentile": 25}'::jsonb, 1.0),
('slow_processing', 'time_range', '{"min_time_percentile": 75}'::jsonb, 1.0),
('logical_learner', 'pattern', '{"correct_pattern_questions_percentage": 70}'::jsonb, 0.8),
('needs_repetition', 'answer_analysis', '{"incorrect_repeated_concept_types": 2}'::jsonb, 0.9),
('easily_distracted', 'time_range', '{"time_inconsistency_variance": 2.0}'::jsonb, 0.7);

-- =====================================================
-- FUNCTION: Calculate Multiple Categories for Student
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_student_categories(
  p_student_id UUID,
  p_assessment_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_category_scores JSONB := '{}';
  v_assessment_data RECORD;
  v_total_score INTEGER;
  v_total_questions INTEGER;
  v_time_taken INTEGER;
  v_score_percentage DECIMAL;
BEGIN
  -- Get latest assessment if not specified
  IF p_assessment_id IS NULL THEN
    SELECT id INTO p_assessment_id
    FROM student_assessments
    WHERE student_id = p_student_id
    ORDER BY assessment_date DESC
    LIMIT 1;
  END IF;

  -- Get assessment data
  SELECT score, total_questions, time_taken
  INTO v_total_score, v_total_questions, v_time_taken
  FROM student_assessments
  WHERE id = p_assessment_id;

  v_score_percentage := (v_total_score::DECIMAL / v_total_questions::DECIMAL) * 100;

  -- Fast Processor detection (high score, low time)
  IF v_score_percentage >= 80 AND v_time_taken < 300 THEN
    v_category_scores := jsonb_set(v_category_scores, '{fast_processor}', to_jsonb(v_score_percentage::INTEGER));
  END IF;

  -- Slow Processing detection (high time regardless of score)
  IF v_time_taken > 600 THEN
    v_category_scores := jsonb_set(v_category_scores, '{slow_processing}', to_jsonb(100 - ((v_time_taken - 600) / 10)::INTEGER));
  END IF;

  -- Logical Learner (good performance on logic questions)
  IF v_score_percentage >= 70 THEN
    v_category_scores := jsonb_set(v_category_scores, '{logical_learner}', to_jsonb(v_score_percentage::INTEGER));
  END IF;

  -- Needs Repetition (moderate score, suggests foundational understanding gaps)
  IF v_score_percentage >= 40 AND v_score_percentage < 70 THEN
    v_category_scores := jsonb_set(v_category_scores, '{needs_repetition}', to_jsonb((100 - v_score_percentage)::INTEGER));
  END IF;

  -- Visual Learner (would need question-specific analysis, placeholder for now)
  IF v_score_percentage >= 60 THEN
    v_category_scores := jsonb_set(v_category_scores, '{visual_learner}', to_jsonb(60));
  END IF;

  RETURN v_category_scores;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER: Auto-update student categories after assessment
-- =====================================================

CREATE OR REPLACE FUNCTION update_student_category_scores()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate and update student's category scores
  UPDATE students
  SET
    category_scores = calculate_student_categories(NEW.student_id, NEW.id),
    primary_category = NEW.category_determined,
    updated_at = NOW()
  WHERE id = NEW.student_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_student_categories
AFTER INSERT OR UPDATE ON student_assessments
FOR EACH ROW
EXECUTE FUNCTION update_student_category_scores();

-- =====================================================
-- VIEW: Student Category Overview
-- =====================================================

CREATE OR REPLACE VIEW student_category_overview AS
SELECT
  s.id as student_id,
  s.name as student_name,
  s.primary_category,
  s.category_scores,
  c.name as class_name,
  c.user_id as teacher_id,
  COUNT(sa.id) as total_assessments,
  MAX(sa.assessment_date) as last_assessment_date
FROM students s
LEFT JOIN classes c ON s.class_id = c.id
LEFT JOIN student_assessments sa ON s.id = sa.student_id
GROUP BY s.id, s.name, s.primary_category, s.category_scores, c.name, c.user_id;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE learning_categories IS 'Master list of all learning categories with teaching strategies';
COMMENT ON TABLE category_detection_rules IS 'Rules for automatically detecting student categories from assessment data';
COMMENT ON COLUMN students.category_scores IS 'JSONB object with category keys and their confidence scores (0-100)';
COMMENT ON COLUMN students.category_profile IS 'Full profile with dominant categories and teaching recommendations';
COMMENT ON FUNCTION calculate_student_categories IS 'Analyzes assessment data to determine which categories a student belongs to';
