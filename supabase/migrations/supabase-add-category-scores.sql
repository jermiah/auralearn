-- Add category_scores JSONB column to students table
-- This column stores scores (0-100) for each of the 8 learning categories

ALTER TABLE students
ADD COLUMN IF NOT EXISTS category_scores JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN students.category_scores IS 'JSONB object containing scores (0-100) for 8 learning categories: slow_processing, fast_processor, high_energy, visual_learner, logical_learner, sensitive_low_confidence, easily_distracted, needs_repetition';

-- Example structure:
-- {
--   "slow_processing": 75,
--   "fast_processor": 30,
--   "high_energy": 45,
--   "visual_learner": 80,
--   "logical_learner": 50,
--   "sensitive_low_confidence": 65,
--   "easily_distracted": 40,
--   "needs_repetition": 70
-- }
