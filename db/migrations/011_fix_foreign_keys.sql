-- ============================================================================
-- Migration 011: Fix Foreign Keys to use auth.users
-- ============================================================================
-- Run this in Supabase SQL Editor to fix the foreign key constraints
-- ============================================================================

-- Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    nickname TEXT,
    avatar_url TEXT,
    claude_api_key_encrypted BYTEA,
    tavily_api_key_encrypted BYTEA,
    preferences JSONB DEFAULT '{}'::jsonb,
    is_admin BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable pgcrypto for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create encryption functions
CREATE OR REPLACE FUNCTION encrypt_api_key(plaintext TEXT, encryption_key TEXT)
RETURNS BYTEA
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF plaintext IS NULL OR plaintext = '' THEN
        RETURN NULL;
    END IF;
    RETURN pg_sym_encrypt(plaintext, encryption_key, 'cipher=aes-256-gcm');
END;
$$;

CREATE OR REPLACE FUNCTION decrypt_api_key(ciphertext BYTEA, encryption_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF ciphertext IS NULL THEN
        RETURN NULL;
    END IF;
    RETURN pg_sym_decrypt(ciphertext, encryption_key, 'cipher=aes-256-gcm');
END;
$$;

-- Create trigger for auto-creating user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.user_profiles (id, name, nickname, is_admin)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
        COALESCE(NEW.raw_user_meta_data->>'nickname', split_part(NEW.email, '@', 1)),
        NEW.email IN ('sohaib.ali@potomac.com', 'jamiecatrina9@gmail.com')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (drop if exists first)
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Service role full access" ON user_profiles;

CREATE POLICY "Users can read own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Service role full access" ON user_profiles FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON user_profiles TO service_role;

-- Create helper functions for API keys
CREATE OR REPLACE FUNCTION get_user_api_keys(p_user_id UUID, p_encryption_key TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_claude_key BYTEA;
    v_tavily_key BYTEA;
BEGIN
    SELECT claude_api_key_encrypted, tavily_api_key_encrypted
    INTO v_claude_key, v_tavily_key
    FROM user_profiles WHERE id = p_user_id;
    
    RETURN jsonb_build_object(
        'claude', CASE WHEN v_claude_key IS NOT NULL THEN decrypt_api_key(v_claude_key, p_encryption_key) ELSE NULL END,
        'tavily', CASE WHEN v_tavily_key IS NOT NULL THEN decrypt_api_key(v_tavily_key, p_encryption_key) ELSE NULL END
    );
END;
$$;

CREATE OR REPLACE FUNCTION set_user_api_keys(
    p_user_id UUID,
    p_claude_key TEXT,
    p_tavily_key TEXT,
    p_encryption_key TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE user_profiles SET
        claude_api_key_encrypted = CASE WHEN p_claude_key IS NOT NULL AND p_claude_key != '' THEN encrypt_api_key(p_claude_key, p_encryption_key) ELSE NULL END,
        tavily_api_key_encrypted = CASE WHEN p_tavily_key IS NOT NULL AND p_tavily_key != '' THEN encrypt_api_key(p_tavily_key, p_encryption_key) ELSE NULL END,
        updated_at = NOW()
    WHERE id = p_user_id;
END;
$$;

-- ============================================================================
-- Fix foreign keys - only for tables that exist
-- ============================================================================

-- Function to safely update foreign key
CREATE OR REPLACE FUNCTION fix_foreign_key(p_table_name TEXT, p_column_name TEXT, p_constraint_name TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables t WHERE t.table_name = p_table_name) THEN
        -- Check if column exists
        IF EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_name = p_table_name AND c.column_name = p_column_name) THEN
            -- Drop old constraint if exists
            EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', p_table_name, p_constraint_name);
            
            -- Add new constraint pointing to auth.users
            EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES auth.users(id) ON DELETE CASCADE',
                p_table_name, p_constraint_name, p_column_name);
            
            RAISE NOTICE 'Fixed foreign key for %.%', p_table_name, p_column_name;
        ELSE
            RAISE NOTICE 'Column %.% does not exist, skipping', p_table_name, p_column_name;
        END IF;
    ELSE
        RAISE NOTICE 'Table % does not exist, skipping', p_table_name;
    END IF;
END;
$$;

-- Fix all known tables
SELECT fix_foreign_key('conversations', 'user_id', 'conversations_user_id_fkey');
SELECT fix_foreign_key('messages', 'user_id', 'messages_user_id_fkey');
SELECT fix_foreign_key('afl_codes', 'user_id', 'afl_codes_user_id_fkey');
SELECT fix_foreign_key('afl_history', 'user_id', 'fk_afl_history_user');
SELECT fix_foreign_key('afl_uploaded_files', 'user_id', 'fk_afl_uploaded_files_user');
SELECT fix_foreign_key('afl_settings_presets', 'user_id', 'afl_settings_presets_user_id_fkey');
SELECT fix_foreign_key('reverse_engineer_history', 'user_id', 'fk_reverse_engineer_history_user');
SELECT fix_foreign_key('user_feedback', 'user_id', 'user_feedback_user_id_fkey');
SELECT fix_foreign_key('training_suggestions', 'user_id', 'training_suggestions_user_id_fkey');
SELECT fix_foreign_key('analytics_events', 'user_id', 'analytics_events_user_id_fkey');
SELECT fix_foreign_key('content_items', 'user_id', 'content_items_user_id_fkey');
SELECT fix_foreign_key('writing_styles', 'user_id', 'writing_styles_user_id_fkey');
SELECT fix_foreign_key('backtest_results', 'user_id', 'backtest_results_user_id_fkey');
SELECT fix_foreign_key('brain_documents', 'uploaded_by', 'brain_documents_uploaded_by_fkey');
SELECT fix_foreign_key('learnings', 'user_id', 'learnings_user_id_fkey');
SELECT fix_foreign_key('training_data', 'created_by', 'training_data_created_by_fkey');
SELECT fix_foreign_key('strategies', 'user_id', 'strategies_user_id_fkey');

-- Drop the helper function
DROP FUNCTION fix_foreign_key(TEXT, TEXT, TEXT);

-- Done!
SELECT 'Migration completed successfully!' as status;