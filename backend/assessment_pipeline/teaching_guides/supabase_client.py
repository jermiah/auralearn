"""
Supabase Database Client for Teaching Guide Chunks
DATABASE ONLY - NO STORAGE
"""

import os
from typing import List, Dict, Any, Optional
from supabase import create_client, Client
from .schemas import TeachingGuideChunk


class SupabaseClient:
    """Client for inserting teaching guide chunks into Supabase database (NO STORAGE)"""

    def __init__(self):
        self.supabase: Client = create_client(
            supabase_url=os.getenv('SUPABASE_URL'),
            supabase_key=os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        )
        self.table_name = 'teaching_guides_chunks'

    def clear_table(self) -> bool:
        """
        Clear all data from the teaching_guides_chunks table
        
        Returns:
            True if successful, False if failed
        """
        try:
            print(f"   [WARNING] Clearing all data from {self.table_name} table...")
            
            # Delete all rows
            response = self.supabase.table(self.table_name).delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
            
            print(f"   [OK] Table {self.table_name} cleared successfully")
            return True
            
        except Exception as e:
            print(f"   [ERROR] Failed to clear table: {e}")
            return False

    def upsert_chunks(self, chunks: List[TeachingGuideChunk], clear_first: bool = True) -> bool:
        """
        Insert or update teaching guide chunks in the database

        Args:
            chunks: List of TeachingGuideChunk objects
            clear_first: If True, clear table before inserting (default: True)

        Returns:
            True if successful, False if failed
        """
        try:
            # Clear table first if requested
            if clear_first:
                if not self.clear_table():
                    print("   [WARNING] Failed to clear table, continuing with insert...")
            
            # Convert TeachingGuideChunk objects to dictionaries
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

            print(f"   Successfully inserted {len(chunks)} teaching guide chunks")
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
                if key == 'applicable_grades' and isinstance(value, list):
                    # Handle array contains filter
                    query = query.contains('applicable_grades', value)
                elif key == 'guide_type':
                    query = query.eq('guide_type', value)
                elif key == 'topic':
                    query = query.eq('topic', value)
                elif key == 'is_general':
                    query = query.eq('is_general', value)

            query = query.limit(limit)
            response = query.execute()

            return response.data if response.data else []

        except Exception as e:
            print(f"Error searching chunks: {e}")
            return []

    def get_chunks_by_topic_and_grades(self, topic: str, grades: List[str],
                                        limit: int = 50) -> List[Dict[str, Any]]:
        """
        Get chunks for specific topic and grades

        Args:
            topic: Topic name
            grades: List of grade levels
            limit: Maximum results

        Returns:
            List of matching chunks
        """
        filters = {
            'topic': topic,
            'applicable_grades': grades
        }
        return self.search_chunks(filters, limit)

    def get_general_chunks(self, guide_type: str, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Get general chunks for a guide type

        Args:
            guide_type: Guide type name
            limit: Maximum results

        Returns:
            List of general chunks
        """
        filters = {
            'guide_type': guide_type,
            'is_general': True
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
        Get statistics about the teaching_guides_chunks table

        Returns:
            Statistics dictionary
        """
        try:
            # Get total count
            total_response = self.supabase.table(self.table_name).select('id', count='exact').execute()
            total_count = total_response.count if hasattr(total_response, 'count') else len(total_response.data or [])

            # Get guide types
            types_response = self.supabase.table(self.table_name).select('guide_type').execute()
            guide_types = list(set(row['guide_type'] for row in types_response.data or []))

            # Get topics
            topics_response = self.supabase.table(self.table_name).select('topic').execute()
            topics = list(set(row['topic'] for row in topics_response.data or []))

            return {
                'total_chunks': total_count,
                'guide_types': guide_types,
                'topics': topics,
                'table_name': self.table_name
            }

        except Exception as e:
            print(f"Error getting table stats: {e}")
            return {'error': str(e)}


# Convenience functions
def save_teaching_guide_chunks(chunks: List[TeachingGuideChunk]) -> bool:
    """Save teaching guide chunks to Supabase database"""
    client = SupabaseClient()
    return client.upsert_chunks(chunks)


def get_teaching_guide_stats() -> Dict[str, Any]:
    """Get teaching guide database statistics"""
    client = SupabaseClient()
    return client.get_table_stats()


def search_teaching_guide_chunks(topic: str, grades: List[str]) -> List[Dict[str, Any]]:
    """Search teaching guide chunks by topic and grades"""
    client = SupabaseClient()
    return client.get_chunks_by_topic_and_grades(topic, grades)


if __name__ == "__main__":
    # Example usage
    print("Supabase Teaching Guide Service")

    # Get stats
    stats = get_teaching_guide_stats()
    print(f"Database stats: {stats}")

    # Example search
    if stats.get('total_chunks', 0) > 0:
        chunks = search_teaching_guide_chunks('Français', ['CM1', 'CM2'])
        print(f"Found {len(chunks)} chunks for Français CM1/CM2")
