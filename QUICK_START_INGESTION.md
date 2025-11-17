# 🚀 Quick Start: Curriculum PDF Ingestion

## ⚡ TL;DR - Run This Now

```bash
# 1. Configure environment variables
# Edit: E:\learnaura\aura-learn\backend\.env

# 2. Install dependencies
cd E:\learnaura\aura-learn
pip install mistralai supabase PyMuPDF pydantic python-dotenv

# 3. Create database table
# Run SQL file in Supabase: backend/curriculum_chunks.sql

# 4. Run ingestion
python -m backend.assessment_pipeline initialize

# 5. Verify results
python -m backend.assessment_pipeline stats
```

---

## 📝 Required Environment Variables

**Edit:** `E:\learnaura\aura-learn\backend\.env`

```env
MISTRAL_API_KEY=sk-...your_actual_key_here
MISTRAL_MODEL=mistral-ocr-2505

SUPABASE_URL=https://yourproject.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...your_actual_key_here
```

**Get Credentials:**

1. **Mistral API Key:**
   - Go to: https://console.mistral.ai/
   - API Keys → Create new key
   - Copy and paste into `MISTRAL_API_KEY`

2. **Supabase Credentials:**
   - Go to: https://supabase.com/dashboard
   - Select your project
   - Settings → API
   - Copy:
     - Project URL → `SUPABASE_URL`
     - Service Role Key → `SUPABASE_SERVICE_ROLE_KEY`

---

## 🗄️ Database Setup

**File:** `E:\learnaura\aura-learn\backend\curriculum_chunks.sql`

**Steps:**

1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in left sidebar
4. Click "New Query"
5. Copy contents of `curriculum_chunks.sql`
6. Paste into SQL editor
7. Click "Run" or press `Ctrl+Enter`
8. You should see: "Success. No rows returned"

---

## 📂 What Gets Ingested

**Source Directory:**
```
E:\learnaura\aura-learn\1_OFFICIAL CURRICULUM by EDUCATION NATIONALE\
```

**PDF Files:** All `.pdf` files in this directory

**Output:**
- ✅ Uploaded to Supabase Storage bucket: `curriculum_pdfs`
- ✅ Processed with Mistral OCR
- ✅ Chunked into structured JSON
- ✅ Saved to Supabase table: `curriculum_chunks`

---

## 🎯 Pipeline Flow

```
Step 1: Upload PDFs to Supabase Storage
   ↓
Step 2: Download and extract with Mistral OCR
   ↓
Step 3: Parse into structured JSON pages
   ↓
Step 4: Apply 3-level hierarchical chunking
   ↓
Step 5: Enrich metadata (cycle, grades, subject, etc.)
   ↓
Step 6: Validate chunks (structure, fields, content)
   ↓
Step 7: Batch upsert to Supabase database
```

---

## 🔍 Verify Results

### Check Database

```python
from backend.assessment_pipeline.supabase_db import get_curriculum_stats

stats = get_curriculum_stats()

print(f"Total chunks: {stats['total_chunks']}")
print(f"Subjects: {', '.join(stats['subjects'])}")
print(f"Cycles: {', '.join(stats['cycles'])}")
```

### Query Chunks

```python
from backend.assessment_pipeline.supabase_db import search_curriculum_chunks

# Get Français chunks for CM1/CM2
chunks = search_curriculum_chunks(
    subject="Français",
    grades=["CM1", "CM2"]
)

print(f"Found {len(chunks)} Français chunks for CM1/CM2")

# Print first chunk
if chunks:
    chunk = chunks[0]
    print(f"\nExample chunk:")
    print(f"  Topic: {chunk['topic']}")
    print(f"  Grades: {chunk['grades']}")
    print(f"  Text preview: {chunk['chunk_text'][:100]}...")
```

### Check Storage

```python
from backend.assessment_pipeline.supabase_storage import SupabaseStorageService

storage = SupabaseStorageService()
files = storage.list_pdfs()

print(f"PDFs in storage: {len(files)}")
for file in files[:5]:
    print(f"  - {file['name']}")
```

---

## 🛠️ Troubleshooting

### Error: "No module named 'mistralai'"

```bash
pip install mistralai==0.1.8
```

### Error: "No module named 'supabase'"

```bash
pip install supabase==2.3.0
```

### Error: "MISTRAL_API_KEY not found"

1. Check that `backend/.env` exists
2. Verify the file contains `MISTRAL_API_KEY=...`
3. Make sure there are no spaces around the `=`
4. No quotes needed: `MISTRAL_API_KEY=sk-abc123` ✅
5. Wrong: `MISTRAL_API_KEY="sk-abc123"` ❌

### Error: "Bucket already exists"

This is OK! The pipeline is idempotent. It will reuse the existing bucket.

### Error: "Table does not exist"

Run the SQL schema file in Supabase SQL Editor:
- File: `backend/curriculum_chunks.sql`
- Location: Supabase Dashboard → SQL Editor

