-- Temporarily disable RLS for development
-- This allows the app to work while we properly integrate Clerk JWT with Supabase
-- Run this in Supabase SQL Editor

-- Disable RLS on users table for development
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Disable RLS on other tables for development
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_history DISABLE ROW LEVEL SECURITY;

-- Note: In production, you should:
-- 1. Enable RLS again
-- 2. Configure Supabase to accept Clerk JWTs
-- 3. Set up proper RLS policies that check Clerk user IDs

-- To re-enable later (DON'T RUN THIS NOW):
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE students ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE strategy_history ENABLE ROW LEVEL SECURITY;
