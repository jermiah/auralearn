# Assessment Flow Analysis - AuraLearn Application

## Executive Summary

This document provides a comprehensive analysis of the assessment system in AuraLearn, answering three critical questions:

1. **What is the criteria for assessment generation?**
2. **How is assessment data stored and evaluated?**
3. **Where does the curriculum data come from and how are questions matched to subjects?**

---

## 1. ASSESSMENT GENERATION CRITERIA

### 1.1 Question Selection Algorithm

**Location:** `src/pages/StudentAssessment.tsx` - `selectAdaptiveQuestions()` function

#### Current Implementation:

```typescript
const selectAdaptiveQuestions = (allQuestions: any[]): Question[] => {
  // Start with medium difficulty (5-6)
  const startingDifficulty = 5;
  
  // Get 10 questions starting at medium difficulty
  const selectedQuestions: Question[] = [];
  const usedIds = new Set<string>();

  // Group questions by difficulty
  const questionsByDifficulty = allQuestions.reduce((acc, q) => {
    if (!acc[q.difficulty_level]) {
      acc[q.difficulty_level] = [];
    }
    acc[q.difficulty_level].push(q);
    return acc;
  }, {} as Record<number, any[]>);

  let currentDifficulty = startingDifficulty;

  for (let i = 0; i < 10; i++) {
    const availableQuestions = questionsByDifficulty[currentDifficulty] || [];
    const unusedQuestions = availableQuestions.filter(q => !usedIds.has(q.id));

    if (unusedQuestions.length > 0) {
      const randomIndex = Math.floor(Math.random() * unusedQuestions.length);
      const selectedQuestion = unusedQuestions[randomIndex];
      selectedQuestions.push(selectedQuestion);
      usedIds.add(selectedQuestion.id);
    }
  }

  return selectedQuestions;
};
```

#### Key Criteria:

1. **Fixed Assessment Length:** Always 10 questions per assessment
2. **Starting Difficulty:** Medium level (5 out of 10)
3. **Random Selection:** Questions randomly selected from available pool at target difficulty
4. **No Duplicates:** Each question used only once per assessment
5. **Difficulty Grouping:** Questions organized by difficulty level (1-10 scale)

#### Current Limitations:

⚠️ **Not Truly Adaptive:** The current implementation does NOT adjust difficulty based on student performance during the assessment. The comment "We'll implement true adaptive logic in the handleNext function" indicates this is a placeholder.

**True Adaptive Logic (Not Yet Implemented):**
- Should increase difficulty after correct answers
- Should decrease difficulty after incorrect answers
- Should track performance patterns in real-time

---

### 1.2 Question Difficulty Levels

**Database Schema:** `assessment_questions` table

```sql
difficulty_level INTEGER NOT NULL CHECK (difficulty_level BETWEEN 1 AND 10)
```

#### Difficulty Distribution (from seed data):

| Difficulty Range | Classification | Example Questions |
|-----------------|----------------|-------------------|
| 1-3 | **Easy** | Basic addition (2+2), Shape identification, Rhyming |
| 4-6 | **Medium** | Word problems, Patterns, Multiplication (7×8) |
| 7-10 | **Hard** | Area calculations, Prime numbers, Division (144÷12) |

---

### 1.3 Question Types Supported

**Database Schema:** `question_type` field

```sql
question_type TEXT NOT NULL CHECK (question_type IN (
  'multiple_choice', 
  'true_false', 
  'short_answer', 
  'math'
))
```

**Current Implementation:** Only `multiple_choice` questions are used in the seed data.

---

### 1.4 Assessment Configuration

**Database Table:** `scoring_config`

```sql
CREATE TABLE scoring_config (
  config_name TEXT UNIQUE NOT NULL,
  category_thresholds JSONB NOT NULL,
  total_questions INTEGER DEFAULT 10,
  time_limit_minutes INTEGER,
  adaptive_difficulty BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT false
);
```

**Default Configuration:**
```json
{
  "config_name": "Default Configuration",
  "total_questions": 10,
  "adaptive_difficulty": true,
  "is_active": true
}
```

⚠️ **Note:** While `adaptive_difficulty` is set to `true` in the database, the frontend implementation does not yet use this flag or implement true adaptive behavior.

---

## 2. ASSESSMENT DATA STORAGE AND EVALUATION

### 2.1 Data Storage Schema

**Primary Table:** `student_assessments`

