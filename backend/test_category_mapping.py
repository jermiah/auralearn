#!/usr/bin/env python3
"""
Category Mapping System - Critical Path Tests
Tests the Python integration layer for category-based teaching guide retrieval
"""

import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv
load_dotenv()

# Color codes for terminal output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'


def print_test(test_name, status, message=""):
    """Print test result with color"""
    status_symbol = f"{GREEN}✓{RESET}" if status else f"{RED}✗{RESET}"
    print(f"{status_symbol} {test_name}")
    if message:
        print(f"  {message}")


def test_imports():
    """Test 1: Verify all required modules can be imported"""
    print(f"\n{BLUE}TEST 1: Module Imports{RESET}")
    
    try:
        from teaching_guides_service import (
            get_teaching_guides_for_student,
            get_teaching_guides_by_grade,
            get_category_strategies,
            get_student_categories,
            tag_existing_guides
        )
        print_test("Import teaching_guides_service", True)
        return True
    except ImportError as e:
        print_test("Import teaching_guides_service", False, str(e))
        return False


def test_metadata_builder():
    """Test 2: Verify metadata builder has category detection"""
    print(f"\n{BLUE}TEST 2: Metadata Builder Category Detection{RESET}")
    
    try:
        from assessment_pipeline.teaching_guides.metadata import MetadataBuilder
        
        builder = MetadataBuilder()
        
        # Test category patterns exist
        if not hasattr(builder, 'category_patterns'):
            print_test("Category patterns exist", False, "category_patterns attribute missing")
            return False
        
        print_test("Category patterns exist", True, f"{len(builder.category_patterns)} patterns defined")
        
        # Test detect_categories method
        if not hasattr(builder, 'detect_categories'):
            print_test("detect_categories method exists", False)
            return False
        
        print_test("detect_categories method exists", True)
        
        # Test category detection with sample text
        test_text = "Use visual diagrams and color-coded charts to help students"
        categories = builder.detect_categories(test_text)
        
        if 'visual_learner' in categories:
            print_test("Visual learner detection", True, f"Detected: {categories}")
        else:
            print_test("Visual learner detection", False, f"Expected 'visual_learner', got: {categories}")
        
        return True
        
    except Exception as e:
        print_test("Metadata builder test", False, str(e))
        return False


def test_schema_update():
    """Test 3: Verify schema includes applicable_categories"""
    print(f"\n{BLUE}TEST 3: Schema Update{RESET}")
    
    try:
        from assessment_pipeline.teaching_guides.schemas import TeachingGuideChunk
        
        # Check if applicable_categories field exists
        if hasattr(TeachingGuideChunk, '__fields__'):
            fields = TeachingGuideChunk.__fields__
            if 'applicable_categories' in fields:
                print_test("applicable_categories field exists", True)
                return True
            else:
                print_test("applicable_categories field exists", False, "Field not found in schema")
                return False
        else:
            print_test("Schema check", False, "Cannot access schema fields")
            return False
            
    except Exception as e:
        print_test("Schema test", False, str(e))
        return False


def test_supabase_connection():
    """Test 4: Verify Supabase connection works"""
    print(f"\n{BLUE}TEST 4: Supabase Connection{RESET}")
    
    try:
        from supabase import create_client
        
        url = os.getenv('SUPABASE_URL')
        key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        
        if not url or not key:
            print_test("Environment variables", False, "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set")
            return False
        
        print_test("Environment variables", True)
        
        supabase = create_client(url, key)
        
        # Test connection with simple query
        result = supabase.table('students').select('id').limit(1).execute()
        
        print_test("Supabase connection", True, "Successfully connected")
        return True
        
    except Exception as e:
        print_test("Supabase connection", False, str(e))
        return False


def test_category_detection_patterns():
    """Test 5: Verify all 8 category patterns work"""
    print(f"\n{BLUE}TEST 5: Category Detection Patterns{RESET}")
    
    try:
        from assessment_pipeline.teaching_guides.metadata import MetadataBuilder
        
        builder = MetadataBuilder()
        
        test_cases = [
            ("Use visual diagrams and charts", "visual_learner"),
            ("Give extra time and step-by-step instructions", "slow_processing"),
            ("Provide advanced challenges and enrichment", "fast_processor"),
            ("Practice multiple times and review regularly", "needs_repetition"),
            ("Use hands-on activities and movement breaks", "high_energy"),
            ("Minimize distractions and maintain focus", "easily_distracted"),
            ("Encourage students and build confidence", "sensitive_low_confidence"),
            ("Use logical sequences and problem-solving", "logical_learner"),
        ]
        
        passed = 0
        for text, expected_category in test_cases:
            categories = builder.detect_categories(text)
            if expected_category in categories:
                print_test(f"Detect {expected_category}", True)
                passed += 1
            else:
                print_test(f"Detect {expected_category}", False, f"Got: {categories}")
        
        print(f"\n  {passed}/{len(test_cases)} patterns working correctly")
        return passed == len(test_cases)
        
    except Exception as e:
        print_test("Pattern detection test", False, str(e))
        return False


def test_service_functions():
    """Test 6: Verify service functions are callable"""
    print(f"\n{BLUE}TEST 6: Service Functions{RESET}")
    
    try:
        from teaching_guides_service import (
            get_teaching_guides_for_student,
            get_teaching_guides_by_grade,
            get_category_strategies,
            get_student_categories
        )
        
        # Check if functions are callable
        functions = [
            ("get_teaching_guides_for_student", get_teaching_guides_for_student),
            ("get_teaching_guides_by_grade", get_teaching_guides_by_grade),
            ("get_category_strategies", get_category_strategies),
            ("get_student_categories", get_student_categories),
        ]
        
        for name, func in functions:
            if callable(func):
                print_test(f"{name} is callable", True)
            else:
                print_test(f"{name} is callable", False)
        
        return True
        
    except Exception as e:
        print_test("Service functions test", False, str(e))
        return False


def run_all_tests():
    """Run all critical path tests"""
    print(f"\n{'='*60}")
    print(f"{BLUE}CATEGORY MAPPING SYSTEM - CRITICAL PATH TESTS{RESET}")
    print(f"{'='*60}")
    
    tests = [
        ("Module Imports", test_imports),
        ("Metadata Builder", test_metadata_builder),
        ("Schema Update", test_schema_update),
        ("Supabase Connection", test_supabase_connection),
        ("Category Patterns", test_category_detection_patterns),
        ("Service Functions", test_service_functions),
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"\n{RED}ERROR in {test_name}: {e}{RESET}")
            results.append((test_name, False))
    
    # Print summary
    print(f"\n{'='*60}")
    print(f"{BLUE}TEST SUMMARY{RESET}")
    print(f"{'='*60}")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = f"{GREEN}PASS{RESET}" if result else f"{RED}FAIL{RESET}"
        print(f"{status} - {test_name}")
    
    print(f"\n{BLUE}Results: {passed}/{total} tests passed{RESET}")
    
    if passed == total:
        print(f"{GREEN}✓ All tests passed!{RESET}")
        print(f"\n{YELLOW}Next steps:{RESET}")
        print("1. Run SQL migration in Supabase: supabase-teaching-guides-category-mapping.sql")
        print("2. Tag existing guides: SELECT * FROM tag_existing_teaching_guides();")
        print("3. Test with real student: python backend/teaching_guides_service.py test <student-id>")
        return 0
    else:
        print(f"{RED}✗ Some tests failed. Please review errors above.{RESET}")
        return 1


if __name__ == "__main__":
    sys.exit(run_all_tests())
