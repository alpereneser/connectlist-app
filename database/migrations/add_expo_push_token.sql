-- Migration: Add expo_push_token column to profiles table
-- This migration adds support for Expo push notifications

-- Add expo_push_token column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS expo_push_token TEXT;

-- Add index for better performance when querying by push token
CREATE INDEX IF NOT EXISTS idx_profiles_expo_push_token 
ON profiles(expo_push_token) 
WHERE expo_push_token IS NOT NULL;

-- Add comment to document the column
COMMENT ON COLUMN profiles.expo_push_token IS 'Expo push notification token for sending push notifications to user devices';

-- Optional: Add RLS policy if needed (uncomment if you want to restrict access)
-- CREATE POLICY "Users can update their own push token" ON profiles
--   FOR UPDATE USING (auth.uid() = id);

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'expo_push_token';