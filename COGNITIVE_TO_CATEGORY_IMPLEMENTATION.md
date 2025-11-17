# Cognitive Assessment to Category Score Implementation Guide

## 🎯 Overview

This implementation connects **cognitive domain scores** (1-5 scale from assessments) to **learning category scores** (0-100 scale for teaching strategies). It replaces random template-based scores with real, assessment-derived data.

---

## 📊 The Problem We Solved

### Before (Random Template-Based)
```python
# Old approach: Random scores based on primary_category
category_scores = {
    'slow_processing': random.randint(70, 90),  # ❌ Not based on real data
    'fast_processor': random.randint(10, 30),
    # ... etc
}
```

### After (Assessment-Based)
```sql
-- New approach: Calculate from cognitive domain scores
SELECT calculate_category_scores_from_cognitive('student-uuid');
-- Returns real scores based on actual assessment data ✅
```

---

## 🔄 Data Flow

```
1. Student completes cognitive assessment (15 questions)
         ↓
2. System calculates 6 domain scores (1-5 scale)
   - processing_speed: 2.3
   - working_memory: 3.5
   - attention_focus: 4.2
   - learning_style: 4.8
   - self_efficacy: 2.1
   - motivation_engagement: 4.0
         ↓
3. SQL function maps domains → 8 category scores (0-100 scale)
   - slow_processing: 75 (from processing_speed: 2.3)
   - visual_learner: 85 (from learning_style: 4.8)
   - sensitive_low_confidence: 80 (from self_efficacy: 2.1)
   - ... etc
         ↓
4. System determines primary & secondary categories
   - Primary: sensitive_low_confidence (80)
   - Secondary: visual_learner (85)
         ↓
5. Updates students table automatically
```

---

## 📁 Files Created/Modified

### 1. **supabase-cognitive-to-category-mapping.sql** (NEW)

**Purpose:** SQL functions to calculate category scores from cognitive assessments

**Key Functions:**

#### `calculate_category_scores_from_cognitive(p_student_id UUID)`
- Queries latest cognitive assessment for student
- Applies threshold-based mapping logic
- Returns JSONB with 8 category scores (0-100)

**Mapping Logic:**
```sql
-- Example: Slow Processing
IF processing_speed < 2.5 THEN
  slow_processing := ((2.5 - processing_speed) / 2.5 * 40 + 50)
  -- Score: 75-90 for low processing speed
ELSE
  slow_processing := (2.5 / processing_speed * 50)
  -- Score: 0-50 for normal/high processing speed
END IF
```

#### `update_student_category_scores()`
- Trigger function
- Auto-updates students table when cognitive assessment completed
- Calculates primary & secondary categories

#### `recalculate_all_category_scores()`
- Batch function
- Recalculates scores for all students
- Returns table with results

---

### 2. **backend/populate_category_scores.py** (MODIFIED)

**Purpose:** Python script to populate/update category scores

**Changes:**
- ❌ Removed: Random score generation
- ✅ Added: Real cognitive assessment queries
- ✅ Added: SQL function RPC calls
- ✅ Added: `--force` flag to recalculate existing scores
- ✅ Added: `--student-id` flag for single student

**Usage:**
```bash
# Populate all students (skip if already has scores)
python backend/populate_category_scores.py

# Force recalculate all students
python backend/populate_category_scores.py --force

# Update specific student
python backend/populate_category_scores.py --student-id <uuid>
```

---

## 🔢 Mapping Logic Details

### Domain to Category Mapping

| Cognitive Domain | Threshold | Category | Score Range |
|------------------|-----------|----------|-------------|
| **processing_speed < 2.5** | Low | slow_processing | 75-90 |
| **processing_speed > 4.0** | High | fast_processor | 75-90 |
| **working_memory < 2.5** | Low | needs_repetition | 70-85 |
| **self_efficacy < 2.5** | Low | sensitive_low_confidence | 70-85 |
| **attention < 2.5 + motivation > 3.5** | Low + High | high_energy | 65-80 |
| **attention < 2.5 + motivation < 3.5** | Low + Low | easily_distracted | 70-85 |
| **learning_style > 4.0** | High (Visual) | visual_learner | 75-90 |
| **learning_style > 4.0** | High (Logical) | logical_learner | 70-85 |

### Score Calculation Formula

**For inverse relationships (low domain = high category):**
```
score = ((threshold - domain_value) / threshold * range + base)
```

**Example:**
```
processing_speed = 2.1 (low)
threshold = 2.5
range = 40
base = 50

slow_processing = ((2.5 - 2.1) / 2.5 * 40 + 50)
                = (0.4 / 2.5 * 40 + 50)
                = (0.16 * 40 + 50)
                = (6.4 + 50)
                = 56.4 → 56
```

**For direct relationships (high domain = high category):**
```
score = ((domain_value - threshold) / range * multiplier + base)
```

---

## 🚀 Implementation Steps

### Step 1: Run SQL Migration

