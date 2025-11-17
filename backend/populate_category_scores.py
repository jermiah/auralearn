"""
Populate category_scores for students based on their cognitive assessments
This calculates real scores (0-100) from cognitive domain scores (1-5)
Uses the SQL function calculate_category_scores_from_cognitive()
"""

import os
import sys
import argparse
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

def calculate_category_scores_from_cognitive(student_id):
    """
    Calculate category scores from cognitive assessment using SQL function
    Returns dict with 8 category scores (0-100)
    """
    try:
        # Call the SQL function via RPC
        result = supabase.rpc('calculate_category_scores_from_cognitive', {
            'p_student_id': student_id
        }).execute()
        
        if result.data:
            return result.data
        return None
    except Exception as e:
        print(f"  [ERROR] Failed to calculate scores: {e}")
        return None

def get_cognitive_assessment(student_id):
    """Get latest cognitive assessment for student"""
    try:
        result = supabase.table('cognitive_assessment_results')\
            .select('domain_scores, calculated_at')\
            .eq('student_id', student_id)\
            .order('calculated_at', desc=True)\
            .limit(1)\
            .execute()
        
        if result.data and len(result.data) > 0:
            return result.data[0]
        return None
    except Exception as e:
        print(f"  [ERROR] Failed to get cognitive assessment: {e}")
        return None

def main():
    parser = argparse.ArgumentParser(description='Populate student category scores from cognitive assessments')
    parser.add_argument('--force', action='store_true', help='Recalculate even if category_scores already exists')
    parser.add_argument('--student-id', type=str, help='Process only specific student ID')
    args = parser.parse_args()

    # Get all students or specific student
    if args.student_id:
        students_result = supabase.table('students').select('*').eq('id', args.student_id).execute()
    else:
        students_result = supabase.table('students').select('*').execute()

    students = students_result.data
    print(f"\n{'='*70}")
    print(f"CATEGORY SCORE POPULATION FROM COGNITIVE ASSESSMENTS")
    print(f"{'='*70}\n")
    print(f"Found {len(students)} students")
    print(f"Force recalculate: {args.force}\n")

    updated_count = 0
    skipped_count = 0
    no_assessment_count = 0

    for student in students:
        student_id = student['id']
        student_name = student['name']
        primary_category = student.get('primary_category')

        print(f"[{updated_count + skipped_count + no_assessment_count + 1}/{len(students)}] {student_name}")

        # Skip if already has category_scores and not forcing
        if student.get('category_scores') and not args.force:
            print(f"  [SKIP] Already has category scores (use --force to recalculate)")
            skipped_count += 1
            continue

        # Check if student has cognitive assessment
        cognitive_assessment = get_cognitive_assessment(student_id)
        
        if not cognitive_assessment:
            print(f"  [WARN] No cognitive assessment found - using balanced profile")
            # Use balanced profile (50 for all categories)
            category_scores = {
                'slow_processing': 50,
                'fast_processor': 50,
                'high_energy': 50,
                'visual_learner': 50,
                'logical_learner': 50,
                'sensitive_low_confidence': 50,
                'easily_distracted': 50,
                'needs_repetition': 50
            }
            no_assessment_count += 1
        else:
            print(f"  [INFO] Found cognitive assessment from {cognitive_assessment['calculated_at']}")
            print(f"  [INFO] Domain scores: {cognitive_assessment['domain_scores']}")
            
            # Calculate category scores from cognitive assessment
            category_scores = calculate_category_scores_from_cognitive(student_id)
            
            if not category_scores:
                print(f"  [ERROR] Failed to calculate category scores")
                continue

        # Determine primary and secondary categories (highest scores)
        sorted_categories = sorted(category_scores.items(), key=lambda x: x[1], reverse=True)
        new_primary = sorted_categories[0][0]
        new_secondary = sorted_categories[1][0] if len(sorted_categories) > 1 else None

        # Update student
        update_data = {
            'category_scores': category_scores,
            'primary_category': new_primary,
        }
        if new_secondary:
            update_data['secondary_category'] = new_secondary

        supabase.table('students').update(update_data).eq('id', student_id).execute()

        updated_count += 1
        print(f"  [OK] Updated category scores")
        print(f"  [OK] Primary: {primary_category} → {new_primary}")
        if new_secondary:
            print(f"  [OK] Secondary: {new_secondary}")
        print(f"  [OK] Scores: {category_scores}\n")

    print(f"\n{'='*70}")
    print(f"SUMMARY")
    print(f"{'='*70}")
    print(f"Total students: {len(students)}")
    print(f"Updated: {updated_count}")
    print(f"Skipped (already had scores): {skipped_count}")
    print(f"No cognitive assessment: {no_assessment_count}")
    print(f"\n[SUCCESS] Category score population complete!")

if __name__ == '__main__':
    main()
