"""
Populate category_scores for students based on COMBINED assessments
This calculates real scores (0-100) from:
  - Cognitive assessment (60% weight) - HOW they learn
  - Academic assessment (40% weight) - WHAT they struggle with
Uses the SQL function calculate_combined_category_scores()

Students can belong to MULTIPLE buckets if they score >= 60 in multiple categories
"""

import os
import sys
import argparse
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

def calculate_combined_category_scores(student_id):
    """
    Calculate COMBINED category scores (cognitive + academic) using SQL function
    Returns dict with 8 category scores (0-100)
    """
    try:
        # Call the combined SQL function via RPC
        result = supabase.rpc('calculate_combined_category_scores', {
            'p_student_id': student_id
        }).execute()

        if result.data:
            return result.data
        return None
    except Exception as e:
        print(f"  [ERROR] Failed to calculate combined scores: {e}")
        return None

def get_student_buckets(student_id, threshold=60):
    """
    Get all category buckets where student scores >= threshold
    Returns array of category names
    """
    try:
        result = supabase.rpc('get_student_buckets', {
            'p_student_id': student_id,
            'p_threshold': threshold
        }).execute()

        if result.data:
            return result.data
        return []
    except Exception as e:
        print(f"  [ERROR] Failed to get buckets: {e}")
        return []

def get_assessment_status(student_id):
    """Check which assessments exist for student"""
    cognitive = None
    academic = None

    try:
        cog_result = supabase.table('cognitive_assessment_results')\
            .select('domain_scores, calculated_at')\
            .eq('student_id', student_id)\
            .order('calculated_at', desc=True)\
            .limit(1)\
            .execute()

        if cog_result.data and len(cog_result.data) > 0:
            cognitive = cog_result.data[0]
    except Exception as e:
        pass

    try:
        acad_result = supabase.table('student_assessments')\
            .select('score, total_questions, time_taken, assessment_date')\
            .eq('student_id', student_id)\
            .order('assessment_date', desc=True)\
            .limit(1)\
            .execute()

        if acad_result.data and len(acad_result.data) > 0:
            academic = acad_result.data[0]
    except Exception as e:
        pass

    return cognitive, academic

def main():
    parser = argparse.ArgumentParser(description='Populate student category scores from COMBINED assessments (cognitive + academic)')
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
    print(f"COMBINED CATEGORY SCORE POPULATION")
    print(f"Cognitive (60%) + Academic (40%) Assessments")
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

        # Check which assessments exist for student
        cognitive_assessment, academic_assessment = get_assessment_status(student_id)

        if not cognitive_assessment and not academic_assessment:
            print(f"  [WARN] No assessments found - using balanced profile")
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
            # Show assessment status
            if cognitive_assessment:
                print(f"  [COGNITIVE] Found assessment from {cognitive_assessment['calculated_at']}")
                print(f"  [COGNITIVE] Domain scores: {cognitive_assessment['domain_scores']}")
            if academic_assessment:
                score_pct = (academic_assessment['score'] / academic_assessment['total_questions']) * 100
                print(f"  [ACADEMIC] Found assessment from {academic_assessment['assessment_date']}")
                print(f"  [ACADEMIC] Score: {academic_assessment['score']}/{academic_assessment['total_questions']} ({score_pct:.1f}%), Time: {academic_assessment['time_taken']}s")

            # Calculate COMBINED category scores (cognitive + academic)
            category_scores = calculate_combined_category_scores(student_id)

            if not category_scores:
                print(f"  [ERROR] Failed to calculate combined category scores")
                continue

            # Get all buckets (categories >= 60)
            buckets = get_student_buckets(student_id, threshold=60)
            if buckets:
                print(f"  [BUCKETS] Student belongs to {len(buckets)} bucket(s): {', '.join(buckets)}")

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
        print(f"  [OK] Primary: {primary_category} -> {new_primary}")
        if new_secondary:
            print(f"  [OK] Secondary: {new_secondary}")
        print(f"  [OK] Scores: {category_scores}\n")

    print(f"\n{'='*70}")
    print(f"SUMMARY - COMBINED SCORING SYSTEM")
    print(f"{'='*70}")
    print(f"Total students: {len(students)}")
    print(f"Updated: {updated_count}")
    print(f"Skipped (already had scores): {skipped_count}")
    print(f"No assessments: {no_assessment_count}")
    print(f"\n[SUCCESS] Combined category score population complete!")
    print(f"\nNOTE: Students can belong to MULTIPLE buckets if they score >= 60 in multiple categories")
    print(f"      Category scores combine cognitive (60%) + academic (40%) assessments")

if __name__ == '__main__':
    main()
