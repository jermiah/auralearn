# ✅ Curriculum PDF Ingestion - Pre-Flight Checklist

## 🎯 Before You Start

Use this checklist to ensure everything is ready before running the ingestion pipeline.

---

## 📋 Phase 1: Environment Setup

### 1.1 Python Environment

- [ ] **Python Version:** Python 3.8+ installed
  ```bash
  python --version  # Should show 3.8 or higher
  ```

- [ ] **Virtual Environment (Optional but recommended):**
  ```bash
  cd E:\learnaura\aura-learn
  python -m venv venv
  venv\Scripts\activate  # Windows
  ```

- [ ] **Dependencies Installed:**
  ```bash
  pip install mistralai==0.1.8
  pip install supabase==2.3.0
  pip install PyMuPDF==1.23.5
  pip install pydantic==2.4.0
  pip install python-dotenv==1.0.0
  ```

  Or install all at once:
  ```bash
  pip install -r requirements.txt
  ```

### 1.2 Environment Variables

- [ ] **File exists:** `E:\learnaura\aura-learn\backend\.env`

- [ ] **MISTRAL_API_KEY configured:**
  - [ ] Not placeholder: `your_mistral_api_key_here` ❌
  - [ ] Real key starting with `sk-` or similar ✅
  - [ ] Test with Mistral API:
    ```python
    from mistralai import Mistral
    client = Mistral(api_key="your_key")
    # Should not error
    ```

- [ ] **MISTRAL_MODEL set:**
  - [ ] Value: `mistral-ocr-2505` ✅

- [ ] **SUPABASE_URL configured:**
  - [ ] Format: `https://yourproject.supabase.co` ✅
  - [ ] No trailing slash ✅
  - [ ] Not placeholder ✅

- [ ] **SUPABASE_SERVICE_ROLE_KEY configured:**
  - [ ] Not anon key ✅
  - [ ] Service role key (starts with `eyJ...`) ✅
  - [ ] Not placeholder ✅

### 1.3 Verify Environment Loading

- [ ] **Test environment variables:**
  ```python
  import os
  from dotenv import load_dotenv

  # Load from backend/.env
  load_dotenv('backend/.env')

  print("MISTRAL_API_KEY:", "✅" if os.getenv('MISTRAL_API_KEY') else "❌")
  print("MISTRAL_MODEL:", os.getenv('MISTRAL_MODEL'))
  print("SUPABASE_URL:", "✅" if os.getenv('SUPABASE_URL') else "❌")
  print("SUPABASE_SERVICE_ROLE_KEY:", "✅" if os.getenv('SUPABASE_SERVICE_ROLE_KEY') else "❌")
  ```

---

## 📋 Phase 2: Supabase Setup

### 2.1 Database Table

- [ ] **Supabase project exists**
  - [ ] Go to: https://supabase.com/dashboard
  - [ ] Project is active ✅

- [ ] **SQL schema executed:**
  - [ ] Open: Supabase Dashboard → SQL Editor
  - [ ] Load file: `E:\learnaura\aura-learn\backend\curriculum_chunks.sql`
  - [ ] Run the SQL
  - [ ] Verify success message: "Success. No rows returned" ✅

- [ ] **Table exists:**
  - [ ] Go to: Table Editor in Supabase
  - [ ] See table: `curriculum_chunks` ✅
  - [ ] Has columns: `id`, `doc_id`, `cycle`, `grades`, `subject`, etc. ✅

- [ ] **Test table access:**
  ```python
  from backend.assessment_pipeline.supabase_db import SupabaseDatabaseService

  db = SupabaseDatabaseService()
  stats = db.get_table_stats()
  print("Table accessible:", stats.get('table_name') == 'curriculum_chunks')
  ```

### 2.2 Storage Bucket

- [ ] **Bucket creation will be automatic**
  - Pipeline will create `curriculum_pdfs` bucket
  - Or manually create in Supabase Storage dashboard

- [ ] **Bucket settings (if creating manually):**
  - [ ] Name: `curriculum_pdfs`
  - [ ] Public: `false` (private)
  - [ ] File size limit: 50MB
  - [ ] Allowed MIME types: `application/pdf`

---

## 📋 Phase 3: Source Files

### 3.1 PDF Directory

- [ ] **Directory exists:**
  ```
  E:\learnaura\aura-learn\1_OFFICIAL CURRICULUM by EDUCATION NATIONALE\
  ```

- [ ] **Contains PDF files:**
  - [ ] At least one `.pdf` file present ✅
  - [ ] PDFs are valid (not corrupted) ✅
  - [ ] PDFs are French curriculum documents ✅

