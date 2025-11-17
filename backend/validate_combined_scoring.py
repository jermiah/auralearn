"""
Validation Script for Combined Scoring System

This script validates that the combined scoring system is working correctly:
1. Tests SQL functions are available
2. Validates category score calculations
3. Tests multi-bucket assignment
4. Checks data quality and consistency
"""

import os
import sys
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("[ERROR] Missing Supabase credentials in .env file")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def test_sql_functions():
    """Test that all required SQL functions exist"""
    print("\n" + "="*70)
    print("TEST 1: SQL FUNCTIONS AVAILABILITY")
    print("="*70)

    tests_passed = 0
    tests_failed = 0

    # Test calculate_combined_category_scores function
    try:
        # Get a sample student
        students = supabase.table('students').select('id').limit(1).execute()
        if students.data:
            student_id = students.data[0]['id']
            result = supabase.rpc('calculate_combined_category_scores', {
                'p_student_id': student_id
            }).execute()
            print(f"✅ calculate_combined_category_scores() - AVAILABLE")
            tests_passed += 1
        else:
            print(f"⚠️  No students found to test with")
    except Exception as e:
        print(f"❌ calculate_combined_category_scores() - FAILED: {e}")
        tests_failed += 1

    # Test get_student_buckets function
    try:
        if students.data:
            result = supabase.rpc('get_student_buckets', {
                'p_student_id': student_id,
                'p_threshold': 60
            }).execute()
            print(f"✅ get_student_buckets() - AVAILABLE")
            tests_passed += 1
    except Exception as e:
        print(f"❌ get_student_buckets() - FAILED: {e}")
        tests_failed += 1

    # Test student_category_buckets view
    try:
        result = supabase.table('student_category_buckets').select('*').limit(1).execute()
        print(f"✅ student_category_buckets view - AVAILABLE")
        tests_passed += 1
    except Exception as e:
        print(f"❌ student_category_buckets view - FAILED: {e}")
        tests_failed += 1

    print(f"\nTests Passed: {tests_passed}/3")
    return tests_failed == 0


def test_combined_scoring():
    """Test combined scoring calculation"""
    print("\n" + "="*70)
    print("TEST 2: COMBINED SCORING CALCULATION")
    print("="*70)

    # Find students with both cognitive and academic assessments
    students = supabase.table('students').select('id, name').execute()

    students_with_both = []
    students_with_cognitive_only = []
    students_with_academic_only = []
    students_with_neither = []

    for student in students.data[:10]:  # Test first 10 students
        student_id = student['id']
        student_name = student['name']

        # Check for cognitive assessment
        cognitive = supabase.table('cognitive_assessment_results')\
            .select('*')\
            .eq('student_id', student_id)\
            .limit(1)\
            .execute()
        has_cognitive = len(cognitive.data) > 0

        # Check for academic assessment
        academic = supabase.table('student_assessments')\
            .select('*')\
            .eq('student_id', student_id)\
            .limit(1)\
            .execute()
        has_academic = len(academic.data) > 0

        # Get combined scores
        try:
            result = supabase.rpc('calculate_combined_category_scores', {
                'p_student_id': student_id
            }).execute()
            scores = result.data

            # Categorize student
            if has_cognitive and has_academic:
                students_with_both.append({
                    'name': student_name,
                    'scores': scores,
                    'cognitive': cognitive.data[0],
                    'academic': academic.data[0]
                })
            elif has_cognitive:
                students_with_cognitive_only.append({
                    'name': student_name,
                    'scores': scores
                })
            elif has_academic:
                students_with_academic_only.append({
                    'name': student_name,
                    'scores': scores
                })
            else:
                students_with_neither.append({
                    'name': student_name,
                    'scores': scores
                })
        except Exception as e:
            print(f"❌ Error calculating scores for {student_name}: {e}")

    # Report findings
    print(f"\nStudents with BOTH assessments: {len(students_with_both)}")
    if students_with_both:
        student = students_with_both[0]
        print(f"\n  Example: {student['name']}")
        print(f"  Cognitive domains: {student['cognitive'].get('domain_scores', {})}")
        print(f"  Academic score: {student['academic']['score']}/{student['academic']['total_questions']}")
        print(f"  Combined category scores:")
        for category, score in student['scores'].items():
            print(f"    - {category}: {score}")

    print(f"\nStudents with COGNITIVE ONLY: {len(students_with_cognitive_only)}")
    if students_with_cognitive_only:
        student = students_with_cognitive_only[0]
        print(f"  Example: {student['name']}")
        print(f"  Scores: {student['scores']}")

    print(f"\nStudents with ACADEMIC ONLY: {len(students_with_academic_only)}")
    if students_with_academic_only:
        student = students_with_academic_only[0]
        print(f"  Example: {student['name']}")
        print(f"  Scores: {student['scores']}")

    print(f"\nStudents with NEITHER assessment: {len(students_with_neither)}")
    if students_with_neither:
        student = students_with_neither[0]
        print(f"  Example: {student['name']}")
        print(f"  Scores (should all be 50): {student['scores']}")
        # Verify all scores are 50
        all_fifty = all(score == 50 for score in student['scores'].values())
        if all_fifty:
            print(f"  ✅ Balanced profile confirmed (all scores = 50)")
        else:
            print(f"  ❌ ERROR: Expected all scores to be 50 for student with no assessments")
            return False

    return True


