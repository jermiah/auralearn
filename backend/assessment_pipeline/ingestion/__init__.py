"""
Curriculum PDF Ingestion Module

This module handles the ingestion of French curriculum PDFs:
- OCR processing with Mistral API (local files only)
- Structured JSON extraction
- Validation with Pydantic
- Database insertion to Supabase

NO CLOUD STORAGE - ALL LOCAL PROCESSING
"""

from .schemas import CurriculumChunk
from .ocr_client import MistralOCRClient
from .supabase_client import SupabaseClient

__all__ = ['CurriculumChunk', 'MistralOCRClient', 'SupabaseClient']
