# Supabase Migrations

This folder contains all SQL migration files for the LearnAura database.

## 📋 Migration Files

### Core Schema
- **supabase-schema.sql** - Main database schema with all tables
- **supabase-auth-schema.sql** - Authentication-related schema

### Assessment System
- **supabase-student-assessment-schema.sql** - Academic assessment tables
- **supabase-seed-assessment-questions.sql** - Sample assessment questions
- **supabase-cognitive-assessment-schema.sql** - Cognitive assessment tables

### Category & Scoring System
- **supabase-combined-scoring-system.sql** - ⭐ **LATEST** - Combined cognitive + academic scoring
- **supabase-cognitive-to-category-mapping.sql** - Cognitive-only mapping (replaced by combined)
- **supabase-add-category-scores.sql** - Adds category_scores column
- **supabase-multiple-categories-schema.sql** - Multi-bucket assignment logic
- **supabase-teaching-guides-category-mapping.sql** - Teaching guide categorization

### Security & RLS
- **supabase-rls-fix.sql** - Row Level Security fixes
- **supabase-disable-rls.sql** - Disable RLS (development only)
- **supabase-fix-assessment-rls.sql** - Assessment RLS fixes
- **supabase-fix-assessment-rls-v2.sql** - Updated assessment RLS

### Features
- **supabase-language-preference-migration.sql** - i18n language preferences
- **supabase-assessment-token-migration.sql** - Token-based assessment access
- **supabase-teacher-onboarding-migration.sql** - Teacher onboarding flow

### Utilities
- **supabase-remove-duplicate-students.sql** - Data cleanup script

---

## 🚀 How to Apply Migrations

### Method 1: Supabase Dashboard (Recommended)

1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **SQL Editor**
3. Open the migration file you want to apply
4. Copy the contents
5. Paste into SQL Editor
6. Click **"Run"**
7. Verify: `Success. No rows returned`

### Method 2: Supabase CLI (Advanced)

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Apply migration
supabase db push
```

---

## 📦 Deployment Order

If setting up a new database from scratch, apply migrations in this order:

### 1. Core Schema & Auth
```
1. supabase-schema.sql
2. supabase-auth-schema.sql
3. supabase-rls-fix.sql (or supabase-disable-rls.sql for dev)
```

### 2. Assessment System
```
4. supabase-student-assessment-schema.sql
5. supabase-cognitive-assessment-schema.sql
6. supabase-seed-assessment-questions.sql (optional)
7. supabase-fix-assessment-rls-v2.sql
```

### 3. Category & Scoring (LATEST - Use Combined System)
```
8. supabase-add-category-scores.sql
9. supabase-combined-scoring-system.sql (⭐ REQUIRED)
10. supabase-teaching-guides-category-mapping.sql
```

### 4. Features
```
11. supabase-language-preference-migration.sql
12. supabase-assessment-token-migration.sql
13. supabase-teacher-onboarding-migration.sql
```

### 5. Cleanup (if needed)
```
14. supabase-remove-duplicate-students.sql (run if you have duplicate data)
```

---

## ⚠️ Important Notes

### Combined Scoring System
- **supabase-combined-scoring-system.sql** is the **LATEST and REQUIRED** migration
- It replaces the cognitive-only approach with combined cognitive (60%) + academic (40%) scoring
- Must be applied AFTER both assessment schemas are in place
- Creates functions: `calculate_combined_category_scores()`, `get_student_buckets()`
- Enables multi-bucket student assignment

### Deprecated Files
- ~~supabase-cognitive-to-category-mapping.sql~~ - Replaced by combined scoring system
  - Still useful for understanding cognitive-only mapping
  - Not needed if using combined scoring system
- ~~supabase-multiple-categories-schema.sql~~ - Functionality integrated into combined scoring

### Development vs Production
- Use **supabase-disable-rls.sql** ONLY in development
- Use **supabase-rls-fix.sql** in production for security

---

## 🔍 Checking Migration Status

### View Applied Functions
```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;
```

### Check for Combined Scoring System
```sql
-- Should return the function definition
SELECT prosrc
FROM pg_proc
WHERE proname = 'calculate_combined_category_scores';
```

### Verify Triggers
```sql
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public';
```

---

## 📝 Creating New Migrations

When creating new migration files:

1. Use naming convention: `supabase-{feature-name}-{version}.sql`
2. Add description comment at top of file
3. Use `CREATE OR REPLACE` for functions to make them idempotent
4. Test locally first before applying to production
5. Document in this README

---

## 🆘 Troubleshooting

### Migration Fails
- Check that prerequisite migrations are applied
- Verify table/column names match your schema
- Check for syntax errors in SQL Editor

### Function Not Found
- Ensure migration was applied successfully
- Check function name spelling
- Verify function exists: `SELECT * FROM pg_proc WHERE proname = 'function_name';`

### Trigger Not Firing
- Check trigger was created: `SELECT * FROM information_schema.triggers;`
- Verify trigger function exists
- Check table names in trigger definition

---

**For detailed information on the Combined Scoring System, see [docs/scoring/COMBINED_SCORING_SYSTEM.md](../../docs/scoring/COMBINED_SCORING_SYSTEM.md)**
