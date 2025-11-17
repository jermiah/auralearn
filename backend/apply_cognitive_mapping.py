#!/usr/bin/env python3
"""
Apply Cognitive to Category Mapping SQL Migration
Reads and executes the SQL migration file to create the mapping functions
"""

import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

def apply_migration():
    """Apply the cognitive-to-category mapping SQL migration"""

    # Connect to Supabase
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

    if not supabase_url or not supabase_key:
        print("[ERROR] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set in .env")
        return False

    print("\n" + "="*70)
    print("APPLYING COGNITIVE TO CATEGORY MAPPING SQL MIGRATION")
    print("="*70 + "\n")

    # Read SQL migration file
    sql_file_path = os.path.join(os.path.dirname(__file__), '..', 'supabase-cognitive-to-category-mapping.sql')

    try:
        with open(sql_file_path, 'r', encoding='utf-8') as f:
            sql_content = f.read()
        print(f"[OK] Read SQL migration file ({len(sql_content)} characters)")
    except FileNotFoundError:
        print(f"[ERROR] SQL migration file not found at: {sql_file_path}")
        return False
    except Exception as e:
        print(f"[ERROR] Failed to read SQL file: {e}")
        return False

    # Execute SQL using Supabase client
    supabase = create_client(supabase_url, supabase_key)

    try:
        # Note: Supabase Python client doesn't support raw SQL execution directly
        # We need to use the PostgREST API or execute via psql
        # For now, we'll test if the function already exists

        print("[INFO] Testing if SQL function already exists...")

        # Try to call the function with a dummy UUID to see if it exists
        test_result = supabase.rpc('calculate_category_scores_from_cognitive', {
            'p_student_id': '00000000-0000-0000-0000-000000000000'
        }).execute()

        print("[OK] SQL function 'calculate_category_scores_from_cognitive' exists and is callable")
        print(f"[OK] Test result: {test_result.data}")

        return True

    except Exception as e:
        error_msg = str(e)

        if 'Could not find the function' in error_msg or 'function' in error_msg.lower():
            print("[WARN] SQL function does not exist yet")
            print("\n" + "="*70)
            print("MANUAL MIGRATION REQUIRED")
            print("="*70)
            print("\nThe SQL migration cannot be applied automatically via Python.")
            print("Please apply it manually using one of these methods:\n")
            print("Option 1: Supabase Dashboard")
            print("  1. Go to https://supabase.com/dashboard")
            print("  2. Navigate to SQL Editor")
            print(f"  3. Copy and paste the contents of: {sql_file_path}")
            print("  4. Click 'Run'\n")
            print("Option 2: psql command line")
            print(f"  psql <your-database-url> -f {sql_file_path}\n")
            print("Option 3: Supabase CLI")
            print(f"  supabase db execute < {sql_file_path}\n")
            return False
        else:
            print(f"[ERROR] Unexpected error: {e}")
            return False

def main():
    success = apply_migration()

    if success:
        print("\n" + "="*70)
        print("[SUCCESS] SQL migration verified successfully!")
        print("="*70)
        print("\nNext step: Run populate_category_scores.py to calculate scores for all students")
        return 0
    else:
        print("\n" + "="*70)
        print("[ACTION REQUIRED] Please apply SQL migration manually (see instructions above)")
        print("="*70)
        return 1

if __name__ == '__main__':
    import sys
    sys.exit(main())
