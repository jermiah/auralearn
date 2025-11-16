#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
import os
from pathlib import Path

# Set UTF-8 for Windows
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# Add to path
sys.path.insert(0, str(Path(__file__).parent))
sys.path.insert(0, str(Path(__file__).parent / 'backend'))
sys.path.insert(0, str(Path(__file__).parent / 'backend' / 'assessment_pipeline'))

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / 'backend' / '.env')

from backend.assessment_pipeline.ingestion.ocr_client import MistralOCRClient

def test_single_pdf():
    pdfs = list(Path("pdfs").glob("*.pdf"))
    if not pdfs:
        print("[ERROR] No PDFs found")
        return

    pdf_file = pdfs[0]
    print(f"[TEST] Testing with: {pdf_file.name}")

    client = MistralOCRClient()
    result = client.extract_text_from_file(str(pdf_file))

    if result:
        print(f"[SUCCESS] Got result!")
        print(f"  Doc ID: {result['doc_id']}")
        print(f"  Pages: {result['total_pages']}")
    else:
        print(f"[FAIL] No result")

if __name__ == "__main__":
    test_single_pdf()
