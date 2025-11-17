# Cognitive Assessment Setup Guide

## Quick Start

### 1. Configure Environment Variables

Copy the example file and add your API keys:

```bash
cp .env.example .env
```

Then edit `.env` and add your keys:

```env
# Required: Get from https://makersuite.google.com/app/apikey
VITE_GEMINI_API_KEY=AIzaSy...your_actual_key_here
GEMINI_API_KEY=AIzaSy...your_actual_key_here

# Required: Get from Supabase project settings
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...your_actual_key_here
```

### 2. Run Database Migration

1. Go to your Supabase project: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase-cognitive-assessment-schema.sql`
4. Paste and run the SQL
5. Verify all 7 tables are created

### 3. Install Dependencies

```bash
npm install dotenv
```

### 4. Run Tests

```bash
npx tsx test-cognitive-assessment.ts
```

**Expected Output:**
```
✅ Gemini Question Generation: PASSED
✅ Domain Scoring Logic: PASSED
✅ Assessment Schedule Check: PASSED
```

---

## Troubleshooting

### Error: "403 Forbidden - Method doesn't allow unregistered callers"

**Cause:** Gemini API key is missing or invalid

**Solution:**
1. Get API key from: https://makersuite.google.com/app/apikey
2. Add to `.env` file:
   ```env
   VITE_GEMINI_API_KEY=your_key_here
   GEMINI_API_KEY=your_key_here
   ```
3. Restart the test

### Error: "Supabase not configured"

**Cause:** Supabase credentials are missing

**Solution:**
1. Go to Supabase project settings
2. Copy Project URL and anon key
3. Add to `.env` file
4. Restart the test

### Error: "Cannot find module 'dotenv'"

**Solution:**
```bash
npm install dotenv
```

---

## What Gets Tested

### Test 1: Gemini Question Generation
- Generates exactly 15 questions
- Validates domain distribution (3+2+3+3+2+2)
- Checks bilingual output (French + English)
- Verifies parallel student/parent versions
- Confirms reverse scoring items
- Validates research basis citations

### Test 2: Domain Scoring Logic
- Calculates domain averages
- Applies reverse scoring correctly
- Generates cognitive profiles
- Provides interpretations

### Test 3: Assessment Schedule
- Checks 15-day periodic tracking
- Validates overdue detection

---

## Next Steps After Tests Pass

1. **Phase 4**: Build Frontend Components
   - Teacher interface for generating assessments
   - Student assessment page (voice-based)
   - Parent assessment page (web form)
   - Triangulation dashboard

2. **Phase 5**: Implement AuraVoice
   - Python LiveKit voice agent
   - Voice response processing
   - Bilingual voice support

3. **Phase 6-8**: Complete remaining phases
   - API endpoints
   - Internationalization
   - Comprehensive testing

---

## Files Created

1. `supabase-cognitive-assessment-schema.sql` - Database schema (7 tables)
2. `src/services/gemini-cognitive-generator.ts` - Question generator
3. `src/services/cognitive-assessment-service.ts` - Business logic (11 functions)
4. `test-cognitive-assessment.ts` - Test suite
5. `COGNITIVE_ASSESSMENT_IMPLEMENTATION_SUMMARY.md` - Full documentation
6. `.env.example` - Environment variable template
7. `SETUP_COGNITIVE_ASSESSMENT.md` - This file

---

## Support

If you encounter issues:
1. Check that all environment variables are set correctly
2. Verify database migration completed successfully
3. Ensure you have a valid Gemini API key
4. Review error messages in the test output

For detailed implementation information, see `COGNITIVE_ASSESSMENT_IMPLEMENTATION_SUMMARY.md`
