# Teaching Guide Ingestion Pipeline

This is a parallel pipeline to the curriculum ingestion system, specifically designed for processing teaching guide PDFs.

## Overview

The teaching guide pipeline:
1. Reads PDFs from `pdfs/teaching_guides/` folder
2. Processes them with Mistral OCR
3. Chunks content based on pedagogical structure
4. Stores chunks in `teaching_guides_chunks` Supabase table

## Directory Structure

```
teaching_guides/
├── __init__.py              # Package initialization
├── schemas.py               # TeachingGuideChunk schema
├── ocr_client.py            # Mistral OCR client (same as curriculum)
├── parser.py                # Teaching guide-specific chunking logic
├── metadata.py              # Metadata builder for teaching guides
├── supabase_client.py       # Database client for teaching_guides_chunks table
├── run_ingestion.py         # Main ingestion script
└── README.md                # This file
```

## Schema

Teaching guide chunks use this schema:

```python
class TeachingGuideChunk:
    id: Optional[str]              # Auto-generated UUID
    doc_id: str                    # Document identifier
    guide_type: str                # Type: pedagogical, strategy, activity, assessment
    applicable_grades: List[str]   # Grades: CM1, CM2, 6e, etc.
    topic: str                     # Main topic/chapter
    subtopic: str                  # Subtopic/section
    section_header: str            # Section header
    chunk_text: str                # Actual content
    page_start: int                # Starting page
    page_end: int                  # Ending page
    is_general: bool               # True if applies to all grades
    lang: str                      # Language (default: "fr")
```

## Usage

### Setup

1. Create the teaching guides PDF folder:
```bash
mkdir -p pdfs/teaching_guides
```

2. Add your teaching guide PDFs to this folder

3. Ensure environment variables are set in `.env`:
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

### Output

The script will:
- Process all PDFs in `pdfs/teaching_guides/`
- Extract text using Mistral OCR
- Save structured OCR output to `ocr_outputs/`
- Create chunks based on pedagogical structure
- Insert chunks into `teaching_guides_chunks` table

## Differences from Curriculum Pipeline

| Aspect | Curriculum | Teaching Guides |
|--------|-----------|-----------------|
| **PDF Location** | `pdfs/` | `pdfs/teaching_guides/` |
| **Schema** | CurriculumChunk | TeachingGuideChunk |
| **Table** | curriculum_chunks | teaching_guides_chunks |
| **Chunking** | Subject-based | Chapter/pedagogy-based |
| **Metadata** | Cycle, grades, subject | Guide type, applicable grades |

## Environment Variables

Both pipelines use the **same** environment variables:
- `MISTRAL_API_KEY` - Mistral OCR API key
- `MISTRAL_MODEL` - OCR model name
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

## Database Table

Create the table in Supabase:

```sql
CREATE TABLE teaching_guides_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doc_id TEXT NOT NULL,
    guide_type TEXT NOT NULL,
    applicable_grades TEXT[] NOT NULL,
    topic TEXT NOT NULL,
    subtopic TEXT NOT NULL,
    section_header TEXT NOT NULL,
    chunk_text TEXT NOT NULL,
    page_start INTEGER NOT NULL,
    page_end INTEGER NOT NULL,
    is_general BOOLEAN DEFAULT FALSE,
    lang TEXT DEFAULT 'fr',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_teaching_guides_doc_id ON teaching_guides_chunks(doc_id);
CREATE INDEX idx_teaching_guides_guide_type ON teaching_guides_chunks(guide_type);
CREATE INDEX idx_teaching_guides_topic ON teaching_guides_chunks(topic);
CREATE INDEX idx_teaching_guides_grades ON teaching_guides_chunks USING GIN(applicable_grades);
```

## Troubleshooting

### No PDFs Found
```
[ERROR] No PDF files found in pdfs/teaching_guides/
```
**Solution**: Add PDF files to `pdfs/teaching_guides/` folder

### OCR Extraction Failed
```
[WARNING] Failed to extract text, skipping...
```
**Solution**: Check Mistral API key and PDF file integrity

### Database Insertion Failed
```
[ERROR] Failed to insert chunks into database
```
**Solution**: Verify Supabase credentials and table exists

## Independent Operation

This pipeline operates **completely independently** from the curriculum pipeline:
- ✅ Different PDF source folder
- ✅ Different database table
- ✅ Different schema
- ✅ Can run simultaneously
- ✅ Uses same environment variables
- ✅ Uses same OCR client

## Next Steps

After ingestion:
1. Verify chunks in Supabase: `SELECT COUNT(*) FROM teaching_guides_chunks;`
2. Query by guide type: `SELECT * FROM teaching_guides_chunks WHERE guide_type = 'strategy';`
3. Query by grades: `SELECT * FROM teaching_guides_chunks WHERE 'CM1' = ANY(applicable_grades);`
