# Database Setup - Quick Start Guide

## ⚠️ IMPORTANT: Run SQL Files in This Exact Order!

Open Supabase Dashboard → SQL Editor, then copy/paste each file's contents in this order:

---

## Step 1: Base Schema ✅

**File:** `supabase-schema.sql`

Creates: users, classes, students, strategy_history tables

**Run this first!**

---

## Step 2: Disable RLS ✅

**File:** `supabase-disable-rls.sql`

Temporarily disables Row Level Security for development.

---

## Step 3: Assessment Tables ✅

**File:** `supabase-student-assessment-schema.sql`

Creates: student_assessments, assessment_questions, scoring_config, student_notes, reassessment_reminders

---

## Step 4: Sample Questions ✅

**File:** `supabase-seed-assessment-questions.sql`

Adds 20 sample assessment questions

---

## Step 5: Multiple Categories ✅

**File:** `supabase-multiple-categories-schema.sql`

Adds: learning_categories table (12 categories), category_scores columns, automatic triggers

**This requires Steps 1-4 to be completed first!**

---

## Verify Setup

After running all 5 steps, run this to verify:

```sql
-- Check all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Should show 11 tables:
-- assessment_questions
-- category_detection_rules
-- classes
-- learning_categories
-- reassessment_reminders
-- scoring_config
-- student_assessments
-- student_notes
-- students
-- strategy_history
-- users

-- Check categories loaded
SELECT COUNT(*) FROM learning_categories;
-- Should return: 12

-- Check questions loaded
SELECT COUNT(*) FROM assessment_questions WHERE is_active = true;
-- Should return: 20
```

---

## ✅ Done!

Your database is now ready. Start the dev server:

```bash
cd e:\learnaura\aura-learn
npm run dev
```

Then visit: http://localhost:8081

---

## Common Errors

**"relation 'students' does not exist"**
→ You skipped Step 1. Run `supabase-schema.sql` first!

**"relation 'student_assessments' does not exist"**
→ You skipped Step 3. Run `supabase-student-assessment-schema.sql`!

**"duplicate key violates unique constraint"**
→ You already ran this script. Skip or delete existing data first.

---

## All SQL Files Location

```
E:\learnaura\aura-learn\
├── supabase-schema.sql (Step 1)
├── supabase-disable-rls.sql (Step 2)
├── supabase-student-assessment-schema.sql (Step 3)
├── supabase-seed-assessment-questions.sql (Step 4)
└── supabase-multiple-categories-schema.sql (Step 5)
```

---

## Need to Reset?

To start over completely:

```sql
-- WARNING: Deletes ALL data!
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
```

Then start from Step 1 again.
