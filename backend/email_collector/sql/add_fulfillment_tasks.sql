-- Add fulfillment tasks table for sponsor obligations tracking
-- Run this after your main database setup

-- Fulfillment Tasks Table
CREATE TABLE IF NOT EXISTS fulfillment_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    thread_id UUID NOT NULL REFERENCES email_threads(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    task_type TEXT CHECK (task_type IN (
        'social_media', 'email', 'flyer', 'program', 'announcement',
        'website', 'newsletter', 'event', 'other'
    )) NOT NULL DEFAULT 'other',
    priority TEXT CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
    due_date TIMESTAMP WITH TIME ZONE,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    assigned_to TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fulfillment_tasks_thread_id ON fulfillment_tasks(thread_id);
CREATE INDEX IF NOT EXISTS idx_fulfillment_tasks_completed ON fulfillment_tasks(completed);
CREATE INDEX IF NOT EXISTS idx_fulfillment_tasks_due_date ON fulfillment_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_fulfillment_tasks_priority ON fulfillment_tasks(priority);

-- Add trigger for updated_at
CREATE TRIGGER update_fulfillment_tasks_updated_at
    BEFORE UPDATE ON fulfillment_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add participant_signature column to help with deduplication
ALTER TABLE email_threads ADD COLUMN IF NOT EXISTS participant_signature TEXT;
CREATE INDEX IF NOT EXISTS idx_email_threads_participant_signature ON email_threads(participant_signature);

-- Disable RLS for new table (matching existing setup)
ALTER TABLE fulfillment_tasks DISABLE ROW LEVEL SECURITY;