```sql
CREATE TABLE student_assessments (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES students(id),
  assessment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Assessment Content
  questions_data JSONB NOT NULL,        -- Full questions asked
  answers JSONB NOT NULL,               -- Student's answers with metadata
  
  -- Scoring
  score INTEGER NOT NULL,               -- Number correct
  total_questions INTEGER NOT NULL,     -- Total questions (always 10)
  
  -- Analysis Results
  category_determined TEXT,             -- Learning category assigned
  confidence_score DECIMAL(3,2),        -- 0.00 to 1.00
  
  -- Timing Data
  time_taken INTEGER,                   -- Total seconds
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Reassessment Tracking
  needs_reassessment BOOLEAN DEFAULT false,
  next_assessment_date DATE,
  previous_assessment_id UUID REFERENCES student_assessments(id)
);
```

---

### 2.2 Answer Data Structure

**Stored in `answers` JSONB field:**

```typescript
interface Answer {
  question_id: string;
  selected_answer: string;
  is_correct: boolean;
  time_taken: number;  // seconds per question
}
```

**Example:**
```json
[
  {
    "question_id": "uuid-123",
    "selected_answer": "4",
    "is_correct": true,
    "time_taken": 15
  },
  {
    "question_id": "uuid-456",
    "selected_answer": "triangle",
    "is_correct": true,
    "time_taken": 8
  }
]
```

---

### 2.3 Evaluation Algorithm

**Location:** `src/pages/StudentAssessment.tsx` - `calculateCategoryAndScore()` function

#### Step 1: Calculate Basic Score

```typescript
const correctCount = answers.filter(a => a.is_correct).length;
const scorePercentage = (correctCount / answers.length) * 100;
```

#### Step 2: Determine Learning Category

**Category Assignment Logic:**

| Score Range | Category | Confidence Base |
|-------------|----------|-----------------|
| ≥ 80% | `fast_processor` | 0.85 |
| 70-79% | `logical_learner` | 0.75 |
| 50-69% | `visual_learner` | 0.65 |
| 40-49% | `high_energy` | 0.60 |
| 30-39% | `needs_repetition` | 0.70 |
| < 30% | `slow_processing` | 0.75 |

**Code Implementation:**
```typescript
let category = "average_learner";
let confidence = 0.5;

if (scorePercentage >= 80) {
  category = "fast_processor";
  confidence = 0.85;
} else if (scorePercentage >= 70) {
  category = "logical_learner";
  confidence = 0.75;
} else if (scorePercentage >= 50) {
  category = "visual_learner";
  confidence = 0.65;
} else if (scorePercentage >= 40) {
  category = "high_energy";
  confidence = 0.60;
} else if (scorePercentage >= 30) {
  category = "needs_repetition";
  confidence = 0.70;
} else {
  category = "slow_processing";
  confidence = 0.75;
}
```

#### Step 3: Adjust Confidence Based on Timing

```typescript
const avgTimeTaken = answers.reduce((sum, a) => sum + a.time_taken, 0) / answers.length;

if (avgTimeTaken < 10) {
  confidence -= 0.1; // Too fast might indicate guessing
} else if (avgTimeTaken > 60) {
  confidence -= 0.05; // Very slow might indicate uncertainty
}

// Ensure confidence stays within bounds
confidence = Math.max(0.5, Math.min(1.0, confidence));
```

**Confidence Adjustment Rationale:**
- **< 10 seconds/question:** Likely rushing or guessing → Lower confidence
- **> 60 seconds/question:** Uncertainty or struggling → Slightly lower confidence
- **10-60 seconds/question:** Optimal range → No adjustment

---

### 2.4 Data Persistence Flow

**Location:** `src/pages/StudentAssessment.tsx` - `submitAssessment()` function

```typescript
const submitAssessment = async (finalAnswers: Answer[]) => {
  // 1. Calculate metrics
  const totalTimeTaken = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
  const correctCount = finalAnswers.filter(a => a.is_correct).length;
  const { category, confidence } = calculateCategoryAndScore(finalAnswers);

  // 2. Save to database
  const { data: assessmentData } = await supabase
    .from("student_assessments")
    .insert({
      student_id: studentId,
      questions_data: questions,           // Full question objects
      answers: finalAnswers,               // Answer array with metadata
      score: correctCount,
      total_questions: questions.length,
      category_determined: category,
      confidence_score: confidence,
      time_taken: totalTimeTaken,
      started_at: startTime.toISOString(),
      completed_at: new Date().toISOString(),
      needs_reassessment: false,
      next_assessment_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0]  // 30 days from now
    });

  // 3. Update student's primary category
  await supabase
    .from("students")
    .update({ primary_category: category })
    .eq("id", studentId);
};
```

