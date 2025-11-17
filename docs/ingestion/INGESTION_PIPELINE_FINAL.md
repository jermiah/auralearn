# 📄 Curriculum PDF Ingestion Pipeline - FINAL SPECIFICATION

## ✅ SIMPLIFIED ARCHITECTURE (No Supabase Storage)

**Date:** 2025-11-16
**Status:** ✅ **READY TO IMPLEMENT**
**Location:** `E:\learnaura\aura-learn\backend\assessment_pipeline\ingestion\`

---

## 🎯 Executive Summary

### What This Pipeline Does

```
Local PDFs (on your machine)
      ↓
Mistral OCR API (mistral-ocr-2505)
      ↓
Structured JSON (validated chunks)
      ↓
Supabase Database (curriculum_chunks table)
      ↓
✅ Ready for use
```

### What This Pipeline Does NOT Do

- ❌ NO Supabase Storage buckets
- ❌ NO PDF uploads to cloud
- ❌ NO PDF downloads from storage
- ❌ NO file storage management
- ❌ NO question generation
- ❌ NO retrieval logic
- ❌ NO vector embeddings
- ❌ NO RAG pipeline

### The Lean Architecture

**Input:** PDF files in local folder `/pdfs/`
**Processing:** Mistral OCR → Structured JSON → Validation
**Output:** Rows in Supabase `curriculum_chunks` table

---

## 📋 Table of Contents

1. [Pipeline Flow](#1-pipeline-flow)
2. [Environment Variables](#2-environment-variables)
3. [Folder Structure](#3-folder-structure)
4. [JSON Schema (Pydantic)](#4-json-schema-pydantic)
5. [Mistral OCR Integration](#5-mistral-ocr-integration)
6. [Supabase Database](#6-supabase-database)
7. [Ingestion Script](#7-ingestion-script)
8. [How to Run](#8-how-to-run)
9. [Validation](#9-validation)

---

## 🔹 1. Pipeline Flow

### Complete Data Flow

```
┌─────────────────────────────────────────────────┐
│  Step 1: Local PDFs                             │
│  Location: E:\learnaura\aura-learn\pdfs\        │
│  - cycle2_francais.pdf                          │
│  - cycle3_maths.pdf                             │
│  - cycle4_sciences.pdf                          │
│  - ... (all curriculum PDFs)                    │
└────────────────┬────────────────────────────────┘
                 │
                 │ Read local file
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Step 2: Mistral OCR API                        │
│  - Read PDF bytes from disk                     │
│  - Encode to base64                             │
│  - Send to mistral-ocr-2505                     │
│  - Structured prompt for French curriculum      │
└────────────────┬────────────────────────────────┘
                 │
                 │ OCR response
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Step 3: Parse OCR Response                     │
│  - Extract text by pages                        │
│  - Detect Volets (1, 2, 3)                      │
│  - Detect sections (objectifs, compétences...)  │
│  - Extract cycle, grades, subject               │
└────────────────┬────────────────────────────────┘
                 │
                 │ Raw chunks
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Step 4: Generate Structured JSON               │
│  Using Pydantic schema:                         │
│  {                                              │
│    "cycle": "3",                                │
│    "grades": ["5e", "4e", "3e"],                │
│    "subject": "Français",                       │
│    "section_type": "competencies",              │
│    "topic": "Lecture et compréhension",         │
│    "subtopic": "Comprendre et interpréter",     │
│    "is_cycle_wide": false,                      │
│    "chunk_text": "...",                         │
│    "page_start": 12,                            │
│    "page_end": 14,                              │
│    "source_paragraph_id": "para_456",           │
│    "doc_id": "abc123",                          │
│    "order_index": 1,                            │
│    "curriculum_version": "2020",                │
│    "volet": "2"                                 │
│  }                                              │
└────────────────┬────────────────────────────────┘
                 │
                 │ Validated chunks
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Step 5: Validation                             │
│  - Schema validation (Pydantic)                 │
│  - Required fields present                      │
│  - Valid grades array                           │
│  - Content length >= 50 chars                   │
│  - Page numbers valid                           │
└────────────────┬────────────────────────────────┘
                 │
                 │ Valid chunks only
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Step 6: Insert into Supabase                   │
│  Table: curriculum_chunks                       │
│  Method: Batch insert (100 rows per batch)      │
│  ✅ All chunks saved in database                │
└─────────────────────────────────────────────────┘
```

### Key Simplifications

| Old Approach | New Approach |
|-------------|--------------|
| Upload PDFs to Supabase Storage | Keep PDFs local |
| Download PDFs from storage | Read directly from `/pdfs/` folder |
| Manage storage bucket | No storage needed |
| File permissions | No file permissions |
| Storage API calls | Direct file system access |

---

## 🔹 2. Environment Variables

### Required Variables

**File:** `E:\learnaura\aura-learn\backend\.env`

```env
# Mistral OCR API
MISTRAL_API_KEY=sk-your_actual_mistral_key_here
MISTRAL_MODEL=mistral-ocr-2505

