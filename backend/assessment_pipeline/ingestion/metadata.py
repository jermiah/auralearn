"""
Metadata Construction Module for Curriculum Chunks
"""

import re
from typing import Dict, List, Any
from .schemas import CurriculumChunk


class MetadataBuilder:
    """Builds rich metadata for curriculum chunks"""

    def __init__(self):
        # French grade mappings
        self.grade_mappings = {
            'cp': 'CP', 'ce1': 'CE1', 'ce2': 'CE2',
            'cm1': 'CM1', 'cm2': 'CM2',
            '6e': '6e', '5e': '5e', '4e': '4e', '3e': '3e'
        }

        # Subject mappings
        self.subject_mappings = {
            'français': 'Français',
            'francais': 'Français',
            'mathématiques': 'Mathématiques',
            'mathematiques': 'Mathématiques',
            'sciences et technologie': 'Sciences et technologie',
            'histoire et géographie': 'Histoire et géographie',
            'enseignement moral et civique': 'Enseignement moral et civique',
            'éducation artistique': 'Éducation artistique',
            'langues vivantes': 'Langues vivantes',
            'éducation physique et sportive': 'Éducation physique et sportive'
        }

        # Section type mappings
        self.section_type_mappings = {
            'objectifs': 'objectives',
            'finalités': 'objectives',
            'compétences': 'competencies',
            'connaissances': 'knowledge',
            'repères de progression': 'progression',
            'situations d\'apprentissage': 'learning_situations',
            'volet': 'subject_area'
        }

    def enrich_chunk_metadata(self, chunk: CurriculumChunk) -> CurriculumChunk:
        """
        Enrich a chunk with additional metadata

        Args:
            chunk: The chunk to enrich

        Returns:
            Enriched chunk with additional metadata
        """
        # Extract additional metadata from text content
        additional_metadata = self._extract_from_text(chunk.chunk_text)

        # Update chunk with enriched metadata
        enriched_chunk = chunk.copy()

        # Update grades if more specific info found
        if additional_metadata.get('grades'):
            enriched_chunk.grades = list(set(enriched_chunk.grades + additional_metadata['grades']))

        # Update cycle if detected
        if additional_metadata.get('cycle'):
            enriched_chunk.cycle = additional_metadata['cycle']

        # Update subject if more specific
        if additional_metadata.get('subject'):
            enriched_chunk.subject = additional_metadata['subject']

        # Update section type
        if additional_metadata.get('section_type'):
            enriched_chunk.section_type = additional_metadata['section_type']

        # Update topic and subtopic
        if additional_metadata.get('topic'):
            enriched_chunk.topic = additional_metadata['topic']
        if additional_metadata.get('subtopic'):
            enriched_chunk.subtopic = additional_metadata['subtopic']

        # Update cycle-wide flag
        enriched_chunk.is_cycle_wide = len(enriched_chunk.grades) == 0 or additional_metadata.get('is_cycle_wide', False)

        return enriched_chunk

    def _extract_from_text(self, text: str) -> Dict[str, Any]:
        """Extract metadata from chunk text content"""
        text_lower = text.lower()
        metadata = {}

        # Extract cycle information
        cycle_match = re.search(r'cycle\s*([1234])', text_lower)
        if cycle_match:
            metadata['cycle'] = cycle_match.group(1)

        # Extract grade information
        found_grades = []
        for grade_key, grade_value in self.grade_mappings.items():
            if grade_key in text_lower:
                found_grades.append(grade_value)

        if found_grades:
            metadata['grades'] = found_grades

        # Extract subject information
        for subject_key, subject_value in self.subject_mappings.items():
            if subject_key in text_lower:
                metadata['subject'] = subject_value
                break

        # Extract section type
        for section_key, section_value in self.section_type_mappings.items():
            if section_key in text_lower:
                metadata['section_type'] = section_value
                break

        # Extract topic information (look for headings)
        topic_patterns = [
            r'^([A-Z][^.!?\n]*?)(?=\n|$)',  # Lines starting with capital letters
            r'([A-Z][^.!?\n]*?:)',  # Lines ending with colon
        ]

        for pattern in topic_patterns:
            matches = re.findall(pattern, text, re.MULTILINE)
            if matches:
                # Take the first meaningful topic
                for match in matches:
                    clean_topic = match.strip().strip(':')
                    if len(clean_topic) > 10 and len(clean_topic) < 100:
                        metadata['topic'] = clean_topic
                        break
                if 'topic' in metadata:
                    break

        # Determine if cycle-wide
        cycle_wide_indicators = ['tout le cycle', 'cycle entier', 'tous niveaux']
        metadata['is_cycle_wide'] = any(indicator in text_lower for indicator in cycle_wide_indicators)

        return metadata

    def validate_chunk(self, chunk: CurriculumChunk) -> bool:
        """
        Validate that a chunk has all required metadata

        Args:
            chunk: The chunk to validate

        Returns:
            True if valid, False otherwise
        """
        required_fields = [
            'cycle', 'subject', 'section_type', 'topic', 'subtopic',
            'chunk_text', 'page_start', 'page_end', 'source_paragraph_id'
        ]

        # Check required fields are present and not empty
        for field in required_fields:
            value = getattr(chunk, field, None)
            if value is None or (isinstance(value, str) and not value.strip()):
                return False

        # Validate grades
        if not chunk.is_cycle_wide and not chunk.grades:
            return False

        # Validate page numbers
        if chunk.page_start > chunk.page_end:
            return False

        return True

    def generate_unique_id(self, chunk: CurriculumChunk) -> str:
        """Generate a unique ID for the chunk"""
        import hashlib

        # Create a unique string from key metadata
        unique_string = f"{chunk.doc_id}_{chunk.subject}_{chunk.topic}_{chunk.page_start}_{chunk.source_paragraph_id}"

        # Generate hash
        return hashlib.md5(unique_string.encode()).hexdigest()[:16]

    def add_embeddings_metadata(self, chunk: CurriculumChunk, embedding: List[float]) -> Dict[str, Any]:
        """
        Prepare chunk data for vector database storage

        Args:
            chunk: The curriculum chunk
            embedding: The embedding vector

        Returns:
            Dictionary ready for vector database insertion
        """
        return {
            'id': chunk.id,
            'vector': embedding,
            'payload': {
                'doc_id': chunk.doc_id,
                'cycle': chunk.cycle,
                'grades': chunk.grades,
                'subject': chunk.subject,
                'section_type': chunk.section_type,
                'topic': chunk.topic,
                'subtopic': chunk.subtopic,
                'is_cycle_wide': chunk.is_cycle_wide,
                'page_start': chunk.page_start,
                'page_end': chunk.page_end,
                'lang': chunk.lang,
                'source_paragraph_id': chunk.source_paragraph_id,
                'chunk_text': chunk.chunk_text
            }
        }
