-- Fix RLS Policies for Email Collector Backend
-- Run this in Supabase SQL Editor if you're getting RLS errors

-- First, drop all existing policies
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON email_threads;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON email_messages;
DROP POLICY IF EXISTS "Enable all operations for service role" ON email_threads;
DROP POLICY IF EXISTS "Enable all operations for service role" ON email_messages;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON email_threads;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON email_messages;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON email_threads;

-- Option 1: Completely disable RLS for development (easiest)
ALTER TABLE email_threads DISABLE ROW LEVEL SECURITY;
ALTER TABLE email_messages DISABLE ROW LEVEL SECURITY;

-- Option 2: Keep RLS enabled but allow service role full access
-- Uncomment the lines below if you want to keep RLS enabled:

-- ALTER TABLE email_threads ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE email_messages ENABLE ROW LEVEL SECURITY;

-- -- Allow service role (backend) full access
-- CREATE POLICY "service_role_all_access" ON email_threads 
--     FOR ALL TO service_role USING (true);

-- CREATE POLICY "service_role_all_access" ON email_messages 
--     FOR ALL TO service_role USING (true);

-- -- Allow authenticated users read access
-- CREATE POLICY "authenticated_read_access" ON email_threads 
--     FOR SELECT TO authenticated USING (true);

-- CREATE POLICY "authenticated_read_access" ON email_messages 
--     FOR SELECT TO authenticated USING (true);

-- -- Allow authenticated users to update thread status
-- CREATE POLICY "authenticated_update_access" ON email_threads 
--     FOR UPDATE TO authenticated USING (true);

NOTIFY pgrst, 'reload schema';