# Supabase Database (NO STORAGE NEEDED)
SUPABASE_URL=https://yourproject.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJyour_actual_service_role_key_here
```

### What's Removed

```env
# ❌ NO LONGER NEEDED:
# SUPABASE_STORAGE_BUCKET=curriculum_pdfs  (REMOVED)
```

### How to Get Credentials

**1. Mistral API Key:**
- Visit: https://console.mistral.ai/
- Create account or login
- API Keys → Create new key
- Copy into `MISTRAL_API_KEY`

**2. Supabase Database Credentials:**
- Visit: https://supabase.com/dashboard
- Select your project
- Settings → API
- Copy:
  - Project URL → `SUPABASE_URL`
  - Service Role Key → `SUPABASE_SERVICE_ROLE_KEY`

---

## 🔹 3. Folder Structure

### Local Project Structure

```
E:\learnaura\aura-learn\
│
├── pdfs/                                    # ← LOCAL PDF FOLDER
│   ├── cycle2_francais.pdf
│   ├── cycle3_maths.pdf
│   ├── cycle3_sciences.pdf
│   ├── cycle4_histoire.pdf
│   └── ... (all curriculum PDFs)
│
├── backend/
│   ├── .env                                 # Environment variables
│   ├── curriculum_chunks.sql                # Database schema
│   │
│   └── assessment_pipeline/
│       └── ingestion/                       # ← NEW INGESTION FOLDER
│           ├── __init__.py
│           ├── ocr_client.py                # Mistral OCR client
│           ├── parser.py                    # JSON parsing logic
│           ├── schemas.py                   # Pydantic models
│           ├── supabase_client.py           # Database insertion
│           ├── ingest_curriculum.py         # ← MAIN SCRIPT
│           └── README.md                    # Documentation
│
└── Documentation/
    ├── INGESTION_PIPELINE_FINAL.md          # ← This document
    └── ...
```

### What's Removed

```
❌ backend/assessment_pipeline/supabase_storage.py  (REMOVED)
❌ backend/assessment_pipeline/storage/             (REMOVED)
❌ All storage-related code                         (REMOVED)
```

### What's Kept

```
✅ backend/assessment_pipeline/ingestion/ocr_client.py
✅ backend/assessment_pipeline/ingestion/parser.py
✅ backend/assessment_pipeline/ingestion/schemas.py
✅ backend/assessment_pipeline/ingestion/supabase_client.py
✅ backend/assessment_pipeline/ingestion/ingest_curriculum.py
```

---

## 🔹 4. JSON Schema (Pydantic)

### CurriculumChunk Model

**File:** `backend/assessment_pipeline/ingestion/schemas.py`

```python
from pydantic import BaseModel, Field, validator
from typing import List, Optional
from uuid import uuid4

