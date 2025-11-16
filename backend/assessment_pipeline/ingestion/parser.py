"""
Three-Level Chunking System for French Curriculum Documents
"""

import re
from typing import List, Dict, Any, Tuple
from .schemas import CurriculumChunk


class CurriculumChunker:
    """Three-level chunking system for curriculum documents"""

    def __init__(self):
        # French curriculum structure patterns
        self.cycle_patterns = [
            r'Cycle\s*[1234]',
            r'cycle\s*[1234]'
        ]

        self.subject_patterns = [
            r'Volet\s*[123]',
            r'Français',
            r'Mathématiques',
            r'Sciences\s+et\s+technologie',
            r'Histoire\s+et\s+géographie',
            r'Enseignement\s+moral\s+et\s+civique',
            r'Éducation\s+artistique',
            r'Langues\s+vivantes',
            r'Éducation\s+physique\s+et\s+sportive'
        ]

        self.section_patterns = [
            r'Objectifs\s*/\s*finalités',
            r'Compétences\s+travaillées',
            r'Connaissances\s+et\s+compétences\s+associées',
            r'Repères\s+de\s+progression',
            r"Situations\s+d['']?apprentissage"
        ]

    def chunk_document(self, pages_data: List[Dict[str, Any]], doc_id: str = None) -> List[CurriculumChunk]:
        """
        Apply three-level chunking to document pages

        Args:
            pages_data: List of page dictionaries from ingestion
            doc_id: Document ID to use for all chunks

        Returns:
            List of CurriculumChunk objects
        """
        chunks = []

        # Level A: Split by subject headings
        subject_sections = self._level_a_chunking(pages_data, doc_id)

        for subject_data in subject_sections:
            # Level B: Split by subheadings within subjects
            sub_sections = self._level_b_chunking(subject_data)

            for sub_data in sub_sections:
                # Level C: Create 150-300 token chunks
                final_chunks = self._level_c_chunking(sub_data)

                for chunk_data in final_chunks:
                    chunk = self._create_chunk(chunk_data)
                    if chunk:
                        chunks.append(chunk)

        return chunks

    def _level_a_chunking(self, pages_data: List[Dict[str, Any]], doc_id: str = None) -> List[Dict[str, Any]]:
        """Level A: Split by subject headings (Volet 1, Volet 2, Volet 3, subject names)"""
        subject_sections = []
        current_subject = None
        current_pages = []

        combined_text = self._combine_pages_text(pages_data)

        # Find subject boundaries
        lines = combined_text.split('\n')
        subject_boundaries = []

        for i, line in enumerate(lines):
            for pattern in self.subject_patterns:
                if re.search(pattern, line, re.IGNORECASE):
                    subject_boundaries.append((i, line.strip()))
                    break

        # Create sections for each subject
        for i, (line_idx, subject_name) in enumerate(subject_boundaries):
            start_idx = line_idx
            end_idx = subject_boundaries[i + 1][0] if i + 1 < len(subject_boundaries) else len(lines)

            section_text = '\n'.join(lines[start_idx:end_idx])
            section_pages = self._get_pages_for_text_section(pages_data, start_idx, end_idx, lines)

            subject_sections.append({
                'subject': subject_name,
                'text': section_text,
                'pages': section_pages,
                'doc_id': doc_id,
                'line_start': start_idx,
                'line_end': end_idx
            })

        return subject_sections

    def _level_b_chunking(self, subject_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Level B: Split by subheadings within subjects"""
        sub_sections = []
        lines = subject_data['text'].split('\n')

        # Find section boundaries
        section_boundaries = []
        for i, line in enumerate(lines):
            for pattern in self.section_patterns:
                if re.search(pattern, line, re.IGNORECASE):
                    section_boundaries.append((i, line.strip()))
                    break

        # If no sections found, treat whole subject as one section
        if not section_boundaries:
            sub_sections.append({
                **subject_data,
                'section_type': 'general',
                'topic': subject_data['subject']
            })
            return sub_sections

        # Create sections for each subsection
        for i, (line_idx, section_name) in enumerate(section_boundaries):
            start_idx = line_idx
            end_idx = section_boundaries[i + 1][0] if i + 1 < len(section_boundaries) else len(lines)

            section_text = '\n'.join(lines[start_idx:end_idx])

            sub_sections.append({
                **subject_data,
                'section_type': section_name,
                'topic': section_name,
                'text': section_text,
                'line_start': start_idx,
                'line_end': end_idx
            })

        return sub_sections

    def _level_c_chunking(self, sub_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Level C: Create 150-300 token chunks, don't break lists"""
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

    def _create_chunk(self, chunk_data: Dict[str, Any]) -> CurriculumChunk:
        """Create a CurriculumChunk object from chunk data"""
        try:
            # Extract metadata from chunk content and context
            metadata = self._extract_metadata(chunk_data)
            
            # Get doc_id from chunk_data
            doc_id = chunk_data.get('doc_id', 'unknown')

            chunk = CurriculumChunk(
                cycle=metadata['cycle'],
                grades=metadata['grades'],
                subject=metadata['subject'],
                section_type=metadata['section_type'],
                topic=metadata['topic'],
                subtopic=metadata['subtopic'],
                is_cycle_wide=metadata['is_cycle_wide'],
                chunk_text=chunk_data['chunk_text'],
                page_start=min(p['page_number'] for p in chunk_data['pages']),
                page_end=max(p['page_number'] for p in chunk_data['pages']),
                source_paragraph_id=f"{metadata['subject']}_{metadata['topic']}_{chunk_data.get('line_start', 0)}",
                doc_id=doc_id,
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

        # Determine cycle
        cycle = "3"  # Default to cycle 3 based on PDF names
        for pattern in self.cycle_patterns:
            match = re.search(pattern, text)
            if match:
                cycle = re.findall(r'\d+', match.group())[0]
                break

        # Determine subject
        subject = chunk_data.get('subject', 'General')

        # Determine grades
        grades = []
        grade_patterns = [r'CM1', r'CM2', r'6e', r'5e', r'4e', r'3e']
        for pattern in grade_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                grades.append(pattern.upper())

        is_cycle_wide = len(grades) == 0

        # If no specific grades, assume cycle-wide
        if is_cycle_wide:
            if cycle == "3":
                grades = ["CM1", "CM2", "6e"]
            elif cycle == "2":
                grades = ["CE1", "CE2", "CM1", "CM2"]

        # Section type
        section_type = chunk_data.get('section_type', 'general')

        # Topic and subtopic
        topic = chunk_data.get('topic', subject)
        subtopic = topic  # For now, subtopic = topic

        return {
            'cycle': cycle,
            'grades': grades,
            'subject': subject,
            'section_type': section_type,
            'topic': topic,
            'subtopic': subtopic,
            'is_cycle_wide': is_cycle_wide
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
