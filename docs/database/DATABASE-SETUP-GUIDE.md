# LearnAura Database Setup Guide

## ⚠️ Important: Run These SQL Files in Order!

The database setup must be done in the correct sequence. Follow these steps exactly:

---

## Step 1: Run Base Schema First

### File: `supabase-schema.sql`

This creates the foundational tables:
- `users` - Teacher and parent accounts
- `classes` - Class information
- `students` - Student records
- `strategy_history` - Teaching strategy tracking

**To Run:**
1. Open Supabase Dashboard → SQL Editor
2. Paste contents of `supabase-schema.sql`
3. Click "Run"

**Expected Result:**
```
Success. No rows returned
```

---

## Step 2: Disable RLS (Development Only)

### File: `supabase-disable-rls.sql`

This temporarily disables Row Level Security for development.

**To Run:**
1. SQL Editor → New Query
2. Paste contents of `supabase-disable-rls.sql`
3. Click "Run"

**Expected Result:**
```
ALTER TABLE (for each table)
```

---

## Step 3: Run Assessment Schema

### File: `supabase-student-assessment-schema.sql`

This creates assessment-related tables:
- `student_assessments` - Assessment results
- `assessment_questions` - Question bank
- `scoring_config` - Scoring configuration
- `student_notes` - Teacher notes
- `reassessment_reminders` - 30-day tracking

**To Run:**
1. SQL Editor → New Query
2. Paste contents of `supabase-student-assessment-schema.sql`
3. Click "Run"

**Expected Result:**
```
Success. Rows returned: 1 (from scoring_config insert)
```

---

## Step 4: Seed Assessment Questions

### File: `supabase-seed-assessment-questions.sql`

This adds 20 sample assessment questions.

**To Run:**
1. SQL Editor → New Query
2. Paste contents of `supabase-seed-assessment-questions.sql`
3. Click "Run"

**Expected Result:**
```
Success. Shows question count by difficulty and category
```

---

## Step 5: Add Multiple Categories Support

### File: `supabase-multiple-categories-schema.sql`

This extends the schema for multiple learning categories:
- Adds `category_scores` and `category_profile` columns to `students`
- Creates `learning_categories` table (12 categories)
- Creates `category_detection_rules` table
- Adds automatic category calculation function
- Sets up triggers for auto-updates

**To Run:**
1. SQL Editor → New Query
2. Paste contents of `supabase-multiple-categories-schema.sql`
3. Click "Run"

**Expected Result:**
```
Success. Shows INSERT 0 12 (12 categories added)
```

---

## Verification Commands

After running all scripts, verify your setup:

### Check All Tables Exist:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Expected Tables:**
- assessment_questions
- category_detection_rules
- classes
- learning_categories
- reassessment_reminders
- scoring_config
- student_assessments
- student_notes
- students
- strategy_history
- users

### Check Learning Categories:
```sql
SELECT category_key, category_name, is_active
FROM learning_categories
ORDER BY category_name;
```

**Expected: 12 categories**

### Check Assessment Questions:
```sql
SELECT difficulty_level, COUNT(*) as question_count
FROM assessment_questions
WHERE is_active = true
GROUP BY difficulty_level
ORDER BY difficulty_level;
```

**Expected: Questions distributed across difficulty levels 2-9**

### Check Student Table Columns:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'students'
ORDER BY ordinal_position;
```

**Expected Columns:**
- id (uuid)
- class_id (uuid)
- name (text)
- parent_email (text)
- parent_email_2 (text)
- primary_category (text)
- created_at (timestamp)
- updated_at (timestamp)
- category_scores (jsonb) ← Added by multiple categories schema
- category_profile (jsonb) ← Added by multiple categories schema

---

## Common Errors and Solutions

### Error: "relation 'students' does not exist"
**Cause:** Trying to run Step 5 before Step 1
**Solution:** Run `supabase-schema.sql` first

### Error: "relation 'student_assessments' does not exist"
**Cause:** Trying to run Step 5 before Step 3
**Solution:** Run `supabase-student-assessment-schema.sql` first

### Error: "column 'category_scores' already exists"
**Cause:** Trying to re-run Step 5
**Solution:** Skip or drop the column first:
```sql
ALTER TABLE students DROP COLUMN IF EXISTS category_scores;
ALTER TABLE students DROP COLUMN IF EXISTS category_profile;
```
Then re-run Step 5.

### Error: "duplicate key value violates unique constraint"
**Cause:** Trying to re-insert learning categories
**Solution:** Either:
1. Skip the INSERT statements, OR
2. Delete existing data:
```sql
DELETE FROM learning_categories;
DELETE FROM category_detection_rules;
```
Then re-run the INSERTs.

---

## Quick Setup (All in One)

If you want to run everything at once (not recommended for first-time setup):

```sql
-- Step 1: Base schema
\i supabase-schema.sql

