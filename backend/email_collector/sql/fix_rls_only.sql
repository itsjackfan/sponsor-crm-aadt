-- Quick fix for RLS policy issues
-- Run this in your Supabase SQL Editor

-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON email_threads;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON email_messages;
DROP POLICY IF EXISTS "Enable all operations for service role" ON email_threads;
DROP POLICY IF EXISTS "Enable all operations for service role" ON email_messages;

-- Disable RLS temporarily for testing
ALTER TABLE email_threads DISABLE ROW LEVEL SECURITY;
ALTER TABLE email_messages DISABLE ROW LEVEL SECURITY;