-- Migration: Setup database webhook for push notifications
-- This creates a trigger that calls the Edge Function when a new notification is inserted

-- Create or replace the function that will be called by the trigger
CREATE OR REPLACE FUNCTION handle_new_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the Edge Function to send push notification
  -- Using the service role key directly in the function
  PERFORM
    net.http_post(
      url := 'https://ynbwiarxodetyirhmcbp.supabase.co/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InluYndpYXJ4b2RldHlpcmhtY2JwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDkxNDMzMywiZXhwIjoyMDU2NDkwMzMzfQ.Y8peaDvFFC2BDnsSlXH5oHDKCyiJ7lkV0UY-8CG8cek'
      ),
      body := jsonb_build_object(
        'record', row_to_json(NEW)
      )
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger that fires after INSERT on notifications table
DROP TRIGGER IF EXISTS on_notification_created ON notifications;
CREATE TRIGGER on_notification_created
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_notification();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA net TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION net.http_post TO postgres, anon, authenticated, service_role;

-- Create a helper function to manually send notifications (for testing)
CREATE OR REPLACE FUNCTION send_test_notification(
  p_user_id UUID,
  p_type TEXT,
  p_data JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (
    user_id,
    type,
    data
  ) VALUES (
    p_user_id,
    p_type,
    p_data
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the test function
GRANT EXECUTE ON FUNCTION send_test_notification TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created_at 
ON notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_type 
ON notifications(type);

-- Index for data field (JSONB)
CREATE INDEX IF NOT EXISTS idx_notifications_data 
ON notifications USING GIN(data);

-- Add RLS policies for notifications if not already present
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Authenticated users can insert notifications
CREATE POLICY "Authenticated users can insert notifications" ON notifications
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy: Users can update their own notifications (for marking as read)
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Verify the setup
SELECT 
  n.nspname as schemaname,
  c.relname as tablename,
  t.tgname as triggername,
  t.tgtype
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname = 'notifications' AND t.tgname = 'on_notification_created';

-- Instructions for manual setup:
-- 1. ✅ Project URL updated to: ynbwiarxodetyirhmcbp.supabase.co
-- 2. ✅ Service role key embedded directly in the function
-- 3. Deploy the Edge Function using Supabase Dashboard:
--    - Go to Edge Functions in your Supabase Dashboard
--    - Create new function named 'send-push-notification'
--    - Copy the content from supabase/functions/send-push-notification/index.ts
-- 4. Run this SQL file in your Supabase SQL Editor
-- 5. Test the webhook by inserting a notification record