class CurriculumChunk(BaseModel):
    """
    Schema for curriculum chunks
    Designed for French Ministry of Education curriculum PDFs
    """

    # Unique identifier
    id: str = Field(default_factory=lambda: str(uuid4()))

    # REQUIRED FIELDS
    cycle: str = Field(..., description="Educational cycle: '2', '3', or '4'")
    grades: List[str] = Field(..., description="Grade levels: ['CM1', 'CM2'] or ['5e', '4e', '3e']")
    subject: str = Field(..., description="Subject: 'Français', 'Mathématiques', etc.")
    section_type: str = Field(..., description="Section type: 'objectives', 'competencies', 'progression', etc.")
    topic: str = Field(..., description="Main topic from curriculum")
    chunk_text: str = Field(..., description="Actual curriculum content text")
    is_cycle_wide: bool = Field(False, description="True if applies to entire cycle")
    doc_id: str = Field(..., description="Source document identifier (hash of filename)")

    # RECOMMENDED FIELDS
    subtopic: Optional[str] = Field(None, description="Subtopic if applicable")
    page_start: int = Field(..., description="Starting page number in original PDF")
    page_end: int = Field(..., description="Ending page number in original PDF")
    source_paragraph_id: Optional[str] = Field(None, description="Paragraph identifier in original document")
    order_index: int = Field(..., description="Sequential order within document")

    # ADDITIONAL METADATA
    curriculum_version: Optional[str] = Field("2020", description="Curriculum version year")
    volet: Optional[str] = Field(None, description="Volet number (1, 2, or 3)")
    lang: str = Field("fr", description="Language code")

    # Timestamps (handled by Supabase)
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    @validator('grades')
    def validate_grades(cls, v, values):
        """Validate grades array"""
        if not values.get('is_cycle_wide') and not v:
            raise ValueError("grades required if not cycle_wide")

        valid_grades = ['CP', 'CE1', 'CE2', 'CM1', 'CM2', '6e', '5e', '4e', '3e']
        for grade in v:
            if grade not in valid_grades:
                raise ValueError(f"Invalid grade: {grade}")

        return v

    @validator('cycle')
    def validate_cycle(cls, v):
        """Validate cycle value"""
        if v not in ['2', '3', '4']:
            raise ValueError(f"Cycle must be '2', '3', or '4', got: {v}")
        return v

    @validator('chunk_text')
    def validate_chunk_text(cls, v):
        """Validate chunk text has content"""
        if not v or not v.strip():
            raise ValueError("chunk_text cannot be empty")
        if len(v.strip()) < 50:
            raise ValueError(f"chunk_text too short (min 50 chars): {len(v)}")
        return v.strip()

    @validator('page_start', 'page_end')
    def validate_pages(cls, v):
        """Validate page numbers"""
        if v < 1:
            raise ValueError("Page numbers must be >= 1")
        return v

    class Config:
        # Allow extra fields from Supabase (timestamps, etc.)
        extra = "ignore"
```

### Example JSON Output

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "cycle": "3",
  "grades": ["5e", "4e", "3e"],
  "subject": "Français",
  "section_type": "competencies",
  "topic": "Lecture et compréhension de l'écrit",
  "subtopic": "Comprendre et interpréter des textes littéraires",
  "is_cycle_wide": false,
  "chunk_text": "Au cycle 3, les élèves développent leurs capacités de compréhension de textes littéraires et documentaires. Ils apprennent à identifier les informations explicites et implicites, à analyser la structure des textes, et à interpréter les intentions de l'auteur...",
  "page_start": 12,
  "page_end": 14,
  "source_paragraph_id": "para_456",
  "doc_id": "abc123def456",
  "order_index": 1,
  "curriculum_version": "2020",
  "volet": "2",
  "lang": "fr"
}
```

---

## 🔹 5. Mistral OCR Integration

### OCR Client

**File:** `backend/assessment_pipeline/ingestion/ocr_client.py`

