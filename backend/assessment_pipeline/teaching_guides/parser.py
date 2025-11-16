"""
Chunking System for Teaching Guide Documents
"""

import re
from typing import List, Dict, Any
from .schemas import TeachingGuideChunk


class TeachingGuideChunker:
    """Chunking system for teaching guide documents"""

    def __init__(self):
        # Teaching guide structure patterns
        self.chapter_patterns = [
            r'Chapitre\s+\d+',
            r'Chapter\s+\d+',
            r'Partie\s+\d+',
            r'Section\s+\d+'
        ]

        self.section_patterns = [
            r'Stratégies\s+pédagogiques',
            r"Objectifs\s+d['']apprentissage",
            r'Activités\s+proposées',
            r'Évaluation',
            r'Ressources',
            r'Conseils\s+pratiques',
            r'Différenciation',
            r'Progression'
        ]

        self.grade_patterns = [
            r'CM1', r'CM2', r'6e', r'5e', r'4e', r'3e',
            r'CE1', r'CE2', r'CP'
        ]

    def chunk_document(self, pages_data: List[Dict[str, Any]], doc_id: str = None) -> List[TeachingGuideChunk]:
        """
        Apply chunking to teaching guide document pages

        Args:
            pages_data: List of page dictionaries from ingestion
            doc_id: Document ID to use for all chunks

        Returns:
            List of TeachingGuideChunk objects
        """
        chunks = []

        # Level A: Split by chapters/major sections
        chapter_sections = self._level_a_chunking(pages_data, doc_id)

        for chapter_data in chapter_sections:
            # Level B: Split by pedagogical sections
            sub_sections = self._level_b_chunking(chapter_data)

            for sub_data in sub_sections:
                # Level C: Create 150-300 token chunks
                final_chunks = self._level_c_chunking(sub_data)

                for chunk_data in final_chunks:
                    chunk = self._create_chunk(chunk_data)
                    if chunk:
                        chunks.append(chunk)

        return chunks

    def _level_a_chunking(self, pages_data: List[Dict[str, Any]], doc_id: str = None) -> List[Dict[str, Any]]:
        """Level A: Split by chapters or major sections"""
        chapter_sections = []
        combined_text = self._combine_pages_text(pages_data)

        # Find chapter boundaries
        lines = combined_text.split('\n')
        chapter_boundaries = []

        for i, line in enumerate(lines):
            for pattern in self.chapter_patterns:
                if re.search(pattern, line, re.IGNORECASE):
                    chapter_boundaries.append((i, line.strip()))
                    break

        # If no chapters found, treat whole document as one section
        if not chapter_boundaries:
            chapter_sections.append({
                'topic': 'General',
                'text': combined_text,
                'pages': pages_data,
                'doc_id': doc_id,
                'line_start': 0,
                'line_end': len(lines)
            })
            return chapter_sections

        # Create sections for each chapter
        for i, (line_idx, chapter_name) in enumerate(chapter_boundaries):
            start_idx = line_idx
            end_idx = chapter_boundaries[i + 1][0] if i + 1 < len(chapter_boundaries) else len(lines)

            section_text = '\n'.join(lines[start_idx:end_idx])
            section_pages = self._get_pages_for_text_section(pages_data, start_idx, end_idx, lines)

            chapter_sections.append({
                'topic': chapter_name,
                'text': section_text,
                'pages': section_pages,
                'doc_id': doc_id,
                'line_start': start_idx,
                'line_end': end_idx
            })

        return chapter_sections

    def _level_b_chunking(self, chapter_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Level B: Split by pedagogical sections"""
        sub_sections = []
        lines = chapter_data['text'].split('\n')

        # Find section boundaries
        section_boundaries = []
        for i, line in enumerate(lines):
            for pattern in self.section_patterns:
                if re.search(pattern, line, re.IGNORECASE):
                    section_boundaries.append((i, line.strip()))
                    break

        # If no sections found, treat whole chapter as one section
        if not section_boundaries:
            sub_sections.append({
                **chapter_data,
                'section_header': 'General',
                'subtopic': chapter_data['topic']
            })
            return sub_sections

        # Create sections for each subsection
        for i, (line_idx, section_name) in enumerate(section_boundaries):
            start_idx = line_idx
            end_idx = section_boundaries[i + 1][0] if i + 1 < len(section_boundaries) else len(lines)

            section_text = '\n'.join(lines[start_idx:end_idx])

            sub_sections.append({
                **chapter_data,
                'section_header': section_name,
                'subtopic': section_name,
                'text': section_text,
                'line_start': start_idx,
                'line_end': end_idx
            })

        return sub_sections

    def _level_c_chunking(self, sub_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Level C: Create 150-300 token chunks"""
        chunks = []
        text = sub_data['text']

        # Split into sentences/paragraphs
        sentences = re.split(r'(?<=[.!?])\s+', text)

        current_chunk = ""
        current_tokens = 0
        target_min_tokens = 150
        target_max_tokens = 300

        for sentence in sentences:
            sentence_tokens = len(sentence.split())

            # Check if adding this sentence would exceed max tokens
            if current_tokens + sentence_tokens > target_max_tokens and current_tokens >= target_min_tokens:
                # Save current chunk
                chunks.append({
                    **sub_data,
                    'chunk_text': current_chunk.strip(),
                    'token_count': current_tokens
                })

                # Start new chunk
                current_chunk = sentence
                current_tokens = sentence_tokens
            else:
                current_chunk += " " + sentence
                current_tokens += sentence_tokens

        # Add remaining chunk if it has content
        if current_chunk.strip() and current_tokens >= 50:  # Minimum chunk size
            chunks.append({
                **sub_data,
                'chunk_text': current_chunk.strip(),
                'token_count': current_tokens
            })

        return chunks

    def _create_chunk(self, chunk_data: Dict[str, Any]) -> TeachingGuideChunk:
        """Create a TeachingGuideChunk object from chunk data"""
        try:
            # Extract metadata from chunk content and context
            metadata = self._extract_metadata(chunk_data)
            
            # Get doc_id from chunk_data
            doc_id = chunk_data.get('doc_id', 'unknown')

            chunk = TeachingGuideChunk(
                doc_id=doc_id,
                guide_type=metadata['guide_type'],
                applicable_grades=metadata['applicable_grades'],
                topic=metadata['topic'],
                subtopic=metadata['subtopic'],
                section_header=metadata['section_header'],
                chunk_text=chunk_data['chunk_text'],
                page_start=min(p['page_number'] for p in chunk_data['pages']),
                page_end=max(p['page_number'] for p in chunk_data['pages']),
                is_general=metadata['is_general'],
                lang="fr"
            )

            return chunk

        except Exception as e:
            print(f"Error creating chunk: {e}")
            import traceback
            traceback.print_exc()
            return None

    def _extract_metadata(self, chunk_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract metadata from chunk content and context"""
        text = chunk_data.get('chunk_text', '').lower()

        # Determine guide type from content
        guide_type = "pedagogical"
        if re.search(r'stratégie|méthode|approche', text, re.IGNORECASE):
            guide_type = "strategy"
        elif re.search(r'activité|exercice|pratique', text, re.IGNORECASE):
            guide_type = "activity"
        elif re.search(r'évaluation|test|contrôle', text, re.IGNORECASE):
            guide_type = "assessment"

        # Determine applicable grades
        applicable_grades = []
        for pattern in self.grade_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                applicable_grades.append(pattern.upper())

        is_general = len(applicable_grades) == 0

        # If no specific grades, mark as general
        if is_general:
            applicable_grades = ["CM1", "CM2", "6e"]  # Default to cycle 3

        # Topic and subtopic
        topic = chunk_data.get('topic', 'General')
        subtopic = chunk_data.get('subtopic', topic)
        
        # Section header
        section_header = chunk_data.get('section_header', 'General')

        return {
            'guide_type': guide_type,
            'applicable_grades': applicable_grades,
            'topic': topic,
            'subtopic': subtopic,
            'section_header': section_header,
            'is_general': is_general
        }

    def _combine_pages_text(self, pages_data: List[Dict[str, Any]]) -> str:
        """Combine text from multiple pages"""
        return '\n'.join(page['text'] for page in pages_data)

    def _get_pages_for_text_section(self, pages_data: List[Dict[str, Any]],
                                   start_line: int, end_line: int,
                                   all_lines: List[str]) -> List[Dict[str, Any]]:
        """Determine which pages a text section spans"""
        # This is a simplified implementation
        # In practice, you'd need to track line-to-page mapping
        return pages_data
