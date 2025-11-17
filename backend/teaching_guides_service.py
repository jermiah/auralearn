"""
Teaching Guides Service
Retrieves teaching guides from Supabase with category filtering
"""

import os
from supabase import create_client
from dotenv import load_dotenv
from typing import List, Dict, Any, Optional

load_dotenv()

supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))


def get_teaching_guides_for_student(student_id: str, subject: str = None, limit: int = 10):
    """
    Get teaching guides filtered by student's grade and learning categories
    
    Args:
        student_id: UUID of the student
        subject: Optional subject filter
        limit: Maximum number of guides to return
        
    Returns:
        List of teaching guide chunks with relevance scores
    """
    try:
        # Use the SQL function to get category-filtered guides
        result = supabase.rpc('get_teaching_guides_for_student', {
            'p_student_id': student_id,
            'p_subject': subject,
            'p_limit': limit
        }).execute()
        
        return result.data if result.data else []
    except Exception as e:
        print(f"Error fetching teaching guides for student: {e}")
        # Fallback to grade-based filtering
        return get_teaching_guides_by_grade(student_id, subject, limit)


def get_teaching_guides_by_grade(student_id: str, subject: str = None, limit: int = 10):
    """
    Fallback: Get teaching guides filtered by grade only (no category filtering)
    
    Args:
        student_id: UUID of the student
        subject: Optional subject filter
        limit: Maximum number of guides to return
        
    Returns:
        List of teaching guide chunks
    """
    try:
        # Get student's grade
        student_result = supabase.table('students').select('grade').eq('id', student_id).single().execute()
        
        if not student_result.data:
            return []
        
        grade = student_result.data['grade']
        
        # Query teaching guides
        query = supabase.table('teaching_guides_chunks').select('*')
        
        # Filter by grade
        query = query.contains('applicable_grades', [grade])
        
        # Filter by subject if provided
        if subject:
            query = query.ilike('topic', f'%{subject}%')
        
        # Order by creation date
        query = query.order('created_at', desc=True).limit(limit)
        
        result = query.execute()
        return result.data
    except Exception as e:
        print(f"Error fetching teaching guides by grade: {e}")
        return []


def get_teaching_guides(grade: str, subject: str = None, limit: int = 10):
    """
    Get teaching guides filtered by grade and optionally by subject (legacy function)
    
    Args:
        grade: Student grade level (CM1, CM2, 6e, etc.)
        subject: Optional subject filter
        limit: Maximum number of guides to return
        
    Returns:
        List of teaching guide chunks
    """
    try:
        query = supabase.table('teaching_guides_chunks').select('*')
        
        # Filter by grade
        query = query.contains('applicable_grades', [grade])
        
        # Filter by subject if provided
        if subject:
            query = query.ilike('topic', f'%{subject}%')
        
        # Order by creation date
        query = query.order('created_at', desc=True).limit(limit)
        
        result = query.execute()
        return result.data
    except Exception as e:
        print(f"Error fetching teaching guides: {e}")
        return []


def get_category_strategies(category: str, grade: str = None, limit: int = 5):
    """
    Get teaching strategies specific to a learning category
    
    Args:
        category: Learning category (visual_learner, slow_processing, etc.)
        grade: Optional grade filter
        limit: Maximum number of strategies to return
        
    Returns:
        List of teaching guide chunks for the category
    """
    try:
        result = supabase.rpc('get_category_strategies', {
            'p_category': category,
            'p_grade': grade,
            'p_limit': limit
        }).execute()
        
        return result.data if result.data else []
    except Exception as e:
        print(f"Error fetching category strategies: {e}")
        return []


def get_student_categories(student_id: str):
    """
    Get student's learning categories and scores
    
    Args:
        student_id: UUID of the student
        
    Returns:
        Dict with primary_category, secondary_category, and category_scores
    """
    try:
        result = supabase.table('students').select(
            'primary_category, secondary_category, category_scores'
        ).eq('id', student_id).single().execute()
        
        return result.data if result.data else {}
    except Exception as e:
        print(f"Error fetching student categories: {e}")
        return {}


def tag_existing_guides():
    """
    Tag all existing teaching guides with categories
    
    Returns:
        Number of guides tagged
    """
    try:
        result = supabase.rpc('tag_existing_teaching_guides').execute()
        
        if result.data:
            return len(result.data)
        return 0
    except Exception as e:
        print(f"Error tagging existing guides: {e}")
        return 0


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "tag":
            print("Tagging existing teaching guides with categories...")
            count = tag_existing_guides()
            print(f"Tagged {count} guides")
        
        elif command == "test" and len(sys.argv) > 2:
            student_id = sys.argv[2]
            print(f"Testing category-filtered guides for student: {student_id}")
            guides = get_teaching_guides_for_student(student_id)
            print(f"Found {len(guides)} guides")
            for guide in guides[:3]:
                print(f"  - {guide.get('section_header')} (categories: {guide.get('applicable_categories')})")
    else:
        print("Usage:")
        print("  python teaching_guides_service.py tag")
        print("  python teaching_guides_service.py test <student_id>")