```python
"""
Mistral OCR Client for Local PDF Processing
"""

import os
import base64
from pathlib import Path
from typing import Dict, Any, Optional
from mistralai import Mistral


class MistralOCRClient:
    """Client for processing PDFs with Mistral OCR"""

    def __init__(self):
        self.api_key = os.getenv('MISTRAL_API_KEY')
        self.model = os.getenv('MISTRAL_MODEL', 'mistral-ocr-2505')

        if not self.api_key:
            raise ValueError("MISTRAL_API_KEY not found in environment")

        self.client = Mistral(api_key=self.api_key)

    def process_local_pdf(self, pdf_path: str) -> Optional[Dict[str, Any]]:
        """
        Process a local PDF file with Mistral OCR

        Args:
            pdf_path: Path to local PDF file

        Returns:
            OCR result with extracted text or None if failed
        """
        try:
            # Validate file exists
            if not Path(pdf_path).exists():
                print(f"❌ File not found: {pdf_path}")
                return None

            # Read PDF bytes
            with open(pdf_path, 'rb') as f:
                pdf_bytes = f.read()

            # Encode to base64
            pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')

            print(f"📄 Processing: {Path(pdf_path).name}")

            # Prepare document message
            document_message = {
                "type": "document_url",
                "document_url": f"data:application/pdf;base64,{pdf_base64}"
            }

            # Call Mistral OCR with structured prompt
            response = self.client.chat.complete(
                model=self.model,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            document_message,
                            {
                                "type": "text",
                                "text": self._get_extraction_prompt()
                            }
                        ]
                    }
                ]
            )

            if response and response.choices and len(response.choices) > 0:
                ocr_text = response.choices[0].message.content

                print(f"✅ Extracted {len(ocr_text)} characters")

                return {
                    "filename": Path(pdf_path).name,
                    "full_text": ocr_text,
                    "char_count": len(ocr_text)
                }
            else:
                print(f"❌ No response from Mistral OCR")
                return None

        except Exception as e:
            print(f"❌ Error processing {pdf_path}: {e}")
            return None

    def _get_extraction_prompt(self) -> str:
        """
        Get the structured extraction prompt for French curriculum PDFs
        """
        return """Extract all text from this French Ministry of Education curriculum PDF.

Requirements:
- Extract ALL text content
- Preserve document structure (headings, sections, paragraphs)
- Identify page numbers where possible
- Maintain formatting for lists and tables
- Detect Volet numbers (Volet 1, Volet 2, Volet 3)
- Identify section types:
  * Objectifs / Finalités
  * Compétences travaillées
  * Connaissances et compétences associées
  * Repères de progression
  * Situations d'apprentissage

Return the text organized by pages if page markers are present, otherwise return as continuous text with preserved structure."""

    def process_directory(self, pdf_directory: str) -> Dict[str, Any]:
        """
        Process all PDFs in a directory

        Args:
            pdf_directory: Path to directory containing PDFs

        Returns:
            Dictionary mapping filename to OCR results
        """
        results = {}

        pdf_dir = Path(pdf_directory)
        if not pdf_dir.exists():
            print(f"❌ Directory not found: {pdf_directory}")
            return results

        pdf_files = list(pdf_dir.glob("*.pdf"))

        if not pdf_files:
            print(f"❌ No PDF files found in {pdf_directory}")
            return results

        print(f"📚 Found {len(pdf_files)} PDF files")

        for i, pdf_file in enumerate(pdf_files, 1):
            print(f"\n[{i}/{len(pdf_files)}] Processing: {pdf_file.name}")

            result = self.process_local_pdf(str(pdf_file))
            if result:
                results[pdf_file.name] = result

        print(f"\n✅ Successfully processed {len(results)}/{len(pdf_files)} PDFs")

        return results
```

### Structured Extraction Prompt

The key prompt sent to Mistral OCR:

```
Extract all text from this French Ministry of Education curriculum PDF.

Requirements:
- Extract ALL text content
- Preserve document structure (headings, sections, paragraphs)
- Identify page numbers where possible
- Maintain formatting for lists and tables
- Detect Volet numbers (Volet 1, Volet 2, Volet 3)
- Identify section types:
  * Objectifs / Finalités
  * Compétences travaillées
  * Connaissances et compétences associées
  * Repères de progression
  * Situations d'apprentissage

Return the text organized by pages if page markers are present,
otherwise return as continuous text with preserved structure.
```

---

## 🔹 6. Supabase Database

### Database Schema

**File:** `backend/curriculum_chunks.sql`