- [ ] **Test directory access:**
  ```python
  import os
  from pathlib import Path

  pdf_dir = "1_OFFICIAL CURRICULUM by EDUCATION NATIONALE"
  pdf_files = list(Path(pdf_dir).glob("*.pdf"))

  print(f"Found {len(pdf_files)} PDF files")
  for pdf in pdf_files[:5]:
      print(f"  - {pdf.name}")
  ```

### 3.2 PDF Validation

- [ ] **Test PDF reading:**
  ```python
  import fitz  # PyMuPDF

  pdf_path = "1_OFFICIAL CURRICULUM by EDUCATION NATIONALE/your_first_pdf.pdf"
  doc = fitz.open(pdf_path)
  print(f"Pages: {doc.page_count}")
  doc.close()
  ```

---

## 📋 Phase 4: Code Verification

### 4.1 Import Tests

- [ ] **All modules importable:**
  ```python
  # Should not error
  from backend.assessment_pipeline.supabase_storage import SupabaseStorageService
  from backend.assessment_pipeline.ocr_service import MistralOCRService
  from backend.assessment_pipeline.chunking import CurriculumChunker
  from backend.assessment_pipeline.metadata import MetadataBuilder
  from backend.assessment_pipeline.supabase_db import SupabaseDatabaseService
  from backend.assessment_pipeline.pipeline import AssessmentPipeline
  from backend.assessment_pipeline.schemas import CurriculumChunk

  print("✅ All imports successful")
  ```

### 4.2 Service Initialization

- [ ] **Storage service initializes:**
  ```python
  from backend.assessment_pipeline.supabase_storage import SupabaseStorageService
  storage = SupabaseStorageService()
  print("Storage service:", "✅" if storage.supabase else "❌")
  ```

- [ ] **OCR service initializes:**
  ```python
  from backend.assessment_pipeline.ocr_service import MistralOCRService
  ocr = MistralOCRService()
  print("OCR service:", "✅" if ocr.client else "❌")
  ```

- [ ] **Database service initializes:**
  ```python
  from backend.assessment_pipeline.supabase_db import SupabaseDatabaseService
  db = SupabaseDatabaseService()
  print("Database service:", "✅" if db.supabase else "❌")
  ```

---

## 📋 Phase 5: API Connectivity

### 5.1 Mistral API

- [ ] **Test Mistral connection:**
  ```python
  from backend.assessment_pipeline.ocr_service import MistralOCRService

  ocr = MistralOCRService()

  # Test with a small PDF
  test_pdf = "path/to/test.pdf"
  result = ocr.extract_text_from_file(test_pdf)

  if result:
      print("✅ Mistral OCR working")
      print(f"   Extracted {result['total_pages']} pages")
  else:
      print("❌ Mistral OCR failed")
  ```

### 5.2 Supabase API

- [ ] **Test Supabase database:**
  ```python
  from backend.assessment_pipeline.supabase_db import SupabaseDatabaseService

  db = SupabaseDatabaseService()
  stats = db.get_table_stats()

  if 'error' not in stats:
      print("✅ Supabase database working")
      print(f"   Table: {stats['table_name']}")
  else:
      print("❌ Supabase database failed:", stats['error'])
  ```

- [ ] **Test Supabase storage:**
  ```python
  from backend.assessment_pipeline.supabase_storage import SupabaseStorageService

  storage = SupabaseStorageService()
  files = storage.list_pdfs()

  print("✅ Supabase storage working")
  print(f"   Files in storage: {len(files)}")
  ```

---

## 📋 Phase 6: Pre-Flight Test

### 6.1 Single PDF Test

- [ ] **Test with one PDF:**
  ```python
  from backend.assessment_pipeline.ocr_service import MistralOCRService
  from backend.assessment_pipeline.chunking import CurriculumChunker
  from backend.assessment_pipeline.metadata import MetadataBuilder

  # OCR
  ocr = MistralOCRService()
  result = ocr.extract_text_from_file("path/to/single_test.pdf")

  if result:
      print(f"✅ OCR: {result['total_pages']} pages")

      # Chunk
      chunker = CurriculumChunker()
      chunks = chunker.chunk_document(result['pages'])
      print(f"✅ Chunking: {len(chunks)} chunks")

      # Metadata
      metadata = MetadataBuilder()
      valid = [c for c in chunks if metadata.validate_chunk(c)]
      print(f"✅ Validation: {len(valid)}/{len(chunks)} valid")

      print("\n🎉 Pre-flight test successful!")
  else:
      print("❌ Pre-flight test failed")
  ```

---

## 📋 Phase 7: Final Checks

### 7.1 Disk Space

- [ ] **Sufficient disk space:**
  - [ ] For PDFs: ~500 MB
  - [ ] For temp files: ~1 GB
  - [ ] Check: `dir` or File Explorer