-- Step 2: Disable RLS
\i supabase-disable-rls.sql

-- Step 3: Assessment schema
\i supabase-student-assessment-schema.sql

-- Step 4: Seed questions
\i supabase-seed-assessment-questions.sql

-- Step 5: Multiple categories
\i supabase-multiple-categories-schema.sql
```

**Note:** The `\i` command only works in psql command-line tool, not Supabase SQL Editor.

---

## Testing Your Setup

### Test 1: Create a Test User
```sql
INSERT INTO users (clerk_id, email, role, full_name)
VALUES ('test_clerk_123', 'test@teacher.com', 'teacher', 'Test Teacher')
RETURNING *;
```

### Test 2: Create a Test Class
```sql
INSERT INTO classes (name, user_id)
SELECT 'Test Class', id FROM users WHERE email = 'test@teacher.com'
RETURNING *;
```

### Test 3: Create a Test Student
```sql
INSERT INTO students (class_id, name, parent_email)
SELECT id, 'Test Student', 'parent@example.com'
FROM classes
WHERE name = 'Test Class'
RETURNING *;
```

### Test 4: Check Learning Categories
```sql
SELECT COUNT(*) as total_categories FROM learning_categories;
-- Should return: 12
```

### Test 5: Verify Category Function
```sql
-- This will return empty {} until a student completes an assessment
SELECT calculate_student_categories(
  (SELECT id FROM students WHERE name = 'Test Student' LIMIT 1)
);
```

---

## Cleanup (Reset Database)

If you need to start over completely:

```sql
-- WARNING: This deletes ALL data!

DROP VIEW IF EXISTS student_category_overview CASCADE;
DROP TABLE IF EXISTS reassessment_reminders CASCADE;
DROP TABLE IF EXISTS student_notes CASCADE;
DROP TABLE IF EXISTS category_detection_rules CASCADE;
DROP TABLE IF EXISTS learning_categories CASCADE;
DROP TABLE IF EXISTS student_assessments CASCADE;
DROP TABLE IF EXISTS assessment_questions CASCADE;
DROP TABLE IF EXISTS scoring_config CASCADE;
DROP TABLE IF EXISTS strategy_history CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP FUNCTION IF EXISTS calculate_student_categories CASCADE;
DROP FUNCTION IF EXISTS update_student_category_scores CASCADE;
DROP FUNCTION IF EXISTS create_reassessment_reminder CASCADE;
```

Then start from Step 1 again.

---

## Summary Checklist

- [ ] Step 1: Run `supabase-schema.sql` ✓
- [ ] Step 2: Run `supabase-disable-rls.sql` ✓
- [ ] Step 3: Run `supabase-student-assessment-schema.sql` ✓
- [ ] Step 4: Run `supabase-seed-assessment-questions.sql` ✓
- [ ] Step 5: Run `supabase-multiple-categories-schema.sql` ✓
- [ ] Verification: All 11 tables exist ✓
- [ ] Verification: 12 learning categories loaded ✓
- [ ] Verification: 20 assessment questions loaded ✓
- [ ] Test: Create sample data successfully ✓

---

## Need Help?

If you encounter errors:

1. **Check which step failed** - Note the error message
2. **Verify previous steps completed** - Make sure earlier schemas ran successfully
3. **Check table existence**:
   ```sql
   \dt public.*
   ```
4. **Review error logs** in Supabase Dashboard → Database → Logs

---

## File Location Reference

All SQL files should be in the root `learnaura` directory:

```
E:\learnaura\
├── supabase-schema.sql (Step 1)
├── supabase-disable-rls.sql (Step 2)
├── supabase-student-assessment-schema.sql (Step 3)
├── supabase-seed-assessment-questions.sql (Step 4)
└── supabase-multiple-categories-schema.sql (Step 5)
```

---

## Post-Setup: Application Configuration

After database setup is complete:

1. **Update Supabase credentials** in `.env`:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

2. **Restart dev server**:
   ```bash
   cd aura-learn
   npm run dev
   ```

3. **Test the application**:
   - Sign up as a teacher
   - Create a class
   - Add students
   - Have students take assessments
   - View results in dashboard
   - Explore learning categories page

Your LearnAura database is now fully configured! 🎉
