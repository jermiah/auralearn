# Teaching Guides Ingestion Pipeline

## Overview

A parallel ingestion pipeline for processing teaching guide PDFs, completely independent from the curriculum pipeline but using the same architecture and environment variables.

## ✅ What Was Created

### 1. Directory Structure
```
backend/assessment_pipeline/teaching_guides/
├── __init__.py              # Package initialization
├── schemas.py               # TeachingGuideChunk Pydantic schema
├── ocr_client.py            # Mistral OCR client (copied from ingestion/)
├── parser.py                # Teaching guide-specific chunking logic
├── metadata.py              # Metadata builder for validation
├── supabase_client.py       # Database client for teaching_guides_chunks
├── run_ingestion.py         # Main ingestion script
└── README.md                # Complete documentation
```

### 2. Database Schema
- **File**: `backend/teaching_guides_chunks.sql`
- **Table**: `teaching_guides_chunks`
- **Indexes**: doc_id, guide_type, topic, grades (GIN), is_general, created_at

### 3. PDF Storage
- **Folder**: `pdfs/teaching_guides/`
- **Purpose**: Store teaching guide PDFs separately from curriculum PDFs

## 🔑 Key Features

### Independent Operation
- ✅ Separate PDF folder (`pdfs/teaching_guides/`)
- ✅ Separate database table (`teaching_guides_chunks`)
- ✅ Separate schema (`TeachingGuideChunk`)
- ✅ Can run simultaneously with curriculum pipeline
- ✅ Uses same environment variables (no additional config needed)

### Schema Differences

| Field | Curriculum | Teaching Guides |
|-------|-----------|-----------------|
| **Primary Key** | `id` (UUID) | `id` (UUID) |
| **Document ID** | `doc_id` | `doc_id` |
| **Classification** | `cycle`, `grades`, `subject` | `guide_type`, `applicable_grades` |
| **Content** | `section_type`, `topic`, `subtopic` | `topic`, `subtopic`, `section_header` |
| **Flags** | `is_cycle_wide` | `is_general` |

### Guide Types
- `pedagogical` - General pedagogical guidance
- `strategy` - Teaching strategies and methods
- `activity` - Classroom activities and exercises
- `assessment` - Assessment and evaluation guides

## 📋 Usage

### Setup

1. **Create the database table** in Supabase:
```sql
-- Run the SQL from backend/teaching_guides_chunks.sql
```

2. **Add teaching guide PDFs**:
```bash
# Place your teaching guide PDFs here
mkdir -p pdfs/teaching_guides
# Copy PDFs to pdfs/teaching_guides/
```

3. **Verify environment variables** (same as curriculum):
```bash
MISTRAL_API_KEY=your_key_here
MISTRAL_MODEL=mistral-ocr-2505
SUPABASE_URL=your_url_here
SUPABASE_SERVICE_ROLE_KEY=your_key_here
```

### Run Ingestion

```bash
# From project root
python backend/assessment_pipeline/teaching_guides/run_ingestion.py
```

### Expected Output

```
======================================================================
TEACHING GUIDE PDF INGESTION PIPELINE
Local Processing -> Mistral OCR -> Supabase Database
======================================================================

[INFO] Found X PDF files in pdfs/teaching_guides/

[1/4] Initializing clients...
[OK] Clients initialized

[2/4] Processing PDFs with Mistral OCR...

[1/X] Processing: guide_name.pdf
[OCR] Processing: guide_name.pdf
[OK] Extracted XXXXX characters from guide_name.pdf (XX pages)
   [INFO] Parsing into chunks...
   [OK] Created XX valid chunks

[OK] Total chunks created: XXX

[3/4] Inserting chunks into Supabase database...
[OK] Successfully inserted XXX chunks

[4/4] Getting database statistics...

======================================================================
[SUCCESS] INGESTION COMPLETE
======================================================================

[STATS] Database Statistics:
   Total chunks: XXX
   Guide types: pedagogical, strategy, activity
   Topics: Chapter 1, Chapter 2, ...

[SUCCESS] Teaching guide data is now ready in Supabase!
   Table: teaching_guides_chunks
   Rows inserted: XXX
```

## 🔍 Querying the Data

### Get all chunks
```sql
SELECT * FROM teaching_guides_chunks;
```

