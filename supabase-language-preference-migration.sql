-- Add language_preference column to users table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'language_preference'
  ) THEN
    ALTER TABLE users ADD COLUMN language_preference VARCHAR(10) DEFAULT 'en';
    
    -- Add a comment to the column
    COMMENT ON COLUMN users.language_preference IS 'User preferred language (en, fr, etc.)';
    
    -- Create an index for faster lookups
    CREATE INDEX IF NOT EXISTS idx_users_language_preference ON users(language_preference);
  END IF;
END $$;

-- Update existing users to have default language preference if NULL
UPDATE users 
SET language_preference = 'en' 
WHERE language_preference IS NULL;
