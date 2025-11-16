#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Teaching Guide PDF Ingestion Script (LOCAL PROCESSING ONLY)

This script:
1. Reads PDFs from local pdfs/teaching_guides/ folder
2. Sends each PDF to Mistral OCR
3. Parses response into structured JSON chunks
4. Validates chunks using Pydantic schema
5. Inserts chunks into Supabase teaching_guides_chunks table

NO SUPABASE STORAGE - ALL PROCESSING IS LOCAL
"""

import os
import sys
import hashlib
from pathlib import Path
from typing import List, Dict, Any
from dotenv import load_dotenv

# Set UTF-8 encoding for console output on Windows
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# Add parent directories to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))
sys.path.insert(0, str(Path(__file__).parent.parent))

# Load environment variables
load_dotenv(Path(__file__).parent.parent.parent / '.env')

from assessment_pipeline.teaching_guides.ocr_client import MistralOCRClient
from assessment_pipeline.teaching_guides.parser import TeachingGuideChunker
from assessment_pipeline.teaching_guides.metadata import MetadataBuilder
from assessment_pipeline.teaching_guides.schemas import TeachingGuideChunk
from assessment_pipeline.teaching_guides.supabase_client import SupabaseClient


def generate_doc_id(filename: str) -> str:
    """Generate unique document ID from filename"""
    return hashlib.md5(filename.encode()).hexdigest()[:16]


def parse_ocr_to_chunks(ocr_result: Dict[str, Any]) -> List[TeachingGuideChunk]:
    """
    Parse OCR result into teaching guide chunks

    Args:
        ocr_result: OCR result with pages data

    Returns:
        List of validated TeachingGuideChunk objects
    """
    chunker = TeachingGuideChunker()
    metadata_builder = MetadataBuilder()

    # Extract doc_id from OCR result
    doc_id = ocr_result.get('doc_id', 'unknown')
    print(f"   [DEBUG] doc_id from OCR result: {doc_id}")
    print(f"   [DEBUG] Number of pages: {len(ocr_result.get('pages', []))}")

    # Extract chunks from pages
    chunks = chunker.chunk_document(ocr_result['pages'], doc_id=doc_id)
    print(f"   [DEBUG] Chunks created by chunker: {len(chunks)}")

    # Enrich and validate chunks
    valid_chunks = []
    for chunk in chunks:
        enriched = metadata_builder.enrich_chunk_metadata(chunk)
        if metadata_builder.validate_chunk(enriched):
            valid_chunks.append(enriched)

    return valid_chunks


def main():
    """Main ingestion function"""

    print("=" * 70)
    print("TEACHING GUIDE PDF INGESTION PIPELINE")
    print("Local Processing -> Mistral OCR -> Supabase Database")
    print("=" * 70)

    # Configuration
    PDF_FOLDER = Path("pdfs/teaching_guides")  # Local PDF folder for teaching guides

    # Validate PDF folder exists
    if not PDF_FOLDER.exists():
        print(f"\n[ERROR] PDF folder not found: {PDF_FOLDER.absolute()}")
        print(f"\n   Create folder and add teaching guide PDFs:")
        print(f"   mkdir -p pdfs/teaching_guides")
        print(f"   # Then add your teaching guide PDF files to pdfs/teaching_guides/")
        sys.exit(1)

    # Get list of PDFs
    pdf_files = list(PDF_FOLDER.glob("*.pdf"))
    if not pdf_files:
        print(f"\n[ERROR] No PDF files found in {PDF_FOLDER.absolute()}")
        print(f"   Add teaching guide PDF files to the pdfs/teaching_guides/ folder")
        sys.exit(1)

    print(f"\n[INFO] Found {len(pdf_files)} PDF files in {PDF_FOLDER.absolute()}")

    # Step 1: Initialize clients
    print("\n[1/4] Initializing clients...")
    try:
        ocr_client = MistralOCRClient()
        supabase_client = SupabaseClient()
        print("[OK] Clients initialized")
    except Exception as e:
        print(f"[ERROR] Failed to initialize clients: {e}")
        print(f"\n   Check your .env file:")
        print(f"   - MISTRAL_API_KEY")
        print(f"   - MISTRAL_MODEL")
        print(f"   - SUPABASE_URL")
        print(f"   - SUPABASE_SERVICE_ROLE_KEY")
        sys.exit(1)

    # Step 2: Process PDFs with Mistral OCR
    print(f"\n[2/4] Processing PDFs with Mistral OCR...")
    all_chunks: List[TeachingGuideChunk] = []

    for i, pdf_file in enumerate(pdf_files, 1):
        print(f"\n[{i}/{len(pdf_files)}] Processing: {pdf_file.name}")

        # OCR extraction
        ocr_result = ocr_client.extract_text_from_file(str(pdf_file))

        if not ocr_result:
            print(f"   [WARNING] Failed to extract text, skipping...")
            continue

        # Parse into chunks
        print(f"   [INFO] Parsing into chunks...")
        chunks = parse_ocr_to_chunks(ocr_result)

        print(f"   [OK] Created {len(chunks)} valid chunks")
        all_chunks.extend(chunks)

    print(f"\n[OK] Total chunks created: {len(all_chunks)}")

    if not all_chunks:
        print("[ERROR] No valid chunks created")
        sys.exit(1)

    # Step 3: Insert chunks into Supabase
    print("\n[3/4] Inserting chunks into Supabase database...")
    success = supabase_client.upsert_chunks(all_chunks)

    if not success:
        print("[ERROR] Failed to insert chunks into database")
        sys.exit(1)

    # Step 4: Final statistics
    print("\n[4/4] Getting database statistics...")
    stats = supabase_client.get_table_stats()

    print("\n" + "=" * 70)
    print("[SUCCESS] INGESTION COMPLETE")
    print("=" * 70)

    print(f"\n[STATS] Database Statistics:")
    print(f"   Total chunks: {stats.get('total_chunks', 0)}")
    print(f"   Guide types: {', '.join(stats.get('guide_types', []))}")
    print(f"   Topics: {', '.join(stats.get('topics', []))}")

    print(f"\n[SUCCESS] Teaching guide data is now ready in Supabase!")
    print(f"   Table: teaching_guides_chunks")
    print(f"   Rows inserted: {len(all_chunks)}")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n[WARNING] Ingestion interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n[FATAL] Fatal error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