```sql
-- Curriculum Chunks Table (NO STORAGE REFERENCES)
CREATE TABLE IF NOT EXISTS curriculum_chunks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Core Metadata (REQUIRED)
  cycle TEXT NOT NULL,                     -- '2', '3', '4'
  grades TEXT[] NOT NULL,                  -- ['CM1', 'CM2'] or ['5e', '4e', '3e']
  subject TEXT NOT NULL,                   -- 'Français', 'Mathématiques', etc.
  section_type TEXT NOT NULL,              -- 'objectives', 'competencies', 'progression'
  topic TEXT NOT NULL,                     -- Main topic
  is_cycle_wide BOOLEAN DEFAULT false,     -- Applies to entire cycle?
  chunk_text TEXT NOT NULL,                -- Actual curriculum content
  doc_id TEXT NOT NULL,                    -- Source document ID (hash)

  -- Extended Metadata (RECOMMENDED)
  subtopic TEXT,                           -- Subtopic if applicable
  page_start INTEGER NOT NULL,             -- Starting page
  page_end INTEGER NOT NULL,               -- Ending page
  source_paragraph_id TEXT,                -- Paragraph ID
  order_index INTEGER NOT NULL,            -- Sequential order

  -- Additional Metadata
  curriculum_version TEXT DEFAULT '2020',  -- Curriculum year
  volet TEXT,                              -- Volet 1/2/3
  lang TEXT DEFAULT 'fr',                  -- Language

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for Performance
CREATE INDEX idx_curriculum_chunks_subject ON curriculum_chunks(subject);
CREATE INDEX idx_curriculum_chunks_grades ON curriculum_chunks USING GIN(grades);
CREATE INDEX idx_curriculum_chunks_cycle ON curriculum_chunks(cycle);
CREATE INDEX idx_curriculum_chunks_topic ON curriculum_chunks(topic);
CREATE INDEX idx_curriculum_chunks_section_type ON curriculum_chunks(section_type);
CREATE INDEX idx_curriculum_chunks_cycle_wide ON curriculum_chunks(is_cycle_wide) WHERE is_cycle_wide = true;
CREATE INDEX idx_curriculum_chunks_volet ON curriculum_chunks(volet) WHERE volet IS NOT NULL;

-- Row Level Security
ALTER TABLE curriculum_chunks ENABLE ROW LEVEL SECURITY;

-- Teachers can read curriculum chunks
CREATE POLICY "Teachers can read curriculum chunks" ON curriculum_chunks
  FOR SELECT USING (auth.role() = 'authenticated');

-- Comments
COMMENT ON TABLE curriculum_chunks IS 'French curriculum content chunks (NO FILE STORAGE)';
COMMENT ON COLUMN curriculum_chunks.doc_id IS 'Hash of source PDF filename (local reference only)';
```

### Supabase Client

**File:** `backend/assessment_pipeline/ingestion/supabase_client.py`

```python
"""
Supabase Database Client for Curriculum Chunks
(NO STORAGE - DATABASE ONLY)
"""

import os
from typing import List, Dict, Any
from supabase import create_client, Client
from .schemas import CurriculumChunk


class SupabaseClient:
    """Client for inserting curriculum chunks into Supabase database"""

    def __init__(self):
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found")

        self.client: Client = create_client(supabase_url, supabase_key)
        self.table_name = 'curriculum_chunks'

    def insert_chunks(self, chunks: List[CurriculumChunk]) -> bool:
        """
        Insert curriculum chunks into Supabase database

        Args:
            chunks: List of CurriculumChunk objects

        Returns:
            True if successful, False otherwise
        """
        try:
            # Convert to dictionaries
            chunk_dicts = [chunk.dict(exclude_none=True) for chunk in chunks]

            # Batch insert (100 per batch)
            batch_size = 100
            successful_batches = 0

            for i in range(0, len(chunk_dicts), batch_size):
                batch = chunk_dicts[i:i + batch_size]

                response = self.client.table(self.table_name).insert(batch).execute()

                if response.data:
                    successful_batches += 1
                    print(f"✅ Inserted batch {successful_batches} ({len(batch)} chunks)")
                else:
                    print(f"❌ Failed to insert batch {i//batch_size + 1}")
                    return False

            print(f"🎉 Successfully inserted {len(chunks)} chunks into Supabase")
            return True

        except Exception as e:
            print(f"❌ Error inserting chunks: {e}")
            return False

    def get_table_stats(self) -> Dict[str, Any]:
        """Get statistics about curriculum_chunks table"""
        try:
            # Get total count
            total_response = self.client.table(self.table_name).select('id', count='exact').execute()
            total_count = total_response.count if hasattr(total_response, 'count') else 0

            # Get unique subjects
            subjects_response = self.client.table(self.table_name).select('subject').execute()
            subjects = list(set(row['subject'] for row in (subjects_response.data or [])))

            # Get unique cycles
            cycles_response = self.client.table(self.table_name).select('cycle').execute()
            cycles = list(set(row['cycle'] for row in (cycles_response.data or [])))

            return {
                'total_chunks': total_count,
                'subjects': subjects,
                'cycles': cycles
            }

        except Exception as e:
            print(f"❌ Error getting stats: {e}")
            return {'error': str(e)}
```

---

## 🔹 7. Ingestion Script

### Main Ingestion Script

**File:** `backend/assessment_pipeline/ingestion/ingest_curriculum.py`

