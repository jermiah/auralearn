-- Seed Assessment Questions
-- Run this in Supabase SQL Editor AFTER running supabase-student-assessment-schema.sql

-- =====================================================
-- SAMPLE ASSESSMENT QUESTIONS
-- =====================================================

-- Easy Questions (Difficulty 1-3)

INSERT INTO assessment_questions (category, difficulty_level, question_type, base_question, options, correct_answer, explanation, tags) VALUES
('slow_processing', 2, 'multiple_choice', 'What is 2 + 2?',
'[{"value": "3", "label": "3"}, {"value": "4", "label": "4"}, {"value": "5", "label": "5"}, {"value": "6", "label": "6"}]'::jsonb,
'4', 'Basic addition: 2 + 2 = 4', ARRAY['math', 'addition', 'basic']),

('visual_learner', 2, 'multiple_choice', 'What shape has 3 sides?',
'[{"value": "circle", "label": "Circle"}, {"value": "square", "label": "Square"}, {"value": "triangle", "label": "Triangle"}, {"value": "rectangle", "label": "Rectangle"}]'::jsonb,
'triangle', 'A triangle has 3 sides', ARRAY['shapes', 'geometry', 'visual']),

('needs_repetition', 3, 'multiple_choice', 'Which word rhymes with "cat"?',
'[{"value": "dog", "label": "Dog"}, {"value": "hat", "label": "Hat"}, {"value": "fish", "label": "Fish"}, {"value": "bird", "label": "Bird"}]'::jsonb,
'hat', 'Cat and hat rhyme because they both end with -at', ARRAY['reading', 'rhyming', 'phonics']);

-- Medium Questions (Difficulty 4-6)

INSERT INTO assessment_questions (category, difficulty_level, question_type, base_question, options, correct_answer, explanation, tags) VALUES
('logical_learner', 5, 'multiple_choice', 'If John has 5 apples and gives 2 to his friend, how many does he have left?',
'[{"value": "2", "label": "2"}, {"value": "3", "label": "3"}, {"value": "4", "label": "4"}, {"value": "5", "label": "5"}]'::jsonb,
'3', 'Subtraction problem: 5 - 2 = 3', ARRAY['math', 'subtraction', 'word_problem']),

('high_energy', 5, 'multiple_choice', 'What comes next in the pattern: 2, 4, 6, 8, ?',
'[{"value": "9", "label": "9"}, {"value": "10", "label": "10"}, {"value": "11", "label": "11"}, {"value": "12", "label": "12"}]'::jsonb,
'10', 'The pattern increases by 2 each time', ARRAY['patterns', 'sequences', 'math']),

('visual_learner', 5, 'multiple_choice', 'How many sides does a hexagon have?',
'[{"value": "4", "label": "4"}, {"value": "5", "label": "5"}, {"value": "6", "label": "6"}, {"value": "7", "label": "7"}]'::jsonb,
'6', 'A hexagon has 6 sides', ARRAY['shapes', 'geometry']),

('fast_processor', 6, 'multiple_choice', 'What is 7 × 8?',
'[{"value": "54", "label": "54"}, {"value": "56", "label": "56"}, {"value": "58", "label": "58"}, {"value": "64", "label": "64"}]'::jsonb,
'56', 'Multiplication: 7 × 8 = 56', ARRAY['math', 'multiplication']);

-- Hard Questions (Difficulty 7-10)

INSERT INTO assessment_questions (category, difficulty_level, question_type, base_question, options, correct_answer, explanation, tags) VALUES
('fast_processor', 8, 'multiple_choice', 'If a rectangle has a length of 10 and width of 5, what is its area?',
'[{"value": "15", "label": "15"}, {"value": "30", "label": "30"}, {"value": "50", "label": "50"}, {"value": "100", "label": "100"}]'::jsonb,
'50', 'Area = length × width = 10 × 5 = 50', ARRAY['math', 'geometry', 'area']),

('logical_learner', 8, 'multiple_choice', 'What is the next prime number after 7?',
'[{"value": "8", "label": "8"}, {"value": "9", "label": "9"}, {"value": "10", "label": "10"}, {"value": "11", "label": "11"}]'::jsonb,
'11', 'Prime numbers after 7 are: 11, 13, 17...', ARRAY['math', 'prime_numbers']),

('fast_processor', 9, 'multiple_choice', 'What is 144 ÷ 12?',
'[{"value": "10", "label": "10"}, {"value": "11", "label": "11"}, {"value": "12", "label": "12"}, {"value": "13", "label": "13"}]'::jsonb,
'12', 'Division: 144 ÷ 12 = 12', ARRAY['math', 'division']);

-- Reading Comprehension Questions

