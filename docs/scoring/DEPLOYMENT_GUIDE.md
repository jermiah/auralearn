# Combined Scoring System - Deployment Guide

## 🎯 Overview

This guide walks you through deploying the **Combined Scoring System** that integrates both cognitive and academic assessments to create accurate student learning profiles with multi-bucket assignment.

---

## 📋 Pre-Deployment Checklist

Before you begin, ensure you have:

- [ ] Access to Supabase Dashboard
- [ ] Supabase project credentials in `.env` file
- [ ] Python virtual environment activated
- [ ] Backend dependencies installed (`pip install -r requirements.txt`)
- [ ] All SQL migration files ready

---

## 🚀 Deployment Steps

### Step 1: Apply SQL Migrations

You need to apply **TWO** SQL migrations in order:

#### 1.1 Apply Visual/Logical Learner Fix (Optional but Recommended)

**File:** [supabase-cognitive-to-category-mapping.sql](supabase-cognitive-to-category-mapping.sql)

**What it does:**
- Updates cognitive-to-category mapping with visual vs logical differentiation
- Uses processing_speed as secondary indicator

**How to apply:**

1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **SQL Editor**
3. Open file `supabase-cognitive-to-category-mapping.sql`
4. Copy **ENTIRE contents** (all 287 lines)
5. Paste into Supabase SQL Editor
6. Click **"Run"**
7. Verify: `Success. No rows returned`

#### 1.2 Apply Combined Scoring System (REQUIRED)

**File:** [supabase-combined-scoring-system.sql](supabase-combined-scoring-system.sql)

**What it does:**
- Creates `calculate_combined_category_scores()` function
- Creates `get_student_buckets()` function for multi-bucket assignment
- Creates `student_category_buckets` view
- Sets up triggers on BOTH assessment tables
- Enables automatic score updates

**How to apply:**

1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **SQL Editor**
3. Open file `supabase-combined-scoring-system.sql`
4. Copy **ENTIRE contents** (all 600+ lines)
5. Paste into Supabase SQL Editor
6. Click **"Run"**
7. Verify: `Success. No rows returned`

**IMPORTANT:** If you see any errors about missing columns or types, it means your schema may need updates. Contact support.

---

### Step 2: Populate Category Scores

After applying SQL migrations, calculate category scores for all students:

#### 2.1 Activate Virtual Environment

```bash
cd E:\learnaura\aura-learn
.\venv\Scripts\Activate.ps1
```

#### 2.2 Navigate to Backend

```bash
cd backend
```

#### 2.3 Run Population Script

```bash
# Calculate scores for all students
python populate_category_scores.py

# Or force recalculation (overwrite existing)
python populate_category_scores.py --force

# Or process specific student only
python populate_category_scores.py --student-id <uuid>
```

**Expected Output:**

```
======================================================================
COMBINED CATEGORY SCORE POPULATION
======================================================================
Using COMBINED approach: Cognitive (60%) + Academic (40%)

Processing student: Emma Thompson
  [COGNITIVE] Found assessment from 2025-01-15 10:30:00
  [ACADEMIC] Score: 85.0%, Time: 450s
  [COMBINED] Calculated category scores
  [BUCKETS] Student belongs to 3 bucket(s): visual_learner, logical_learner, fast_processor
  ✅ Updated category_scores successfully

Processing student: Liam Johnson
  [COGNITIVE] Found assessment from 2025-01-14 14:20:00
  [ACADEMIC] Not found
  [COGNITIVE-ONLY] Using cognitive assessment only
  [BUCKETS] Student belongs to 2 bucket(s): slow_processing, needs_repetition
  ✅ Updated category_scores successfully

...

======================================================================
SUMMARY - COMBINED SCORING SYSTEM
======================================================================
Total students: 62
Updated: 62
Skipped (already had scores): 0
No assessments: 15

[SUCCESS] Combined category score population complete!

NOTE: Students can belong to MULTIPLE buckets if they score >= 60 in multiple categories
      Category scores combine cognitive (60%) + academic (40%) assessments
```

---

### Step 3: Validate Deployment

Run the validation script to ensure everything is working:

```bash
python validate_combined_scoring.py
```

**Expected Output:**