```python
#!/usr/bin/env python3
"""
Curriculum PDF Ingestion Script (LOCAL PROCESSING ONLY)

This script:
1. Reads PDFs from local /pdfs folder
2. Sends each PDF to Mistral OCR
3. Parses response into structured JSON chunks
4. Validates chunks using Pydantic schema
5. Inserts chunks into Supabase curriculum_chunks table

NO SUPABASE STORAGE - ALL PROCESSING IS LOCAL
"""

import os
import sys
import hashlib
from pathlib import Path
from typing import List, Dict, Any
from dotenv import load_dotenv

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from ingestion.ocr_client import MistralOCRClient
from ingestion.parser import CurriculumParser
from ingestion.schemas import CurriculumChunk
from ingestion.supabase_client import SupabaseClient


def generate_doc_id(filename: str) -> str:
    """Generate unique document ID from filename"""
    return hashlib.md5(filename.encode()).hexdigest()[:16]


def main():
    """Main ingestion function"""

    print("=" * 70)
    print("CURRICULUM PDF INGESTION PIPELINE")
    print("Local Processing → Mistral OCR → Supabase Database")
    print("=" * 70)

    # Load environment variables
    load_dotenv('backend/.env')

    # Configuration
    PDF_FOLDER = "pdfs"  # Local PDF folder

    # Validate PDF folder exists
    if not Path(PDF_FOLDER).exists():
        print(f"\n❌ PDF folder not found: {PDF_FOLDER}")
        print(f"   Create folder and add curriculum PDFs:")
        print(f"   mkdir {PDF_FOLDER}")
        print(f"   # Then add your PDF files to {PDF_FOLDER}/")
        sys.exit(1)

    # Step 1: Initialize clients
    print("\n[1/4] Initializing clients...")
    try:
        ocr_client = MistralOCRClient()
        parser = CurriculumParser()
        supabase_client = SupabaseClient()
        print("✅ Clients initialized")
    except Exception as e:
        print(f"❌ Failed to initialize clients: {e}")
        sys.exit(1)

    # Step 2: Process PDFs with Mistral OCR
    print(f"\n[2/4] Processing PDFs from {PDF_FOLDER}/...")
    ocr_results = ocr_client.process_directory(PDF_FOLDER)

    if not ocr_results:
        print("❌ No PDFs were successfully processed")
        sys.exit(1)

    print(f"✅ OCR completed for {len(ocr_results)} PDFs")

    # Step 3: Parse OCR results into structured chunks
    print("\n[3/4] Parsing OCR results into structured chunks...")
    all_chunks: List[CurriculumChunk] = []

    for filename, ocr_result in ocr_results.items():
        print(f"\n📄 Parsing: {filename}")

        doc_id = generate_doc_id(filename)
        chunks = parser.parse_curriculum_text(
            text=ocr_result['full_text'],
            doc_id=doc_id,
            filename=filename
        )

        print(f"   Created {len(chunks)} chunks")
        all_chunks.extend(chunks)

    print(f"\n✅ Total chunks created: {len(all_chunks)}")

    if not all_chunks:
        print("❌ No valid chunks created")
        sys.exit(1)

    # Step 4: Insert chunks into Supabase
    print("\n[4/4] Inserting chunks into Supabase database...")
    success = supabase_client.insert_chunks(all_chunks)

    if not success:
        print("❌ Failed to insert chunks into database")
        sys.exit(1)

    # Final statistics
    print("\n" + "=" * 70)
    print("✅ INGESTION COMPLETE")
    print("=" * 70)

    stats = supabase_client.get_table_stats()
    print(f"\n📊 Database Statistics:")
    print(f"   Total chunks: {stats.get('total_chunks', 0)}")
    print(f"   Subjects: {', '.join(stats.get('subjects', []))}")
    print(f"   Cycles: {', '.join(stats.get('cycles', []))}")

    print("\n✅ Curriculum data is now ready in Supabase!")
    print(f"   Table: curriculum_chunks")
    print(f"   Rows: {len(all_chunks)} (just inserted)")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Ingestion interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
```

---

## 🔹 8. How to Run

### Prerequisites

1. **Install Dependencies:**
   ```bash
   pip install mistralai supabase pydantic python-dotenv
   ```

