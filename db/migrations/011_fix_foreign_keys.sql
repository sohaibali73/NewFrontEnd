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
-- STEP 1: Drop ALL old foreign key constraints first
-- ============================================================================

ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_user_id_fkey;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_user_id_fkey;
ALTER TABLE afl_codes DROP CONSTRAINT IF EXISTS afl_codes_user_id_fkey;
ALTER TABLE afl_history DROP CONSTRAINT IF EXISTS fk_afl_history_user;
ALTER TABLE afl_uploaded_files DROP CONSTRAINT IF EXISTS fk_afl_uploaded_files_user;
ALTER TABLE afl_settings_presets DROP CONSTRAINT IF EXISTS afl_settings_presets_user_id_fkey;
ALTER TABLE reverse_engineer_history DROP CONSTRAINT IF EXISTS fk_reverse_engineer_history_user;
ALTER TABLE user_feedback DROP CONSTRAINT IF EXISTS user_feedback_user_id_fkey;
ALTER TABLE training_suggestions DROP CONSTRAINT IF EXISTS training_suggestions_user_id_fkey;
ALTER TABLE analytics_events DROP CONSTRAINT IF EXISTS analytics_events_user_id_fkey;
ALTER TABLE content_items DROP CONSTRAINT IF EXISTS content_items_user_id_fkey;
ALTER TABLE writing_styles DROP CONSTRAINT IF EXISTS writing_styles_user_id_fkey;
ALTER TABLE backtest_results DROP CONSTRAINT IF EXISTS backtest_results_user_id_fkey;
ALTER TABLE brain_documents DROP CONSTRAINT IF EXISTS brain_documents_uploaded_by_fkey;
ALTER TABLE learnings DROP CONSTRAINT IF EXISTS learnings_user_id_fkey;
ALTER TABLE training_data DROP CONSTRAINT IF EXISTS training_data_created_by_fkey;

-- ============================================================================
-- STEP 2: Clean up orphaned data (records with user_ids not in auth.users)
-- ============================================================================

-- Delete conversations for users that don't exist in auth.users
DELETE FROM conversations WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Delete messages for users that don't exist in auth.users  
DELETE FROM messages WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Delete afl_codes for users that don't exist in auth.users
DELETE FROM afl_codes WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Delete afl_history for users that don't exist in auth.users
DELETE FROM afl_history WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Delete afl_uploaded_files for users that don't exist in auth.users
DELETE FROM afl_uploaded_files WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Delete afl_settings_presets for users that don't exist in auth.users
DELETE FROM afl_settings_presets WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Delete reverse_engineer_history for users that don't exist in auth.users
DELETE FROM reverse_engineer_history WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Delete user_feedback for users that don't exist in auth.users
DELETE FROM user_feedback WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Delete training_suggestions for users that don't exist in auth.users
DELETE FROM training_suggestions WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Delete analytics_events for users that don't exist in auth.users
DELETE FROM analytics_events WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Delete content_items for users that don't exist in auth.users
DELETE FROM content_items WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Delete writing_styles for users that don't exist in auth.users
DELETE FROM writing_styles WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Delete backtest_results for users that don't exist in auth.users
DELETE FROM backtest_results WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Set uploaded_by to NULL for brain_documents where user doesn't exist
UPDATE brain_documents SET uploaded_by = NULL WHERE uploaded_by NOT IN (SELECT id FROM auth.users);

-- Set user_id to NULL for learnings where user doesn't exist
UPDATE learnings SET user_id = NULL WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Set created_by to NULL for training_data where user doesn't exist
UPDATE training_data SET created_by = NULL WHERE created_by NOT IN (SELECT id FROM auth.users);

-- ============================================================================
-- STEP 3: Add new foreign key constraints pointing to auth.users
-- ============================================================================

ALTER TABLE conversations
    ADD CONSTRAINT conversations_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE messages
    ADD CONSTRAINT messages_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE afl_codes
    ADD CONSTRAINT afl_codes_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE afl_history
    ADD CONSTRAINT fk_afl_history_user
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE afl_uploaded_files
    ADD CONSTRAINT fk_afl_uploaded_files_user
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE afl_settings_presets
    ADD CONSTRAINT afl_settings_presets_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE reverse_engineer_history
    ADD CONSTRAINT fk_reverse_engineer_history_user
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE user_feedback
    ADD CONSTRAINT user_feedback_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE training_suggestions
    ADD CONSTRAINT training_suggestions_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE analytics_events
    ADD CONSTRAINT analytics_events_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE content_items
    ADD CONSTRAINT content_items_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE writing_styles
    ADD CONSTRAINT writing_styles_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE backtest_results
    ADD CONSTRAINT backtest_results_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE brain_documents
    ADD CONSTRAINT brain_documents_uploaded_by_fkey
    FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE learnings
    ADD CONSTRAINT learnings_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE training_data
    ADD CONSTRAINT training_data_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Done!
SELECT 'Migration completed successfully! All foreign keys now point to auth.users' as status;