---

### 2.5 Automatic Reassessment Tracking

**Database Trigger:** Automatically creates reminder after assessment

```sql
CREATE OR REPLACE FUNCTION create_reassessment_reminder()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO reassessment_reminders (student_id, teacher_id, due_date)
  SELECT
    NEW.student_id,
    c.user_id,
    NEW.assessment_date::date + INTERVAL '30 days'
  FROM students s
  JOIN classes c ON s.class_id = c.id
  WHERE s.id = NEW.student_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_reassessment_reminder
AFTER INSERT ON student_assessments
FOR EACH ROW
EXECUTE FUNCTION create_reassessment_reminder();
```

**What This Does:**
1. Automatically fires when new assessment is inserted
2. Calculates due date (30 days from assessment)
3. Links to teacher via class relationship
4. Creates reminder record for dashboard display

---

### 2.6 Performance Level Calculation

**Location:** `src/pages/Dashboard.tsx` - `getPerformanceLevel()` function

Used for teacher dashboard visualization:

```typescript
const getPerformanceLevel = (score: number | null, totalQuestions: number = 10): number => {
  if (!score) return 0;
  const percentage = (score / totalQuestions) * 100;
  
  if (percentage >= 80) return 5; // Advanced
  if (percentage >= 60) return 4; // On track
  if (percentage >= 40) return 3; // Needs attention
  if (percentage >= 20) return 2; // Struggling
  return 1; // Needs immediate help
};
```

**Level Mapping:**

| Level | Percentage | Status | Dashboard Color |
|-------|-----------|--------|-----------------|
| 5 | 80-100% | Advanced | Green |
| 4 | 60-79% | On Track | Blue |
| 3 | 40-59% | Needs Attention | Yellow |
| 2 | 20-39% | Struggling | Orange |
| 1 | 0-19% | Needs Immediate Help | Red |
| 0 | N/A | Not Assessed | Gray |

---

### 2.7 Progress Tracking Function

**Database Function:** `get_student_progress()`

```sql
CREATE OR REPLACE FUNCTION get_student_progress(p_student_id UUID)
RETURNS TABLE (
  total_assessments INTEGER,
  latest_score INTEGER,
  latest_category TEXT,
  improvement_percentage DECIMAL,
  needs_reassessment BOOLEAN,
  next_assessment_date DATE
) AS $$
BEGIN
  RETURN QUERY
  WITH assessments AS (
    SELECT score, category_determined, assessment_date,
           needs_reassessment, next_assessment_date,
           ROW_NUMBER() OVER (ORDER BY assessment_date DESC) as rn
    FROM student_assessments
    WHERE student_id = p_student_id
  ),
  latest AS (SELECT * FROM assessments WHERE rn = 1),
  previous AS (SELECT * FROM assessments WHERE rn = 2)
  SELECT
    (SELECT COUNT(*)::INTEGER FROM student_assessments WHERE student_id = p_student_id),
    latest.score,
    latest.category_determined,
    CASE
      WHEN previous.score IS NOT NULL THEN
        ((latest.score - previous.score)::DECIMAL / previous.score * 100)
      ELSE 0
    END,
    latest.needs_reassessment,
    latest.next_assessment_date
  FROM latest
  LEFT JOIN previous ON true;
END;
$$ LANGUAGE plpgsql;
```

**What This Provides:**
- Total number of assessments taken
- Latest score and category
- Improvement percentage (comparing last two assessments)
- Reassessment status
- Next assessment due date

---

## 3. CURRICULUM DATA SOURCE AND SUBJECT MATCHING

### 3.1 Question Bank Source

**Current Implementation:** Manual seed data in `supabase-seed-assessment-questions.sql`

#### Question Categories in Database:

```sql
category TEXT NOT NULL  -- What learning style this question tests for
```

**Available Categories:**
1. `slow_processing`
2. `fast_processor`
3. `high_energy`
4. `visual_learner`
5. `logical_learner`
6. `sensitive_low_confidence`
7. `easily_distracted`
8. `needs_repetition`
9. `average_learner`

⚠️ **Important:** Categories represent **learning styles**, NOT academic subjects!

---

### 3.2 Subject Areas Covered

**From Seed Data Analysis:**

