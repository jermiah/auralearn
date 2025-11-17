# Quick Start: Cognitive-Based Category Scores

## 🚀 3-Step Implementation

### Step 1: Run SQL Migration (Supabase)

1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `supabase-cognitive-to-category-mapping.sql`
3. Click "Run"
4. Verify success: "Success. No rows returned"

**What this does:**
- Creates SQL function to calculate scores from cognitive assessments
- Creates trigger to auto-update on new assessments
- Creates batch recalculation function

---

### Step 2: Run Python Population Script

```bash
# Navigate to project
cd aura-learn

# Activate virtual environment (if using)
source venv/bin/activate  # Mac/Linux
venv\Scripts\activate     # Windows

# Run script with force flag to recalculate all
python backend/populate_category_scores.py --force
```

**What this does:**
- Queries cognitive assessments for each student
- Calculates category scores using SQL function
- Updates students table with real scores
- Sets primary/secondary categories

---

### Step 3: Verify Results

#### Option A: Supabase Dashboard
```sql
SELECT 
  name,
  primary_category,
  category_scores
FROM students
LIMIT 10;
```

#### Option B: Teaching Guide Page
1. Navigate to Teaching Guide
2. Select a student
3. Check radar chart shows varied scores (not all 50s)

#### Option C: Student Categories Page
1. Navigate to Student Categories
2. Verify students grouped by real categories
3. Check scores are realistic

---

## 📊 Expected Output

### Console Output
```
======================================================================
CATEGORY SCORE POPULATION FROM COGNITIVE ASSESSMENTS
======================================================================

Found 62 students
Force recalculate: True

[1/62] Marie Dupont
  [INFO] Found cognitive assessment from 2025-01-15
  [INFO] Domain scores: {"processing_speed": 2.3, ...}
  [OK] Updated category scores
  [OK] Primary: sensitive_low_confidence → sensitive_low_confidence
  [OK] Scores: {"slow_processing": 76, "visual_learner": 87, ...}

...

======================================================================
SUMMARY
======================================================================
Total students: 62
Updated: 62
Skipped: 0
No cognitive assessment: 15

[SUCCESS] Category score population complete!
```

### Database Result
```json
{
  "name": "Marie Dupont",
  "primary_category": "sensitive_low_confidence",
  "secondary_category": "visual_learner",
  "category_scores": {
    "slow_processing": 76,
    "fast_processor": 32,
    "high_energy": 45,
    "visual_learner": 87,
    "logical_learner": 42,
    "sensitive_low_confidence": 82,
    "easily_distracted": 38,
    "needs_repetition": 65
  }
}
```

---

## 🔧 Command Options

### Basic Usage
```bash
# Populate only students without scores
python backend/populate_category_scores.py
```

### Force Recalculate All
```bash
# Recalculate even if scores exist
python backend/populate_category_scores.py --force
```

### Single Student
```bash
# Update specific student
python backend/populate_category_scores.py --student-id <uuid>
```

### Single Student + Force
```bash
# Force recalculate specific student
python backend/populate_category_scores.py --student-id <uuid> --force
```

---

## ✅ Success Checklist

- [ ] SQL migration ran successfully
- [ ] Python script completed without errors
- [ ] All students have category_scores (not null)
- [ ] Scores are varied (not all 50s for students with assessments)
- [ ] Primary/secondary categories are set
- [ ] Teaching Guide radar charts show correct data
- [ ] Student Categories page groups correctly

---

## 🐛 Quick Troubleshooting

### "Function does not exist"
→ Run SQL migration in Supabase

### "All scores are 50"
→ Students need to complete cognitive assessments

### "Script fails with connection error"
→ Check `.env` file has correct Supabase credentials

### "Trigger not working"
→ Verify trigger exists in Supabase (see full guide)

---

## 📚 Full Documentation

For detailed information, see:
- **COGNITIVE_TO_CATEGORY_IMPLEMENTATION.md** - Complete implementation guide
- **ASSESSMENT_AND_CATEGORIZATION_ANALYSIS.md** - Assessment methodology
- **SCORING_TO_CLASSIFICATION_SYSTEM.md** - Scoring system details

---

## 🎯 What Changed

### Before
```python
# Random scores based on templates
category_scores = {
    'slow_processing': random.randint(70, 90),  # ❌
    'visual_learner': random.randint(40, 60),   # ❌
}
```

### After
```sql
-- Real scores from cognitive assessments
SELECT calculate_category_scores_from_cognitive(student_id);
-- Returns scores based on actual domain values ✅
```

---

## 🎓 Result

Students now have **accurate, evidence-based learning profiles** derived from their actual cognitive assessments, enabling truly personalized teaching strategies! ✨
