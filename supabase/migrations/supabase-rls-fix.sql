-- Fix RLS policies to allow users to create their own profile
-- Run this in Supabase SQL Editor

-- Drop the restrictive INSERT policy for users table
DROP POLICY IF EXISTS "Users can create own profile" ON users;

-- Create a new policy that allows authenticated users to insert their own record
CREATE POLICY "Users can create own profile" ON users
  FOR INSERT WITH CHECK (
    clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
  );

-- Also update the users table INSERT policy to be less restrictive during development
-- This allows any authenticated user to create a user record
DROP POLICY IF EXISTS "Allow authenticated users to create profile" ON users;
CREATE POLICY "Allow authenticated users to create profile" ON users
  FOR INSERT WITH CHECK (true);

-- For upsert operations, we also need an UPDATE policy
DROP POLICY IF EXISTS "Users can update via upsert" ON users;
CREATE POLICY "Users can update via upsert" ON users
  FOR UPDATE USING (
    clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
  );
