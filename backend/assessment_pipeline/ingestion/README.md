# Curriculum PDF Ingestion

**Simple local-only ingestion pipeline for French curriculum PDFs.**

## 🚀 Quick Start

### 1. Prerequisites

Install dependencies:
```bash
pip install mistralai supabase pydantic python-dotenv
```

### 2. Configure Environment

Edit `backend/.env`:
```env
MISTRAL_API_KEY=sk-your_actual_mistral_key
MISTRAL_MODEL=mistral-ocr-2505
SUPABASE_URL=https://yourproject.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJyour_actual_service_role_key
```

### 3. Create Database Table

Run `backend/curriculum_chunks.sql` in Supabase SQL Editor.

### 4. Add PDFs

Put your curriculum PDFs in:
```
pdfs/
├── cycle2_francais.pdf
├── cycle3_maths.pdf
└── ... (all your PDFs)
```

### 5. Run Ingestion

```bash
cd e:\learnaura\aura-learn
python backend/assessment_pipeline/ingestion/ingest_curriculum.py
```

## 📊 Expected Output

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
✅ Extracted 45823 characters
   📄 Parsing into chunks...
   ✅ Created 156 valid chunks

[2/12] Processing: cycle3_maths.pdf
...

✅ Total chunks created: 1247

[3/4] Inserting chunks into Supabase database...
✅ Inserted batch 1 (100 chunks)
✅ Inserted batch 2 (100 chunks)
...
🎉 Successfully inserted 1247 chunks into Supabase

[4/4] Getting database statistics...

======================================================================
✅ INGESTION COMPLETE
======================================================================

📊 Database Statistics:
   Total chunks: 1247
   Subjects: Français, Mathématiques, Sciences et technologie
   Cycles: 2, 3, 4

✅ Curriculum data is now ready in Supabase!
   Table: curriculum_chunks
   Rows inserted: 1247
```

## 🔍 Troubleshooting

### Error: "PDF folder not found"
```bash
mkdir pdfs
# Then add PDFs to pdfs/ folder
```

### Error: "Failed to initialize clients"
Check your `backend/.env` file has all required variables.

### Error: "No PDF files found"
Make sure PDF files are directly in `pdfs/` folder (not in subfolders).

## 📁 What This Does

```
Local PDFs (pdfs/)
      ↓
Mistral OCR API
      ↓
Structured JSON chunks
      ↓
Validation (Pydantic)
      ↓
Supabase Database (curriculum_chunks table)
```

**NO cloud storage. NO vector database. NO question generation.**
**Just: PDF → OCR → JSON → Database**