| Subject Area | Question Count | Difficulty Range | Tags |
|-------------|----------------|------------------|------|
| **Mathematics** | 10 | 2-9 | math, addition, subtraction, multiplication, division, geometry, area |
| **Reading/Language** | 4 | 2-6 | reading, rhyming, phonics, comprehension, vocabulary, antonyms |
| **Science** | 3 | 5-7 | science, biology, astronomy, plants, photosynthesis |
| **Logic/Patterns** | 3 | 4-6 | patterns, sequences, logic, time, calendar |

**Total Questions in Seed Data:** 20 questions

---

### 3.3 Question Structure

**Database Schema:**

```sql
CREATE TABLE assessment_questions (
  id UUID PRIMARY KEY,
  
  -- Classification
  category TEXT NOT NULL,                    -- Learning style category
  difficulty_level INTEGER NOT NULL,         -- 1-10 scale
  question_type TEXT NOT NULL,               -- multiple_choice, etc.
  
  -- Content
  base_question TEXT NOT NULL,               -- Main question text
  variants JSONB DEFAULT '[]',               -- AI-generated variants (future)
  options JSONB,                             -- Answer choices
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  
  -- Metadata
  tags TEXT[],                               -- Subject tags (math, reading, etc.)
  created_by UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0
);
```

**Example Question:**

```json
{
  "category": "logical_learner",
  "difficulty_level": 5,
  "question_type": "multiple_choice",
  "base_question": "If John has 5 apples and gives 2 to his friend, how many does he have left?",
  "options": [
    {"value": "2", "label": "2"},
    {"value": "3", "label": "3"},
    {"value": "4", "label": "4"},
    {"value": "5", "label": "5"}
  ],
  "correct_answer": "3",
  "explanation": "Subtraction problem: 5 - 2 = 3",
  "tags": ["math", "subtraction", "word_problem"]
}
```

---

### 3.4 Subject-to-Teacher Matching

**Current Status:** ❌ **NOT IMPLEMENTED**

The system currently does NOT match questions to the subject the teacher is teaching.

**Why:**
1. **No Subject Field:** The `classes` table doesn't store subject information
2. **No Subject Filter:** Questions are selected randomly from all available questions
3. **Learning Style Focus:** The system focuses on identifying learning styles, not testing subject knowledge

**Database Schema Gap:**

```sql
-- Current classes table (simplified)
CREATE TABLE classes (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  class_name TEXT NOT NULL,
  grade_level TEXT
  -- ❌ NO subject field
);
```

**What Would Be Needed:**

```sql
-- Proposed enhancement
ALTER TABLE classes ADD COLUMN subject TEXT;

-- Proposed question filtering
SELECT * FROM assessment_questions
WHERE tags @> ARRAY['math']  -- Filter by subject tag
AND difficulty_level = 5
AND is_active = true;
```

---

### 3.5 Question Selection Logic (Current)

**Location:** `src/pages/StudentAssessment.tsx` - `loadStudentAndQuestions()`

```typescript
const loadStudentAndQuestions = async () => {
  // Load ALL active questions (no subject filtering)
  const { data: questionsData } = await supabase
    .from("assessment_questions")
    .select("*")
    .eq("is_active", true)
    .order("difficulty_level");

  // Select 10 questions with adaptive difficulty
  const selectedQuestions = selectAdaptiveQuestions(questionsData || []);
  setQuestions(selectedQuestions);
};
```

**Key Points:**
- ✅ Loads all active questions
- ✅ Orders by difficulty
- ❌ Does NOT filter by subject
- ❌ Does NOT consider teacher's subject
- ❌ Does NOT use class grade level

---

### 3.6 Curriculum Alignment (Future Enhancement)

**Proposed Implementation:**

```typescript
// Step 1: Get class subject and grade level
const { data: classData } = await supabase
  .from("classes")
  .select("subject, grade_level")
  .eq("id", classId)
  .single();

// Step 2: Filter questions by subject tags
const { data: questionsData } = await supabase
  .from("assessment_questions")
  .select("*")
  .contains("tags", [classData.subject])  // Filter by subject
  .eq("is_active", true)
  .order("difficulty_level");

// Step 3: Further filter by grade-appropriate difficulty
const gradeRanges = {
  "K-2": [1, 4],
  "3-5": [4, 7],
  "6-8": [6, 10]
};
const [minDiff, maxDiff] = gradeRanges[classData.grade_level] || [1, 10];
const filteredQuestions = questionsData.filter(
  q => q.difficulty_level >= minDiff && q.difficulty_level <= maxDiff
);
```

---

### 3.7 AI-Generated Question Variants (Planned)

**Database Support:** `variants JSONB DEFAULT '[]'`