### 7.2 Network

- [ ] **Internet connection active** ✅
- [ ] **Can reach Mistral API:** https://api.mistral.ai/
- [ ] **Can reach Supabase:** https://supabase.com/

### 7.3 Permissions

- [ ] **Read access to PDF directory** ✅
- [ ] **Write access to temp directory** ✅
- [ ] **Supabase permissions:**
  - [ ] Service role key has full access ✅
  - [ ] Can create buckets ✅
  - [ ] Can insert into tables ✅

---

## 🚀 Ready to Launch

### All Systems Go?

Count your checkmarks:

- **Phase 1 (Environment):** ___ / 10 ✅
- **Phase 2 (Supabase):** ___ / 7 ✅
- **Phase 3 (Source Files):** ___ / 5 ✅
- **Phase 4 (Code):** ___ / 5 ✅
- **Phase 5 (APIs):** ___ / 3 ✅
- **Phase 6 (Pre-Flight):** ___ / 1 ✅
- **Phase 7 (Final):** ___ / 6 ✅

**Total:** ___ / 37 ✅

### Launch Commands

If **all checks passed**, run:

```bash
# Full pipeline
python -m backend.assessment_pipeline initialize
```

Or step-by-step:

```bash
# 1. Test setup
python -m backend.assessment_pipeline stats

# 2. Initialize (with limited PDFs for first test)
# Move all but 1-2 PDFs out of directory first
python -m backend.assessment_pipeline initialize

# 3. Verify results
python -m backend.assessment_pipeline stats

# 4. Run full batch
# Move all PDFs back
python -m backend.assessment_pipeline initialize
```

---

## 🔍 Troubleshooting Guide

### Common Issues

#### ❌ "ModuleNotFoundError: No module named 'mistralai'"

**Solution:**
```bash
pip install mistralai==0.1.8
```

#### ❌ "supabase_py.errors.APIError: 401 Unauthorized"

**Solution:**
- Check `SUPABASE_SERVICE_ROLE_KEY` (not anon key)
- Verify key in Supabase Dashboard → Settings → API

#### ❌ "Table 'curriculum_chunks' does not exist"

**Solution:**
- Run SQL file in Supabase SQL Editor
- File: `backend/curriculum_chunks.sql`

#### ❌ "Mistral API error: Invalid API key"

**Solution:**
- Check `MISTRAL_API_KEY` in `backend/.env`
- Verify key in Mistral Console: https://console.mistral.ai/

#### ❌ "No PDF files found"

**Solution:**
- Check directory: `1_OFFICIAL CURRICULUM by EDUCATION NATIONALE/`
- Ensure PDFs are directly in this folder (not subfolder)

---

## 📊 Expected Results

### After Successful Run

You should see:

```
🚀 Initializing curriculum database...

☁️ Uploading PDFs to Supabase Storage...
Successfully uploaded 12/12 PDFs

📄 Processing PDFs with Mistral OCR...
Successfully extracted text from 12 PDFs

✂️ Chunking documents...
Created 1247 chunks

🏷️ Enriching metadata...
Enriched 1247 chunks

✅ Processed 1247 valid chunks

💾 Saving chunks to Supabase database...
Successfully upserted 1247 curriculum chunks

🎉 Curriculum database initialization complete!
```

### Verification

```python
from backend.assessment_pipeline.supabase_db import get_curriculum_stats

stats = get_curriculum_stats()

# Should show:
# {
#   'total_chunks': 1247,
#   'subjects': ['Français', 'Mathématiques', ...],
#   'cycles': ['2', '3', '4'],
#   'table_name': 'curriculum_chunks'
# }
```

---

## ✅ Post-Launch Checklist

After running the pipeline:

- [ ] **No errors in console output** ✅
- [ ] **All PDFs processed** ✅
- [ ] **Chunks in Supabase database** ✅
- [ ] **PDFs in Supabase storage** ✅
- [ ] **Stats command shows data** ✅
- [ ] **Validation script passes** ✅

---

## 🎯 Next Steps After Success

1. **Run validation:**
   ```bash
   python backend/validate_chunks.py
   ```

2. **Query sample data:**
   ```python
   from backend.assessment_pipeline.supabase_db import search_curriculum_chunks

   chunks = search_curriculum_chunks("Français", ["CM1", "CM2"])
   print(f"Found {len(chunks)} Français chunks")
   ```

3. **Explore database:**
   - Supabase Dashboard → Table Editor
   - View `curriculum_chunks` table
   - Browse sample rows

---

**Checklist Version:** 1.0
**Last Updated:** 2025-11-16
**Status:** Ready for Use ✅