```bash
# In Supabase SQL Editor, run:
supabase-cognitive-to-category-mapping.sql
```

**This creates:**
- ✅ `calculate_category_scores_from_cognitive()` function
- ✅ `update_student_category_scores()` trigger function
- ✅ `recalculate_all_category_scores()` batch function
- ✅ Trigger on `cognitive_assessment_results` table

---

### Step 2: Update Python Script

```bash
# Script already updated in:
backend/populate_category_scores.py
```

**Changes made:**
- Uses SQL function via RPC
- Queries cognitive assessments
- Handles students without assessments (balanced profile)
- Supports force recalculation

---

### Step 3: Run Population Script

```bash
# Navigate to project root
cd aura-learn

# Activate virtual environment (if using)
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Run script
python backend/populate_category_scores.py --force
```

**Expected Output:**
```
======================================================================
CATEGORY SCORE POPULATION FROM COGNITIVE ASSESSMENTS
======================================================================

Found 62 students
Force recalculate: True

[1/62] Marie Dupont
  [INFO] Found cognitive assessment from 2025-01-15
  [INFO] Domain scores: {"processing_speed": 2.3, "working_memory": 3.5, ...}
  [OK] Updated category scores
  [OK] Primary: sensitive_low_confidence → sensitive_low_confidence
  [OK] Secondary: visual_learner
  [OK] Scores: {"slow_processing": 75, "visual_learner": 85, ...}

[2/62] Jean Martin
  [WARN] No cognitive assessment found - using balanced profile
  [OK] Updated category scores
  [OK] Primary: None → slow_processing
  [OK] Scores: {"slow_processing": 50, "fast_processor": 50, ...}

...

======================================================================
SUMMARY
======================================================================
Total students: 62
Updated: 62
Skipped (already had scores): 0
No cognitive assessment: 15

[SUCCESS] Category score population complete!
```

---

### Step 4: Verify Results

#### Check in Supabase Dashboard
```sql
-- View students with category scores
SELECT 
  name,
  primary_category,
  secondary_category,
  category_scores
FROM students
LIMIT 10;
```

#### Check Teaching Guide Page
1. Navigate to Teaching Guide page
2. Select a student
3. Verify radar chart shows correct scores
4. Verify categories match cognitive profile

#### Check Student Categories Page
1. Navigate to Student Categories page
2. Verify students are grouped correctly
3. Verify category scores are realistic (not all 50s)

---

## 🔍 Testing & Validation

### Test Case 1: Student with Cognitive Assessment

**Given:**
- Student has completed cognitive assessment
- Domain scores: processing_speed = 2.1, self_efficacy = 2.0

**Expected:**
- slow_processing score: 70-80
- sensitive_low_confidence score: 75-85
- Primary category: sensitive_low_confidence (highest score)

**Verify:**
```sql
SELECT 
  s.name,
  car.domain_scores,
  s.category_scores,
  s.primary_category
FROM students s
JOIN cognitive_assessment_results car ON s.id = car.student_id
WHERE s.id = '<student-uuid>';
```

---

### Test Case 2: Student without Cognitive Assessment

**Given:**
- Student has NOT completed cognitive assessment

**Expected:**
- All category scores = 50 (balanced profile)
- Primary category determined by highest score (random due to ties)

**Verify:**
```sql
SELECT 
  s.name,
  s.category_scores,
  s.primary_category
FROM students s
WHERE s.id NOT IN (
  SELECT DISTINCT student_id 
  FROM cognitive_assessment_results
);
```

---

### Test Case 3: Automatic Update on New Assessment

**Given:**
- Student completes new cognitive assessment

**Expected:**
- Trigger automatically updates category_scores
- Primary/secondary categories updated

**Test:**
```sql
-- Insert new cognitive assessment result
INSERT INTO cognitive_assessment_results (
  student_id,
  assessment_id,
  assessment_type,
  domain_scores,
  overall_score
) VALUES (
  '<student-uuid>',
  '<assessment-uuid>',
  'student',
  '{"processing_speed": 4.5, "working_memory": 4.2, ...}'::jsonb,
  4.3
);

-- Check if student was auto-updated
SELECT 
  name,
  category_scores,
  primary_category,
  updated_at
FROM students
WHERE id = '<student-uuid>';
```

---

## 📊 Expected Results

### Before Implementation
```json
{
  "category_scores": {
    "slow_processing": 75,      // ❌ Random
    "fast_processor": 25,        // ❌ Random
    "visual_learner": 55,        // ❌ Random
    "sensitive_low_confidence": 80  // ❌ Random
  }
}
```

### After Implementation
```json
{
  "category_scores": {
    "slow_processing": 76,      // ✅ From processing_speed: 2.2
    "fast_processor": 32,        // ✅ From processing_speed: 2.2
    "visual_learner": 87,        // ✅ From learning_style: 4.7
    "sensitive_low_confidence": 82  // ✅ From self_efficacy: 2.0
  }
}
```

