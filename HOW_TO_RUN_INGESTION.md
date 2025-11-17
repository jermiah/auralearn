# 🚀 How to Run Curriculum PDF Ingestion

## Step-by-Step Guide

---

## ✅ Step 1: Install Dependencies

Open terminal in your project folder:

```bash
cd e:\learnaura\aura-learn
pip install mistralai supabase pydantic python-dotenv
```

---

## ✅ Step 2: Configure Environment Variables

Edit the file: `backend/.env`

**Location:** `e:\learnaura\aura-learn\backend\.env`

**Add these variables:**

```env
MISTRAL_API_KEY=sk-your_actual_mistral_api_key_here
MISTRAL_MODEL=mistral-ocr-2505
SUPABASE_URL=https://yourproject.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJyour_actual_service_role_key_here
```

### Where to Get the Keys:

**Mistral API Key:**
1. Go to: https://console.mistral.ai/
2. Sign up or log in
3. Go to "API Keys"
4. Create new key
5. Copy and paste into `MISTRAL_API_KEY`

**Supabase Credentials:**
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Go to Settings → API
4. Copy:
   - **URL** → paste into `SUPABASE_URL`
   - **Service Role Key** (NOT anon key!) → paste into `SUPABASE_SERVICE_ROLE_KEY`

---

## ✅ Step 3: Create Database Table

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Open the file: `e:\learnaura\aura-learn\backend\curriculum_chunks.sql`
6. Copy ALL the SQL code
7. Paste into the Supabase SQL Editor
8. Click **Run** (or press Ctrl+Enter)
9. You should see: "Success. No rows returned"

---

## ✅ Step 4: Verify PDFs are in Place

Your PDFs should be in:

```
e:\learnaura\aura-learn\pdfs\
```

Check that the folder exists and has PDF files:

```bash
cd e:\learnaura\aura-learn
dir pdfs
```

You should see your curriculum PDF files listed.

---

## ✅ Step 5: Run the Ingestion Script

Open terminal and run:

```bash
cd e:\learnaura\aura-learn
python backend/assessment_pipeline/ingestion/ingest_curriculum.py
```

**OR** (alternative command):

```bash
cd e:\learnaura\aura-learn
python -m backend.assessment_pipeline.ingestion.ingest_curriculum
```

---

## 📊 What You Should See

```
======================================================================
CURRICULUM PDF INGESTION PIPELINE
Local Processing → Mistral OCR → Supabase Database
======================================================================

📚 Found 12 PDF files in e:\learnaura\aura-learn\pdfs

[1/4] Initializing clients...
✅ Clients initialized

[2/4] Processing PDFs with Mistral OCR...

[1/12] Processing: cycle2_francais.pdf
📄 Processing: cycle2_francais.pdf
Successfully extracted text from cycle2_francais.pdf (45823 characters)
   📄 Parsing into chunks...
   ✅ Created 156 valid chunks

[2/12] Processing: cycle3_maths.pdf
📄 Processing: cycle3_maths.pdf
Successfully extracted text from cycle3_maths.pdf (38291 characters)
   📄 Parsing into chunks...
   ✅ Created 142 valid chunks

... (continues for all PDFs)

✅ Total chunks created: 1247

[3/4] Inserting chunks into Supabase database...
✅ Inserted batch 1 (100 chunks)
✅ Inserted batch 2 (100 chunks)
✅ Inserted batch 3 (100 chunks)
... (continues)
🎉 Successfully inserted 1247 chunks into Supabase

[4/4] Getting database statistics...

======================================================================
✅ INGESTION COMPLETE
======================================================================

📊 Database Statistics:
   Total chunks: 1247
   Subjects: Français, Mathématiques, Sciences et technologie, Histoire et géographie
   Cycles: 2, 3, 4

✅ Curriculum data is now ready in Supabase!
   Table: curriculum_chunks
   Rows inserted: 1247
```

---

## ✅ Step 6: Verify in Supabase

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click **Table Editor** in the left sidebar
4. Select table: **curriculum_chunks**
5. You should see all your curriculum chunks as rows

---

## 🔍 Troubleshooting

### Error: "PDF folder not found"

**Solution:**
```bash
cd e:\learnaura\aura-learn
mkdir pdfs
# Then add your PDF files to the pdfs/ folder
```

---

### Error: "Failed to initialize clients"

**Possible causes:**

1. **Missing environment variables**
   - Check `backend/.env` exists
   - Check all 4 variables are set

2. **Wrong API keys**
   - Verify Mistral API key is valid
   - Verify Supabase URL is correct
   - Verify Supabase Service Role Key (not anon key!)

**Check your .env:**
```bash
cd e:\learnaura\aura-learn\backend
type .env
```

---

### Error: "No PDF files found"

**Solution:**
Make sure PDFs are in the correct folder:
```
e:\learnaura\aura-learn\pdfs\
```

NOT in a subfolder like:
```
❌ e:\learnaura\aura-learn\pdfs\curriculum\
```

---

### Error: "Table 'curriculum_chunks' does not exist"

**Solution:**
You forgot Step 3! Run the SQL schema in Supabase:
1. Open `backend/curriculum_chunks.sql`
2. Run it in Supabase SQL Editor

---

### Error: "Mistral API error: Invalid API key"

**Solution:**
1. Go to: https://console.mistral.ai/
2. Check your API key
3. Copy the correct key
4. Update `MISTRAL_API_KEY` in `backend/.env`

---

### Error: "401 Unauthorized" (Supabase)

**Solution:**
You're using the **anon key** instead of the **service role key**.

1. Go to: https://supabase.com/dashboard
2. Settings → API
3. Copy the **service_role** key (NOT the anon_public key)
4. Update `SUPABASE_SERVICE_ROLE_KEY` in `backend/.env`

---

## ⏱️ How Long Does It Take?

**Per PDF:**
- Small PDF (20 pages): ~30-60 seconds
- Medium PDF (50 pages): ~60-120 seconds
- Large PDF (100 pages): ~120-180 seconds

**For 12 typical curriculum PDFs:**
- Total time: ~15-30 minutes

The Mistral OCR API is the slowest part (processes each page).

---

## 🎯 What Happens Next?

After ingestion completes:

1. ✅ All curriculum content is in Supabase
2. ✅ Data is structured and validated
3. ✅ Ready to use for assessments
4. ✅ Can query by subject, grade, cycle

You can now use this data in your application!

---

## 📝 Summary Command

**One-command setup (after environment is configured):**

```bash
cd e:\learnaura\aura-learn && python backend/assessment_pipeline/ingestion/ingest_curriculum.py
```

That's it! 🎉

---

**Need help?** Check the detailed documentation in:
- `INGESTION_PIPELINE_FINAL.md`
- `backend/assessment_pipeline/ingestion/README.md`