### Error: "Authentication failed"

1. Verify `SUPABASE_SERVICE_ROLE_KEY` (not anon key!)
2. Check `SUPABASE_URL` format: `https://yourproject.supabase.co`
3. No trailing slash in URL

---

## 📊 Expected Output

When you run `python -m backend.assessment_pipeline initialize`, you should see:

```
🚀 Initializing curriculum database...

☁️ Uploading PDFs to Supabase Storage...
Bucket 'curriculum_pdfs' already exists
Found 12 PDF files to upload
Successfully uploaded cycle2_francais.pdf
Successfully uploaded cycle3_maths.pdf
...
Successfully uploaded 12/12 PDFs

📄 Processing PDFs with Mistral OCR...
Processing PDF: cycle2_francais.pdf
Successfully extracted text from cycle2_francais.pdf (45823 characters)
...

✂️ Chunking documents...
Processing document cycle2_francais.pdf (42 pages)
Created 156 chunks from cycle2_francais.pdf
...

🏷️ Enriching metadata...
Enriched 1247 chunks

✅ Processed 1247 valid chunks

💾 Saving chunks to Supabase database...
Upserted batch 1 (100 chunks)
Upserted batch 2 (100 chunks)
...
Upserted batch 13 (47 chunks)

Successfully upserted 1247 curriculum chunks

🎉 Curriculum database initialization complete!
```

---

## 🧪 Test with One PDF

To test with a single PDF before running the full pipeline:

```python
from backend.assessment_pipeline.ocr_service import MistralOCRService

# Test OCR on single PDF
ocr_service = MistralOCRService()

result = ocr_service.extract_text_from_file(
    "1_OFFICIAL CURRICULUM by EDUCATION NATIONALE/your_pdf.pdf"
)

if result:
    print(f"Success! Extracted {result['total_pages']} pages")
    print(f"First page: {result['pages'][0]['text'][:200]}...")
else:
    print("OCR failed")
```

---

## 📁 File Locations

| What | Where |
|------|-------|
| Environment config | `backend/.env` |
| SQL schema | `backend/curriculum_chunks.sql` |
| Main pipeline | `backend/assessment_pipeline/pipeline.py` |
| Storage service | `backend/assessment_pipeline/supabase_storage.py` |
| OCR service | `backend/assessment_pipeline/ocr_service.py` |
| Database service | `backend/assessment_pipeline/supabase_db.py` |
| PDF source directory | `1_OFFICIAL CURRICULUM by EDUCATION NATIONALE/` |

---

## ✅ Success Checklist

Before running the pipeline, verify:

- [ ] `backend/.env` exists and has real API keys (not placeholders)
- [ ] Mistral API key is valid (`MISTRAL_API_KEY`)
- [ ] Supabase URL is correct (`SUPABASE_URL`)
- [ ] Supabase service role key is correct (`SUPABASE_SERVICE_ROLE_KEY`)
- [ ] `curriculum_chunks` table exists in Supabase
- [ ] PDF files exist in source directory
- [ ] Python dependencies installed (`pip install ...`)

After running the pipeline:

- [ ] No errors during execution
- [ ] Chunks appear in Supabase database
- [ ] `curriculum_chunks` table has rows
- [ ] PDFs uploaded to `curriculum_pdfs` bucket
- [ ] Stats command shows correct counts

---

## 🎓 What This Does (Reminder)

**ONLY does:**
- ✅ PDF → Supabase Storage
- ✅ OCR → Structured JSON
- ✅ Chunking → Metadata
- ✅ Validation → Supabase Database

**Does NOT do:**
- ❌ Question generation
- ❌ Vector embeddings
- ❌ Retrieval/RAG
- ❌ Assessment creation

---

## 💡 Pro Tips

1. **Test with one PDF first:**
   - Move all but one PDF out of the source directory
   - Run pipeline
   - Verify results
   - Then process all PDFs

2. **Monitor Mistral API usage:**
   - OCR can use significant tokens
   - Check your Mistral dashboard for usage
   - Consider rate limits

3. **Supabase database size:**
   - Each chunk is ~500-1000 bytes
   - 10,000 chunks ≈ 5-10 MB
   - Well within free tier limits

4. **Rerun is safe:**
   - Pipeline uses upsert (not insert)
   - Running twice won't create duplicates
   - Same chunk ID → updates existing row

---

## 📞 Support

If you encounter issues:

1. Check [DOCUMENT_INGESTION_PIPELINE_STATUS.md](DOCUMENT_INGESTION_PIPELINE_STATUS.md) for detailed docs
2. Review error messages carefully
3. Verify environment variables
4. Check Supabase dashboard for table/bucket
5. Test Mistral API key separately

---

**Last Updated:** 2025-11-16
**Version:** 1.0
**Status:** Ready to Use ✅