**Purpose:**
- Prevent memorization
- Rotate questions between assessments
- Maintain difficulty while varying content

**Example Variant Structure:**

```json
{
  "base_question": "What is 2 + 2?",
  "variants": [
    {
      "id": "variant-1",
      "question": "What is 3 + 3?",
      "correct_answer": "6",
      "difficulty_level": 2
    },
    {
      "id": "variant-2",
      "question": "What is 4 + 4?",
      "correct_answer": "8",
      "difficulty_level": 2
    }
  ]
}
```

**Status:** ⏳ Structure ready, AI integration pending

---

## 4. CRITICAL GAPS AND RECOMMENDATIONS

### 4.1 Current Limitations

| Issue | Impact | Priority |
|-------|--------|----------|
| **No True Adaptive Difficulty** | Students get same difficulty throughout | HIGH |
| **No Subject Filtering** | Questions don't match teacher's subject | HIGH |
| **Limited Question Bank** | Only 20 questions total | HIGH |
| **No Grade-Level Filtering** | K-2 students might get high school questions | MEDIUM |
| **No Question Rotation** | Students could memorize answers | MEDIUM |
| **Manual Question Entry** | Scaling is difficult | LOW |

---

### 4.2 Recommended Enhancements

#### Priority 1: Implement True Adaptive Logic

```typescript
const handleNext = () => {
  // ... existing code ...
  
  // Adaptive difficulty adjustment
  if (isCorrect && currentDifficulty < 10) {
    currentDifficulty += 1; // Increase difficulty
  } else if (!isCorrect && currentDifficulty > 1) {
    currentDifficulty -= 1; // Decrease difficulty
  }
  
  // Select next question at adjusted difficulty
  const nextQuestion = selectQuestionAtDifficulty(currentDifficulty);
};
```

#### Priority 2: Add Subject Filtering

```sql
-- Add subject to classes table
ALTER TABLE classes ADD COLUMN subject TEXT;

-- Update question selection query
SELECT * FROM assessment_questions
WHERE tags @> ARRAY[?]  -- Teacher's subject
AND difficulty_level BETWEEN ? AND ?  -- Grade-appropriate range
AND is_active = true;
```

#### Priority 3: Expand Question Bank

**Target:** 100+ questions per subject area
- Math: 100 questions (10 per difficulty level)
- Reading: 100 questions
- Science: 100 questions
- Social Studies: 50 questions

#### Priority 4: Implement Question Variants

```typescript
// Use AI to generate variants
const generateVariant = async (baseQuestion: Question) => {
  const response = await openai.createCompletion({
    prompt: `Generate a similar question with same difficulty:
             Original: ${baseQuestion.base_question}
             Difficulty: ${baseQuestion.difficulty_level}
             Subject: ${baseQuestion.tags.join(', ')}`,
    // ... AI parameters
  });
  return parseVariant(response);
};
```

---

## 5. DATA FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│                    ASSESSMENT FLOW                          │
└─────────────────────────────────────────────────────────────┘

1. TEACHER SETUP
   ┌──────────────┐
   │   Teacher    │
   │  Creates     │──────► classes table
   │   Class      │        (user_id, class_name, grade_level)
   └──────────────┘

2. STUDENT SELECTION
   ┌──────────────┐
   │   Student    │
   │  Selects     │──────► /student-selection/:classId
   │   Name       │        (No authentication required)
   └──────────────┘

3. QUESTION LOADING
   ┌──────────────────────────────────────────────┐
   │  Load Questions from assessment_questions    │
   │  - Filter: is_active = true                  │
   │  - Order: difficulty_level                   │
   │  - Select: 10 questions (starting at level 5)│
   └──────────────────────────────────────────────┘
                    │
                    ▼
4. ASSESSMENT EXECUTION
   ┌──────────────────────────────────────────────┐
   │  For each question:                          │
   │  1. Display question and options             │
   │  2. Record answer and time                   │
   │  3. Move to next question                    │
   └──────────────────────────────────────────────┘
                    │
                    ▼
5. SCORING & ANALYSIS
   ┌──────────────────────────────────────────────┐
   │  Calculate:                                  │
   │  - Correct count                             │
   │  - Score percentage                          │
   │  - Learning category (based on %)            │
   │  - Confidence score (adjusted by timing)     │
   │  - Total time taken                          │
   └──────────────────────────────────────────────┘
                    │
                    ▼