2. **Configure Environment:**
   Edit `backend/.env`:
   ```env
   MISTRAL_API_KEY=sk-your_actual_key
   MISTRAL_MODEL=mistral-ocr-2505
   SUPABASE_URL=https://yourproject.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJyour_actual_key
   ```

3. **Create Database Table:**
   Run `curriculum_chunks.sql` in Supabase SQL Editor

4. **Prepare PDFs:**
   ```bash
   mkdir pdfs
   # Copy all curriculum PDFs to pdfs/ folder
   ```

### Running the Ingestion

**Option 1: Direct Python**
```bash
cd E:\learnaura\aura-learn
python backend/assessment_pipeline/ingestion/ingest_curriculum.py
```

**Option 2: As Module**
```bash
cd E:\learnaura\aura-learn
python -m backend.assessment_pipeline.ingestion.ingest_curriculum
```

### Expected Output

```
======================================================================
CURRICULUM PDF INGESTION PIPELINE
Local Processing → Mistral OCR → Supabase Database
======================================================================

[1/4] Initializing clients...
✅ Clients initialized

[2/4] Processing PDFs from pdfs/...
📚 Found 12 PDF files

[1/12] Processing: cycle2_francais.pdf
📄 Processing: cycle2_francais.pdf
✅ Extracted 45823 characters

[2/12] Processing: cycle3_maths.pdf
📄 Processing: cycle3_maths.pdf
✅ Extracted 38291 characters

... (processing continues)

✅ OCR completed for 12 PDFs

[3/4] Parsing OCR results into structured chunks...

📄 Parsing: cycle2_francais.pdf
   Created 156 chunks

📄 Parsing: cycle3_maths.pdf
   Created 142 chunks

... (parsing continues)

✅ Total chunks created: 1247

[4/4] Inserting chunks into Supabase database...
✅ Inserted batch 1 (100 chunks)
✅ Inserted batch 2 (100 chunks)
... (inserting continues)
✅ Inserted batch 13 (47 chunks)

🎉 Successfully inserted 1247 chunks into Supabase

======================================================================
✅ INGESTION COMPLETE
======================================================================

📊 Database Statistics:
   Total chunks: 1247
   Subjects: Français, Mathématiques, Sciences et technologie, Histoire et géographie
   Cycles: 2, 3, 4

✅ Curriculum data is now ready in Supabase!
   Table: curriculum_chunks
   Rows: 1247 (just inserted)
```

---

## 🔹 9. Validation

### Validation Checklist

After running ingestion:

- [ ] No errors in console output
- [ ] All PDFs processed successfully
- [ ] Chunks created for each PDF
- [ ] All chunks inserted into Supabase
- [ ] Database stats show correct counts
- [ ] Can query chunks from Supabase

### Query Test

```python
from backend.assessment_pipeline.ingestion.supabase_client import SupabaseClient

client = SupabaseClient()

# Get all Français chunks for CM1/CM2
response = client.client.table('curriculum_chunks').select('*').eq('subject', 'Français').execute()

français_chunks = response.data
print(f"Found {len(français_chunks)} Français chunks")

# Print first chunk
if français_chunks:
    chunk = français_chunks[0]
    print(f"\nExample chunk:")
    print(f"  Topic: {chunk['topic']}")
    print(f"  Grades: {chunk['grades']}")
    print(f"  Text: {chunk['chunk_text'][:100]}...")
```

---

## 🎯 Final Confirmation

### ✅ What IS Implemented:

- ✅ Local PDF reading
- ✅ Mistral OCR processing
- ✅ Structured JSON generation
- ✅ Pydantic validation
- ✅ Supabase database insertion
- ✅ Complete metadata extraction

### ❌ What is NOT Implemented:

- ❌ Supabase Storage buckets
- ❌ PDF upload/download from cloud
- ❌ File storage management
- ❌ Question generation
- ❌ Retrieval logic
- ❌ Vector embeddings
- ❌ RAG pipeline

### Architecture Summary:

```
pdfs/              → Local PDF folder
  ↓
Mistral OCR API    → Text extraction
  ↓
Parser             → Structured JSON
  ↓
Validation         → Pydantic schema
  ↓
Supabase Database  → curriculum_chunks table
```

**Simplest possible pipeline. No cloud storage. No unnecessary complexity.**

---

**Document Version:** FINAL
**Date:** 2025-11-16
**Status:** ✅ Ready to Implement