### Filter by guide type
```sql
SELECT * FROM teaching_guides_chunks 
WHERE guide_type = 'strategy';
```

### Filter by grade
```sql
SELECT * FROM teaching_guides_chunks 
WHERE 'CM1' = ANY(applicable_grades);
```

### Filter by topic
```sql
SELECT * FROM teaching_guides_chunks 
WHERE topic ILIKE '%differentiation%';
```

### Get statistics
```sql
SELECT 
    guide_type,
    COUNT(*) as chunk_count,
    COUNT(DISTINCT doc_id) as document_count
FROM teaching_guides_chunks
GROUP BY guide_type;
```

## 🔄 Comparison with Curriculum Pipeline

| Aspect | Curriculum Pipeline | Teaching Guides Pipeline |
|--------|-------------------|------------------------|
| **Script** | `ingestion/ingest_curriculum.py` | `teaching_guides/run_ingestion.py` |
| **PDF Folder** | `pdfs/` | `pdfs/teaching_guides/` |
| **Table** | `curriculum_chunks` | `teaching_guides_chunks` |
| **Schema** | `CurriculumChunk` | `TeachingGuideChunk` |
| **Chunking** | Subject-based (Volet 1, 2, 3) | Chapter/pedagogy-based |
| **Metadata** | Cycle, grades, subject, section_type | Guide type, applicable grades, section header |
| **OCR Client** | `ingestion/ocr_client.py` | `teaching_guides/ocr_client.py` (copy) |
| **Env Vars** | Same | Same |

## 🛠️ Architecture

### Shared Components
Both pipelines use:
- ✅ Same Mistral OCR API
- ✅ Same environment variables
- ✅ Same Supabase instance
- ✅ Same OCR client code
- ✅ Similar chunking logic (adapted for content type)

### Independent Components
Each pipeline has:
- ✅ Own PDF source folder
- ✅ Own database table
- ✅ Own Pydantic schema
- ✅ Own parser logic
- ✅ Own Supabase client

## 📊 Data Flow

```
Teaching Guide PDFs (pdfs/teaching_guides/)
    ↓
Mistral OCR API (extract text)
    ↓
OCR Result (pages with text)
    ↓
TeachingGuideChunker (parse by chapters/sections)
    ↓
TeachingGuideChunk objects (validated)
    ↓
Supabase teaching_guides_chunks table
```

## 🚀 Next Steps

1. **Add teaching guide PDFs** to `pdfs/teaching_guides/`
2. **Run the SQL schema** in Supabase
3. **Execute the ingestion script**
4. **Verify data** in Supabase
5. **Integrate with RAG retrieval** for teaching support

## 📝 Notes

- Both pipelines can run **simultaneously** without conflicts
- OCR outputs are saved to `ocr_outputs/` (shared folder)
- Database uses auto-generated UUIDs (no manual ID management)
- Chunks are validated before insertion
- Failed PDFs are skipped with warnings
- Progress is logged for each PDF

## 🔧 Troubleshooting

### No PDFs Found
```
[ERROR] No PDF files found in pdfs/teaching_guides/
```
**Solution**: Add PDF files to `pdfs/teaching_guides/` folder

### Table Doesn't Exist
```
[ERROR] relation "teaching_guides_chunks" does not exist
```
**Solution**: Run the SQL schema from `backend/teaching_guides_chunks.sql`

### OCR Extraction Failed
```
[WARNING] Failed to extract text, skipping...
```
**Solution**: Check Mistral API key and PDF file integrity

### No Valid Chunks Created
```
[ERROR] No valid chunks created
```
**Solution**: Check PDF content structure and parser patterns

## 📚 Documentation

- **Pipeline README**: `backend/assessment_pipeline/teaching_guides/README.md`
- **SQL Schema**: `backend/teaching_guides_chunks.sql`
- **This Guide**: `TEACHING_GUIDES_PIPELINE.md`

## ✨ Summary

The teaching guides pipeline is a **complete, independent ingestion system** that:
- Processes teaching guide PDFs separately from curriculum
- Uses the same infrastructure (OCR, Supabase, env vars)
- Stores data in a dedicated table with appropriate schema
- Can run in parallel with curriculum ingestion
- Provides pedagogical support content for RAG retrieval

**Status**: ✅ Complete and ready to use
**Branch**: `rag_pipeline`
**Commit**: "Add parallel teaching guide ingestion pipeline"
