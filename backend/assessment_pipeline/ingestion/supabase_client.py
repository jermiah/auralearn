"""
Supabase Database Client for Curriculum Chunks
DATABASE ONLY - NO STORAGE
"""

import os
from typing import List, Dict, Any, Optional
from supabase import create_client, Client
from .schemas import CurriculumChunk


class SupabaseClient:
    """Client for inserting curriculum chunks into Supabase database (NO STORAGE)"""

    def __init__(self):
        self.supabase: Client = create_client(
            supabase_url=os.getenv('SUPABASE_URL'),
            supabase_key=os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        )
        self.table_name = 'curriculum_chunks'

    def create_curriculum_chunks_table(self) -> bool:
        """
        Create the curriculum_chunks table if it doesn't exist
        Note: This should ideally be done via SQL migration, but provided here for completeness

        Returns:
            True if table exists or was created, False on error
        """
        # Note: In production, use the SQL file curriculum_chunks.sql instead
        print("Note: Please run curriculum_chunks.sql in Supabase SQL Editor to create the table")
        return True

    def upsert_chunks(self, chunks: List[CurriculumChunk]) -> bool:
        """
        Insert or update curriculum chunks in the database

        Args:
            chunks: List of CurriculumChunk objects

        Returns:
            True if successful, False if failed
        """
        try:
            # Convert CurriculumChunk objects to dictionaries
            chunk_dicts = []
            for chunk in chunks:
                chunk_dict = chunk.dict(exclude_none=True)
                # Remove id field to let database auto-generate UUID
                if 'id' in chunk_dict:
                    del chunk_dict['id']
                chunk_dicts.append(chunk_dict)

            # Batch insert (not upsert since we don't have IDs)
            batch_size = 100  # Supabase limit
            successful_batches = 0

            for i in range(0, len(chunk_dicts), batch_size):
                batch = chunk_dicts[i:i + batch_size]

                response = self.supabase.table(self.table_name).insert(batch).execute()

                if response.data:
                    successful_batches += 1
                    print(f"   Inserted batch {successful_batches} ({len(batch)} chunks)")
                else:
                    print(f"   Failed to insert batch {i//batch_size + 1}")
                    return False

            print(f"   Successfully inserted {len(chunks)} curriculum chunks")
            return True

        except Exception as e:
            print(f"   Error inserting chunks: {e}")
            return False

    def get_chunk_by_id(self, chunk_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve a specific chunk by ID

        Args:
            chunk_id: The chunk ID

        Returns:
            Chunk data or None if not found
        """
        try:
            response = self.supabase.table(self.table_name).select('*').eq('id', chunk_id).single().execute()
            return response.data
        except Exception as e:
            print(f"Error retrieving chunk {chunk_id}: {e}")
            return None

    def search_chunks(self, filters: Dict[str, Any], limit: int = 100) -> List[Dict[str, Any]]:
        """
        Search chunks with filters

        Args:
            filters: Dictionary of filter conditions
            limit: Maximum number of results

        Returns:
            List of matching chunks
        """
        try:
            query = self.supabase.table(self.table_name).select('*')

            # Apply filters
            for key, value in filters.items():
                if key == 'grades' and isinstance(value, list):
                    # Handle array contains filter
                    query = query.contains('grades', value)
                elif key == 'subject':
                    query = query.eq('subject', value)
                elif key == 'cycle':
                    query = query.eq('cycle', value)
                elif key == 'is_cycle_wide':
                    query = query.eq('is_cycle_wide', value)

            query = query.limit(limit)
            response = query.execute()

            return response.data if response.data else []

        except Exception as e:
            print(f"Error searching chunks: {e}")
            return []

    def get_chunks_by_subject_and_grades(self, subject: str, grades: List[str],
                                        limit: int = 50) -> List[Dict[str, Any]]:
        """
        Get chunks for specific subject and grades

        Args:
            subject: Subject name
            grades: List of grade levels
            limit: Maximum results

        Returns:
            List of matching chunks
        """
        filters = {
            'subject': subject,
            'grades': grades
        }
        return self.search_chunks(filters, limit)

    def get_cycle_wide_chunks(self, subject: str, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Get cycle-wide chunks for a subject

        Args:
            subject: Subject name
            limit: Maximum results

        Returns:
            List of cycle-wide chunks
        """
        filters = {
            'subject': subject,
            'is_cycle_wide': True
        }
        return self.search_chunks(filters, limit)

    def delete_chunk(self, chunk_id: str) -> bool:
        """
        Delete a chunk by ID

        Args:
            chunk_id: The chunk ID to delete

        Returns:
            True if successful, False if failed
        """
        try:
            response = self.supabase.table(self.table_name).delete().eq('id', chunk_id).execute()

            if response.status_code == 200:
                print(f"Deleted chunk {chunk_id}")
                return True
            else:
                print(f"Failed to delete chunk {chunk_id}: {response.status_code}")
                return False

        except Exception as e:
            print(f"Error deleting chunk {chunk_id}: {e}")
            return False

    def get_table_stats(self) -> Dict[str, Any]:
        """
        Get statistics about the curriculum_chunks table

        Returns:
            Statistics dictionary
        """
        try:
            # Get total count
            total_response = self.supabase.table(self.table_name).select('id', count='exact').execute()
            total_count = total_response.count if hasattr(total_response, 'count') else len(total_response.data or [])

            # Get subjects
            subjects_response = self.supabase.table(self.table_name).select('subject').execute()
            subjects = list(set(row['subject'] for row in subjects_response.data or []))

            # Get cycles
            cycles_response = self.supabase.table(self.table_name).select('cycle').execute()
            cycles = list(set(row['cycle'] for row in cycles_response.data or []))

            return {
                'total_chunks': total_count,
                'subjects': subjects,
                'cycles': cycles,
                'table_name': self.table_name
            }

        except Exception as e:
            print(f"Error getting table stats: {e}")
            return {'error': str(e)}

    def validate_chunk_data(self, chunk: CurriculumChunk) -> bool:
        """
        Validate chunk data before insertion

        Args:
            chunk: The chunk to validate

        Returns:
            True if valid, False otherwise
        """
        try:
            # Required fields
            required_fields = [
                'id', 'cycle', 'subject', 'section_type', 'topic', 'subtopic',
                'chunk_text', 'page_start', 'page_end', 'source_paragraph_id', 'doc_id'
            ]

            for field in required_fields:
                value = getattr(chunk, field, None)
                if value is None or (isinstance(value, str) and not value.strip()):
                    print(f"Missing or empty required field: {field}")
                    return False

            # Validate grades
            if not chunk.is_cycle_wide and not chunk.grades:
                print("Chunk must have grades or be cycle-wide")
                return False

            # Validate page numbers
            if chunk.page_start > chunk.page_end:
                print("page_start cannot be greater than page_end")
                return False

            # Validate text length
            if len(chunk.chunk_text.strip()) < 50:
                print("Chunk text too short (minimum 50 characters)")
                return False

            return True

        except Exception as e:
            print(f"Error validating chunk: {e}")
            return False


# Convenience functions
def save_curriculum_chunks(chunks: List[CurriculumChunk]) -> bool:
    """Save curriculum chunks to Supabase database"""
    service = SupabaseDatabaseService()
    return service.upsert_chunks(chunks)


def get_curriculum_stats() -> Dict[str, Any]:
    """Get curriculum database statistics"""
    service = SupabaseDatabaseService()
    return service.get_table_stats()


def search_curriculum_chunks(subject: str, grades: List[str]) -> List[Dict[str, Any]]:
    """Search curriculum chunks by subject and grades"""
    service = SupabaseDatabaseService()
    return service.get_chunks_by_subject_and_grades(subject, grades)


if __name__ == "__main__":
    # Example usage
    print("Supabase Database Service")

    # Get stats
    stats = get_curriculum_stats()
    print(f"Database stats: {stats}")

    # Example search
    if stats.get('total_chunks', 0) > 0:
        chunks = search_curriculum_chunks('Français', ['CM1', 'CM2'])
        print(f"Found {len(chunks)} chunks for Français CM1/CM2")