6. DATA PERSISTENCE
   ┌──────────────────────────────────────────────┐
   │  Insert into student_assessments:            │
   │  - questions_data (JSONB)                    │
   │  - answers (JSONB with metadata)             │
   │  - score, category, confidence               │
   │  - timing data                               │
   │  - next_assessment_date (+30 days)           │
   └──────────────────────────────────────────────┘
                    │
                    ▼
7. AUTOMATIC TRIGGERS
   ┌──────────────────────────────────────────────┐
   │  Database trigger creates:                   │
   │  - reassessment_reminders entry              │
   │  - Links to teacher via class                │
   │  - Sets due_date = assessment_date + 30 days │
   └──────────────────────────────────────────────┘
                    │
                    ▼
8. STUDENT UPDATE
   ┌──────────────────────────────────────────────┐
   │  Update students table:                      │
   │  - primary_category = determined category    │
   └──────────────────────────────────────────────┘
                    │
                    ▼
9. TEACHER DASHBOARD
   ┌──────────────────────────────────────────────┐
   │  Teacher views:                              │
   │  - All students with latest scores           │
   │  - Performance levels (1-5)                  │
   │  - Improvement trends                        │
   │  - Reassessment reminders                    │
   └──────────────────────────────────────────────┘
```

---

## 6. SUMMARY OF ANSWERS

### Question 1: What is the criteria of the generation of the assessment?

**Answer:**
- **Fixed Length:** 10 questions per assessment
- **Starting Difficulty:** Medium (level 5 out of 10)
- **Selection Method:** Random selection from available questions at target difficulty
- **No Duplicates:** Each question used only once per assessment
- **Current Limitation:** NOT truly adaptive (doesn't adjust difficulty based on performance)
- **Configuration:** Controlled by `scoring_config` table (10 questions, adaptive flag)

### Question 2: How is the assessment data stored and evaluated?

**Answer:**

**Storage:**
- **Table:** `student_assessments` with JSONB fields for questions and answers
- **Includes:** Full question data, answer metadata, timing, scores, categories
- **Relationships:** Links to student, tracks previous assessments
- **Automatic:** Triggers create 30-day reassessment reminders

**Evaluation:**
- **Scoring:** Count correct answers, calculate percentage
- **Category Assignment:** Based on score percentage (9 categories)
- **Confidence Calculation:** Base confidence adjusted by answer timing
- **Performance Levels:** 5-level system for dashboard visualization
- **Progress Tracking:** Compares current vs. previous assessments

### Question 3: Where are we getting the data including the curriculum of the questions and how are we equating the questions to the subject the teacher is teaching?

**Answer:**

**Data Source:**
- **Current:** Manual seed data in SQL file (20 questions)
- **Storage:** `assessment_questions` table in Supabase
- **Subjects:** Math (10), Reading (4), Science (3), Logic (3)
- **Tags:** Questions tagged with subject areas (math, reading, science)

**Subject Matching:**
- **Current Status:** ❌ NOT IMPLEMENTED
- **Issue:** No subject field in classes table
- **Issue:** Questions selected randomly from all subjects
- **Issue:** No filtering by teacher's subject or grade level
- **Focus:** System identifies learning styles, not subject mastery

**Recommendations:**
1. Add `subject` field to `classes` table
2. Filter questions by subject tags matching teacher's subject
3. Filter by grade-appropriate difficulty ranges
4. Expand question bank to 100+ per subject
5. Implement AI-generated question variants

---

## 7. CONCLUSION

The AuraLearn assessment system is **functional but basic**. It successfully:
- ✅ Allows students to take assessments without authentication
- ✅ Stores comprehensive assessment data
- ✅ Determines learning categories based on performance
- ✅ Tracks progress over time
- ✅ Provides teacher dashboard with insights

However, it has significant gaps:
- ❌ Not truly adaptive during assessment
- ❌ No subject-to-teacher matching
- ❌ Limited question bank (only 20 questions)
- ❌ No grade-level filtering
- ❌ No question rotation/variants

**Next Steps:**
1. Implement true adaptive difficulty adjustment
2. Add subject filtering based on teacher's class
3. Expand question bank significantly
4. Add grade-level appropriate filtering
5. Integrate AI for question variant generation

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Author:** Assessment Flow Analysis  
**Related Files:**
- `src/pages/StudentAssessment.tsx`
- `src/pages/Dashboard.tsx`
- `supabase-student-assessment-schema.sql`
- `supabase-seed-assessment-questions.sql`
- `STUDENT-ASSESSMENT-IMPLEMENTATION-SUMMARY.md`