```
======================================================================
COMBINED SCORING SYSTEM VALIDATION
======================================================================

======================================================================
TEST 1: SQL FUNCTIONS AVAILABILITY
======================================================================
✅ calculate_combined_category_scores() - AVAILABLE
✅ get_student_buckets() - AVAILABLE
✅ student_category_buckets view - AVAILABLE

Tests Passed: 3/3

======================================================================
TEST 2: COMBINED SCORING CALCULATION
======================================================================

Students with BOTH assessments: 15
  Example: Emma Thompson
  Cognitive domains: {...}
  Academic score: 8/10
  Combined category scores:
    - slow_processing: 35
    - fast_processor: 82
    - visual_learner: 87
    - logical_learner: 75
    ...

Students with COGNITIVE ONLY: 32
Students with ACADEMIC ONLY: 0
Students with NEITHER assessment: 15

======================================================================
TEST 3: MULTI-BUCKET ASSIGNMENT
======================================================================

  Emma Thompson:
    Assigned to 3 buckets: ['visual_learner', 'fast_processor', 'logical_learner']
    Scores:
      - visual_learner: 87
      - fast_processor: 82
      - logical_learner: 75

Bucket Distribution:
  0 bucket(s): 15 students
  1 bucket(s): 20 students
  2 bucket(s): 18 students
  3 bucket(s): 9 students

✅ Multi-bucket assignment is working (27 students in multiple buckets)

======================================================================
TEST 4: SCORE DISTRIBUTION ANALYSIS
======================================================================

Category Score Statistics:
Category                       Min    Max    Avg    Median
----------------------------------------------------------------------
slow_processing                22     85     52.3   50
fast_processor                 18     92     51.8   50
visual_learner                 28     95     54.1   52
logical_learner                24     93     53.6   51
...

======================================================================
VALIDATION SUMMARY
======================================================================
✅ All validation tests PASSED!

The combined scoring system is working correctly:
  ✓ SQL functions are available
  ✓ Combined scoring calculations work
  ✓ Multi-bucket assignment functions
  ✓ Score distributions are valid
```

---

### Step 4: Verify in Frontend

#### 4.1 Check Teaching Guide Page

1. Navigate to Teaching Guide page in the app
2. You should see students grouped by categories
3. Students may appear in **multiple category groups** (this is correct!)
4. Example: Emma may appear in both "Visual Learners" and "Fast Processors"

#### 4.2 Check Radar Charts

1. View student profile pages
2. Radar charts should display combined category scores (0-100 scale)
3. Verify scores look realistic (not all 50)

#### 4.3 Test with New Assessments

1. Have a student complete a cognitive assessment
2. Verify their category_scores auto-update
3. Check they appear in correct category buckets
4. Have them complete an academic assessment
5. Verify scores recalculate with combined approach

---

## 🔍 Troubleshooting

### Issue: SQL Migration Fails

**Error:** `relation "student_assessments" does not exist`

**Solution:**
- Your database schema may be outdated
- Check that `student_assessments` table exists
- Apply any missing schema migrations first

---

### Issue: All Scores Are 50

**Symptom:** All students have category_scores of 50 for all categories

**Diagnosis:** No students have completed assessments yet

**Solution:**
- This is expected behavior for students without assessments
- Have students complete cognitive and/or academic assessments
- Scores will auto-update via triggers

---

### Issue: No Multi-Bucket Assignments

**Symptom:** All students assigned to only 0-1 buckets

**Diagnosis:**
- Students have balanced profiles (all scores between 40-59)
- Threshold of 60 may be too high

**Solution:**
- This may be normal if students haven't completed assessments
- Try adjusting threshold: `SELECT get_student_buckets('student-uuid', 50);`
- Wait for more assessment data to accumulate

---

### Issue: Students Not in ANY Buckets

**Symptom:** `assigned_buckets` is empty for all students

**Diagnosis:** All category scores below threshold (60)

**Solution:**
- Check raw category_scores in `students` table
- Verify assessment data exists
- Re-run populate script with `--force` flag
- Check for errors in SQL function execution

---

## 📊 Querying the System

### Get Student's Buckets

```sql
-- Via function
SELECT get_student_buckets('student-uuid-here', 60);

-- Via view
SELECT * FROM student_category_buckets
WHERE student_id = 'student-uuid-here';
```

### Find All Students in a Specific Bucket

```sql
SELECT student_name, assigned_buckets, category_scores
FROM student_category_buckets
WHERE 'visual_learner' = ANY(assigned_buckets);
```

### Count Students Per Bucket

```sql
SELECT
  unnest(assigned_buckets) as bucket,
  COUNT(*) as student_count
FROM student_category_buckets
GROUP BY bucket
ORDER BY student_count DESC;
```

### Get Students with Multiple Buckets

```sql
SELECT student_name, assigned_buckets, array_length(assigned_buckets, 1) as num_buckets
FROM student_category_buckets
WHERE array_length(assigned_buckets, 1) > 1
ORDER BY num_buckets DESC;
```

### Manually Trigger Score Recalculation

```sql
-- For specific student
SELECT calculate_combined_category_scores('student-uuid-here');

-- For all students (batch)
SELECT * FROM recalculate_all_category_scores();
```

---

## 📈 Monitoring

### Daily Checks

1. **Check bucket distribution**
   ```sql
   SELECT
     array_length(assigned_buckets, 1) as num_buckets,
     COUNT(*) as student_count
   FROM student_category_buckets
   GROUP BY num_buckets
   ORDER BY num_buckets;
   ```