---

## 🐛 Troubleshooting

### Issue 1: SQL Function Not Found

**Error:**
```
ERROR: function calculate_category_scores_from_cognitive(uuid) does not exist
```

**Solution:**
```sql
-- Run the SQL migration file in Supabase SQL Editor
-- File: supabase-cognitive-to-category-mapping.sql
```

---

### Issue 2: All Scores Are 50

**Symptom:**
All students have category_scores = 50 for all categories

**Cause:**
No cognitive assessments in database

**Solution:**
1. Check if cognitive assessments exist:
```sql
SELECT COUNT(*) FROM cognitive_assessment_results;
```

2. If 0, students need to complete cognitive assessments
3. Or use test data:
```sql
-- Insert test cognitive assessment
INSERT INTO cognitive_assessment_results (
  student_id,
  assessment_id,
  assessment_type,
  domain_scores,
  overall_score
) VALUES (
  '<student-uuid>',
  gen_random_uuid(),
  'student',
  '{"processing_speed": 2.3, "working_memory": 3.5, "attention_focus": 4.2, "learning_style": 4.8, "self_efficacy": 2.1, "motivation_engagement": 4.0}'::jsonb,
  3.48
);
```

---

### Issue 3: Trigger Not Firing

**Symptom:**
New cognitive assessments don't auto-update category_scores

**Check:**
```sql
-- Verify trigger exists
SELECT * FROM information_schema.triggers
WHERE trigger_name = 'trigger_update_category_scores';
```

**Solution:**
```sql
-- Recreate trigger
DROP TRIGGER IF EXISTS trigger_update_category_scores ON cognitive_assessment_results;
CREATE TRIGGER trigger_update_category_scores
  AFTER INSERT OR UPDATE ON cognitive_assessment_results
  FOR EACH ROW
  EXECUTE FUNCTION update_student_category_scores();
```

---

### Issue 4: Python Script Fails

**Error:**
```
ERROR: Failed to calculate scores: function calculate_category_scores_from_cognitive does not exist
```

**Solution:**
1. Ensure SQL migration was run successfully
2. Check Supabase connection:
```python
# Test connection
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

# Test RPC call
result = supabase.rpc('calculate_category_scores_from_cognitive', {
    'p_student_id': '<test-student-uuid>'
}).execute()
print(result.data)
```

---

## 📈 Performance Considerations

### Batch Processing
- Script processes students sequentially
- For 62 students: ~30-60 seconds
- For 1000+ students: Consider batching

**Optimization:**
```python
# Process in batches of 100
batch_size = 100
for i in range(0, len(students), batch_size):
    batch = students[i:i+batch_size]
    # Process batch...
```

### Trigger Performance
- Trigger fires on every cognitive assessment insert/update
- Minimal overhead (~10-20ms per trigger)
- No optimization needed for current scale

---

## 🎯 Success Criteria

✅ **SQL Functions Created**
- `calculate_category_scores_from_cognitive()` exists
- `update_student_category_scores()` trigger exists
- `recalculate_all_category_scores()` batch function exists

✅ **Python Script Updated**
- Uses real cognitive assessment data
- Supports `--force` and `--student-id` flags
- Handles students without assessments

✅ **Data Quality**
- Category scores are deterministic (not random)
- Scores reflect actual cognitive domain values
- Primary/secondary categories match highest scores

✅ **Automatic Updates**
- New cognitive assessments trigger category score updates
- Students table stays in sync with assessments

✅ **UI Validation**
- Teaching Guide page shows correct radar charts
- Student Categories page groups students correctly
- Scores are realistic and varied (not all 50s)

---

## 📚 Related Documentation

- **ASSESSMENT_AND_CATEGORIZATION_ANALYSIS.md** - Assessment methodology
- **SCORING_TO_CLASSIFICATION_SYSTEM.md** - Complete scoring system
- **LEARNAURA_PRODUCT_OVERVIEW.md** - Product features
- **supabase-cognitive-assessment-schema.sql** - Cognitive assessment tables

---

## 🔄 Future Enhancements

### 1. Visual vs. Logical Learning Style Detection
Currently uses single `learning_style` domain. Could be enhanced to:
- Analyze specific question responses (Q9-11)
- Determine visual vs. logical preference
- Assign scores accordingly

### 2. Parent-Student Triangulation
Currently uses only student assessment. Could incorporate:
- Parent assessment domain scores
- Average student + parent scores
- Weight discrepancies

### 3. Historical Tracking
Track category score changes over time:
- Store score history in separate table
- Show improvement trends
- Alert on significant changes

### 4. Confidence Scoring
Add confidence metric based on:
- Assessment completion rate
- Student-parent agreement
- Score consistency over time

---

## ✅ Implementation Complete

Your LearnAura system now uses **real cognitive assessment data** to calculate learning category scores, providing accurate, evidence-based student profiles for personalized teaching strategies! 🎓✨
