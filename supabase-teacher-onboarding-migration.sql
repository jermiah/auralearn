-- Migration: Add teacher onboarding fields to users table
-- This allows teachers to specify their primary subject and grade level during onboarding

-- Add new columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS primary_subject TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS primary_grade_level TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS school_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Create enum type for subjects (French curriculum)
DO $$ BEGIN
    CREATE TYPE subject_type AS ENUM (
        'francais',
        'langues_vivantes',
        'arts_plastiques',
        'education_musicale',
        'histoire_des_arts',
        'education_physique_sportive',
        'enseignement_moral_civique',
        'histoire_geographie',
        'sciences_technologie',
        'mathematiques'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum type for grade levels
DO $$ BEGIN
    CREATE TYPE grade_level_type AS ENUM (
        'CM1',
        'CM2'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN users.primary_subject IS 'Teacher primary teaching subject from French curriculum';
COMMENT ON COLUMN users.primary_grade_level IS 'Teacher primary grade level (CM1 or CM2)';
COMMENT ON COLUMN users.school_name IS 'Optional school name where teacher works';
COMMENT ON COLUMN users.onboarding_completed IS 'Flag to track if teacher has completed onboarding';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_subject_grade ON users(primary_subject, primary_grade_level);
CREATE INDEX IF NOT EXISTS idx_users_onboarding ON users(onboarding_completed);
