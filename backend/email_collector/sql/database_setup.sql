-- Email Threads Table
CREATE TABLE email_threads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    gmail_thread_id TEXT UNIQUE NOT NULL,
    subject TEXT NOT NULL,
    participants TEXT[] NOT NULL DEFAULT '{}',
    first_message_date TIMESTAMP WITH TIME ZONE NOT NULL,
    last_message_date TIMESTAMP WITH TIME ZONE NOT NULL,
    message_count INTEGER NOT NULL DEFAULT 0,
    
    -- Gemini-Extracted CRM Fields
    last_action_summary TEXT,
    next_action_status TEXT CHECK (next_action_status IN ('read', 'reply', 'other')),
    next_action_description TEXT,
    priority_level TEXT CHECK (priority_level IN ('READ_NOW', 'REPLY_NOW', 'NORMAL', 'LOW')) DEFAULT 'NORMAL',
    auto_priority_reasoning TEXT,
    
    -- Gemini-Extracted Sponsor Information
    sponsor_poc_name TEXT,
    sponsor_org_name TEXT,
    estimated_value_amount TEXT,
    value_type TEXT CHECK (value_type IN ('monetary', 'in-kind', 'catering', 'equipment', 'other')),
    value_description TEXT,
    sponsor_confidence_score REAL CHECK (sponsor_confidence_score >= 0 AND sponsor_confidence_score <= 1),
    
    -- Metadata
    gmail_thread_url TEXT,
    llm_processed BOOLEAN DEFAULT FALSE,
    llm_processed_at TIMESTAMP WITH TIME ZONE,
    status TEXT CHECK (status IN ('new', 'in_progress', 'responded', 'closed')) DEFAULT 'new',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Messages Table
CREATE TABLE email_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    thread_id UUID NOT NULL REFERENCES email_threads(id) ON DELETE CASCADE,
    gmail_message_id TEXT UNIQUE NOT NULL,
    sender_email TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    recipients TEXT[] NOT NULL DEFAULT '{}',
    subject TEXT NOT NULL,
    body_text TEXT NOT NULL,
    snippet TEXT NOT NULL,
    received_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_from_user BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_email_threads_gmail_thread_id ON email_threads(gmail_thread_id);
CREATE INDEX idx_email_threads_priority_level ON email_threads(priority_level);
CREATE INDEX idx_email_threads_status ON email_threads(status);
CREATE INDEX idx_email_threads_llm_processed ON email_threads(llm_processed);
CREATE INDEX idx_email_threads_last_message_date ON email_threads(last_message_date DESC);

CREATE INDEX idx_email_messages_thread_id ON email_messages(thread_id);
CREATE INDEX idx_email_messages_gmail_message_id ON email_messages(gmail_message_id);
CREATE INDEX idx_email_messages_received_date ON email_messages(received_date DESC);

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_email_threads_updated_at 
    BEFORE UPDATE ON email_threads 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security policies
ALTER TABLE email_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_messages ENABLE ROW LEVEL SECURITY;

-- Policy for service role (backend operations)
CREATE POLICY "Enable all operations for service role" ON email_threads
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Enable all operations for service role" ON email_messages
    FOR ALL USING (auth.role() = 'service_role');

-- Policy for authenticated users (frontend access)
CREATE POLICY "Enable read access for authenticated users" ON email_threads
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON email_messages
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for authenticated users to update thread status
CREATE POLICY "Enable update for authenticated users" ON email_threads
    FOR UPDATE USING (auth.role() = 'authenticated');