2. **Check assessment completion rates**
   ```sql
   -- Students with cognitive assessments
   SELECT COUNT(DISTINCT student_id) FROM cognitive_assessment_results;

   -- Students with academic assessments
   SELECT COUNT(DISTINCT student_id) FROM student_assessments;
   ```

3. **Check trigger execution**
   ```sql
   -- Verify updated_at is recent for students who completed assessments
   SELECT name, category_scores, updated_at
   FROM students
   WHERE category_scores IS NOT NULL
   ORDER BY updated_at DESC
   LIMIT 10;
   ```

### Weekly Analysis

1. Run validation script: `python validate_combined_scoring.py`
2. Review score distributions
3. Check for data quality issues
4. Verify multi-bucket assignments are working

---

## 🎓 Understanding the System

### How Combined Scoring Works

For each of the 8 categories:

1. **Calculate Cognitive Score** (if cognitive assessment exists)
   - Based on domain scores (1-5 Likert scale)
   - Converted to 0-100 scale
   - Weight: 60%

2. **Calculate Academic Score** (if academic assessment exists)
   - Based on test performance and time taken
   - Converted to 0-100 scale
   - Weight: 40%

3. **Combine Scores**
   - If BOTH exist: `final = cognitive * 0.6 + academic * 0.4`
   - If only cognitive: `final = cognitive * 1.0`
   - If only academic: `final = academic * 1.0`
   - If neither: `final = 50` (balanced profile)

4. **Assign to Buckets**
   - Student assigned to ALL categories where `final >= 60`
   - Students can be in 0-8 buckets

### Example Calculation

**Student:** Emma Thompson

**Cognitive Assessment:**
- processing_speed: 4.5 (HIGH)
- working_memory: 4.2 (HIGH)
- learning_style: 4.6 (HIGH)
- → Cognitive score for "fast_processor": 85
- → Cognitive score for "logical_learner": 90

**Academic Assessment:**
- Score: 9/10 (90%)
- Time: 240 seconds (fast)
- → Academic score for "fast_processor": 90
- → Academic score for "logical_learner": 90

**Combined Scores:**
- fast_processor: 85 * 0.6 + 90 * 0.4 = **87**
- logical_learner: 90 * 0.6 + 90 * 0.4 = **90**

**Bucket Assignment:**
- fast_processor: 87 >= 60 ✅ **ASSIGNED**
- logical_learner: 90 >= 60 ✅ **ASSIGNED**
- visual_learner: 42 < 60 ❌ Not assigned

**Result:** Emma assigned to 2 buckets: ["fast_processor", "logical_learner"]

---

## ✅ Post-Deployment Checklist

- [ ] SQL migrations applied successfully
- [ ] Population script executed without errors
- [ ] Validation script shows all tests passing
- [ ] Students appear in correct category buckets on Teaching Guide page
- [ ] Radar charts display combined scores
- [ ] Multi-bucket assignment is working (some students in 2+ buckets)
- [ ] Triggers are working (new assessments auto-update scores)
- [ ] Frontend displays accurate student profiles

---

## 📝 Files Reference

### Created Files
1. **[supabase-combined-scoring-system.sql](supabase-combined-scoring-system.sql)** - Main SQL migration
2. **[backend/populate_category_scores.py](backend/populate_category_scores.py)** - Population script
3. **[backend/validate_combined_scoring.py](backend/validate_combined_scoring.py)** - Validation script
4. **[COMBINED_SCORING_SYSTEM.md](COMBINED_SCORING_SYSTEM.md)** - System documentation
5. **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - This file

### Modified Files
1. **[supabase-cognitive-to-category-mapping.sql](supabase-cognitive-to-category-mapping.sql)** - Visual/logical fix
2. **[CATEGORY_MAPPING_COMPLETE_GUIDE.md](CATEGORY_MAPPING_COMPLETE_GUIDE.md)** - Updated guide

---

## 🎉 Success!

If all steps completed successfully, your combined scoring system is now live!

**Key Features:**
- ✅ Combines cognitive (60%) + academic (40%) assessments
- ✅ Multi-bucket assignment (students in multiple categories)
- ✅ Automatic updates via triggers
- ✅ Deterministic, assessment-based scoring
- ✅ Comprehensive SQL functions and views

**Next Steps:**
1. Monitor bucket distributions
2. Collect more assessment data
3. Fine-tune thresholds if needed (currently 60)
4. Analyze teaching effectiveness per bucket
5. Iterate on category detection patterns

---

## 🆘 Support

If you encounter issues:

1. Check [COMBINED_SCORING_SYSTEM.md](COMBINED_SCORING_SYSTEM.md) for detailed algorithm explanations
2. Run validation script: `python validate_combined_scoring.py`
3. Check Supabase logs for SQL errors
4. Review troubleshooting section above
5. Contact development team with error logs

---

**The combined scoring system is ready for production!** 🚀