INSERT INTO assessment_questions (category, difficulty_level, question_type, base_question, options, correct_answer, explanation, tags) VALUES
('visual_learner', 4, 'multiple_choice', 'In the sentence "The quick brown fox jumps over the lazy dog," what is the fox doing?',
'[{"value": "running", "label": "Running"}, {"value": "jumping", "label": "Jumping"}, {"value": "sleeping", "label": "Sleeping"}, {"value": "eating", "label": "Eating"}]'::jsonb,
'jumping', 'The sentence states the fox "jumps" over the dog', ARRAY['reading', 'comprehension']),

('logical_learner', 6, 'multiple_choice', 'If today is Monday, what day will it be in 3 days?',
'[{"value": "Tuesday", "label": "Tuesday"}, {"value": "Wednesday", "label": "Wednesday"}, {"value": "Thursday", "label": "Thursday"}, {"value": "Friday", "label": "Friday"}]'::jsonb,
'Thursday', 'Monday + 3 days = Thursday', ARRAY['logic', 'time', 'calendar']),

('sensitive_low_confidence', 3, 'multiple_choice', 'Which word means the opposite of "happy"?',
'[{"value": "joyful", "label": "Joyful"}, {"value": "sad", "label": "Sad"}, {"value": "excited", "label": "Excited"}, {"value": "cheerful", "label": "Cheerful"}]'::jsonb,
'sad', 'Sad is the opposite of happy', ARRAY['vocabulary', 'antonyms']);

-- Science Questions

INSERT INTO assessment_questions (category, difficulty_level, question_type, base_question, options, correct_answer, explanation, tags) VALUES
('visual_learner', 5, 'multiple_choice', 'What do plants need to grow?',
'[{"value": "only_water", "label": "Only water"}, {"value": "only_sunlight", "label": "Only sunlight"}, {"value": "water_sunlight_soil", "label": "Water, sunlight, and soil"}, {"value": "nothing", "label": "Nothing"}]'::jsonb,
'water_sunlight_soil', 'Plants need water, sunlight, and soil to grow', ARRAY['science', 'biology', 'plants']),

('logical_learner', 7, 'multiple_choice', 'How many planets are in our solar system?',
'[{"value": "7", "label": "7"}, {"value": "8", "label": "8"}, {"value": "9", "label": "9"}, {"value": "10", "label": "10"}]'::jsonb,
'8', 'There are 8 planets in our solar system', ARRAY['science', 'astronomy']),

('fast_processor', 7, 'multiple_choice', 'What is the process by which plants make their own food?',
'[{"value": "respiration", "label": "Respiration"}, {"value": "photosynthesis", "label": "Photosynthesis"}, {"value": "digestion", "label": "Digestion"}, {"value": "evaporation", "label": "Evaporation"}]'::jsonb,
'photosynthesis', 'Photosynthesis is the process plants use to make food', ARRAY['science', 'biology']);

-- Additional Pattern and Logic Questions

INSERT INTO assessment_questions (category, difficulty_level, question_type, base_question, options, correct_answer, explanation, tags) VALUES
('easily_distracted', 4, 'multiple_choice', 'What number comes next: 5, 10, 15, 20, ?',
'[{"value": "22", "label": "22"}, {"value": "23", "label": "23"}, {"value": "24", "label": "24"}, {"value": "25", "label": "25"}]'::jsonb,
'25', 'The pattern increases by 5 each time', ARRAY['patterns', 'sequences']),

('high_energy', 6, 'multiple_choice', 'If you have 3 groups of 4 apples, how many apples do you have in total?',
'[{"value": "7", "label": "7"}, {"value": "10", "label": "10"}, {"value": "12", "label": "12"}, {"value": "15", "label": "15"}]'::jsonb,
'12', 'Multiplication: 3 × 4 = 12', ARRAY['math', 'multiplication', 'word_problem']),

('needs_repetition', 4, 'multiple_choice', 'What is the first letter of the alphabet?',
'[{"value": "A", "label": "A"}, {"value": "B", "label": "B"}, {"value": "C", "label": "C"}, {"value": "D", "label": "D"}]'::jsonb,
'A', 'The alphabet starts with the letter A', ARRAY['reading', 'alphabet']);

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Count questions by difficulty level
SELECT difficulty_level, COUNT(*) as question_count
FROM assessment_questions
WHERE is_active = true
GROUP BY difficulty_level
ORDER BY difficulty_level;

-- Count questions by category
SELECT category, COUNT(*) as question_count
FROM assessment_questions
WHERE is_active = true
GROUP BY category
ORDER BY category;

COMMENT ON TABLE assessment_questions IS 'Updated with 20 sample assessment questions across all difficulty levels';
