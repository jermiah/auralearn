"""
Metadata Construction Module for Teaching Guide Chunks
"""

import re
from typing import Dict, List, Any
from .schemas import TeachingGuideChunk


class MetadataBuilder:
    """Builds metadata for teaching guide chunks"""

    def __init__(self):
        # French grade mappings
        self.grade_mappings = {
            'cp': 'CP', 'ce1': 'CE1', 'ce2': 'CE2',
            'cm1': 'CM1', 'cm2': 'CM2',
            '6e': '6e', '5e': '5e', '4e': '4e', '3e': '3e'
        }

    def enrich_chunk_metadata(self, chunk: TeachingGuideChunk) -> TeachingGuideChunk:
        """
        Enrich a chunk with additional metadata

        Args:
            chunk: The chunk to enrich

        Returns:
            Enriched chunk (minimal enrichment for teaching guides)
        """
        # Teaching guides don't need much enrichment
        # Just return the chunk as-is
        return chunk

    def validate_chunk(self, chunk: TeachingGuideChunk) -> bool:
        """
        Validate that a chunk has all required metadata

        Args:
            chunk: The chunk to validate

        Returns:
            True if valid, False otherwise
        """
        required_fields = [
            'doc_id', 'guide_type', 'topic', 'subtopic',
            'section_header', 'chunk_text', 'page_start', 'page_end'
        ]

        # Check required fields are present and not empty
        for field in required_fields:
            value = getattr(chunk, field, None)
            if value is None or (isinstance(value, str) and not value.strip()):
                return False

        # Validate applicable_grades
        if not chunk.is_general and not chunk.applicable_grades:
            return False

        # Validate page numbers
        if chunk.page_start > chunk.page_end:
            return False

        # Validate chunk text length
        if len(chunk.chunk_text.strip()) < 50:
            return False

        return True

    def generate_unique_id(self, chunk: TeachingGuideChunk) -> str:
        """Generate a unique ID for the chunk"""
        import hashlib

        # Create a unique string from key metadata
        unique_string = f"{chunk.doc_id}_{chunk.guide_type}_{chunk.topic}_{chunk.page_start}"

        # Generate hash
        return hashlib.md5(unique_string.encode()).hexdigest()[:16]