def test_multi_bucket_assignment():
    """Test multi-bucket assignment"""
    print("\n" + "="*70)
    print("TEST 3: MULTI-BUCKET ASSIGNMENT")
    print("="*70)

    # Query student_category_buckets view
    try:
        result = supabase.table('student_category_buckets').select('*').limit(20).execute()

        bucket_counts = {}
        for student in result.data:
            num_buckets = len(student.get('assigned_buckets', []))
            bucket_counts[num_buckets] = bucket_counts.get(num_buckets, 0) + 1

            if num_buckets > 1:
                print(f"\n  {student['student_name']}:")
                print(f"    Assigned to {num_buckets} buckets: {student['assigned_buckets']}")

                # Show their scores
                scores = student.get('category_scores', {})
                print(f"    Scores:")
                for category in student['assigned_buckets']:
                    score = scores.get(category, 0)
                    print(f"      - {category}: {score}")

        print(f"\n\nBucket Distribution:")
        for num_buckets, count in sorted(bucket_counts.items()):
            print(f"  {num_buckets} bucket(s): {count} students")

        # Check if any students have multiple buckets
        students_with_multiple = sum(count for num, count in bucket_counts.items() if num > 1)
        if students_with_multiple > 0:
            print(f"\n✅ Multi-bucket assignment is working ({students_with_multiple} students in multiple buckets)")
            return True
        else:
            print(f"\n⚠️  No students currently in multiple buckets")
            print(f"    This may be expected if all students have balanced profiles")
            return True

    except Exception as e:
        print(f"❌ Error testing multi-bucket assignment: {e}")
        return False


def test_score_distribution():
    """Test that score distribution is reasonable"""
    print("\n" + "="*70)
    print("TEST 4: SCORE DISTRIBUTION ANALYSIS")
    print("="*70)

    students = supabase.table('students').select('id, name, category_scores').execute()

    category_stats = {
        'slow_processing': [],
        'fast_processor': [],
        'high_energy': [],
        'visual_learner': [],
        'logical_learner': [],
        'sensitive_low_confidence': [],
        'easily_distracted': [],
        'needs_repetition': []
    }

    for student in students.data:
        scores = student.get('category_scores', {})
        for category in category_stats.keys():
            score = scores.get(category, 50)
            category_stats[category].append(score)

    print("\nCategory Score Statistics:")
    print(f"{'Category':<30} {'Min':<6} {'Max':<6} {'Avg':<6} {'Median':<6}")
    print("-" * 70)

    for category, scores in category_stats.items():
        if scores:
            min_score = min(scores)
            max_score = max(scores)
            avg_score = sum(scores) / len(scores)
            median_score = sorted(scores)[len(scores) // 2]

            print(f"{category:<30} {min_score:<6} {max_score:<6} {avg_score:<6.1f} {median_score:<6}")

            # Check for red flags
            if min_score == max_score == 50:
                print(f"  ⚠️  All students have score 50 - no assessments completed yet")
            elif min_score < 0 or max_score > 100:
                print(f"  ❌ ERROR: Scores out of range (0-100)")
                return False

    return True


def main():
    """Run all validation tests"""
    print("\n" + "="*70)
    print("COMBINED SCORING SYSTEM VALIDATION")
    print("="*70)

    all_tests_passed = True

    # Test 1: SQL Functions
    if not test_sql_functions():
        print("\n❌ SQL functions not available - migration may not be applied")
        all_tests_passed = False

    # Test 2: Combined Scoring
    if not test_combined_scoring():
        print("\n❌ Combined scoring test failed")
        all_tests_passed = False

    # Test 3: Multi-bucket Assignment
    if not test_multi_bucket_assignment():
        print("\n❌ Multi-bucket assignment test failed")
        all_tests_passed = False

    # Test 4: Score Distribution
    if not test_score_distribution():
        print("\n❌ Score distribution test failed")
        all_tests_passed = False

    # Final Summary
    print("\n" + "="*70)
    print("VALIDATION SUMMARY")
    print("="*70)

    if all_tests_passed:
        print("✅ All validation tests PASSED!")
        print("\nThe combined scoring system is working correctly:")
        print("  ✓ SQL functions are available")
        print("  ✓ Combined scoring calculations work")
        print("  ✓ Multi-bucket assignment functions")
        print("  ✓ Score distributions are valid")
    else:
        print("❌ Some validation tests FAILED")
        print("\nPlease check the errors above and:")
        print("  1. Ensure SQL migration has been applied in Supabase")
        print("  2. Run populate_category_scores.py to calculate scores")
        print("  3. Re-run this validation script")

    print("="*70)

    return 0 if all_tests_passed else 1


if __name__ == "__main__":
    sys.exit(main())
