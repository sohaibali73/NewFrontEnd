-- Migration 008: Create missing tables for content, backtest, and writing styles
-- Required by: api/routes/content.py, api/routes/backtest.py
-- Date: 2026-02-23
-- NOTE: Uses auth.users(id) for foreign keys (Supabase auth schema)
-- Run migration 009 AFTER this one for brain tables.

-- ============================================================================
-- content_items — stores articles, documents, slides, dashboards
-- ============================================================================
CREATE TABLE IF NOT EXISTS content_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title VARCHAR(500) NOT NULL,
    content TEXT DEFAULT '',
    content_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    tags JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_items_user_id ON content_items(user_id);
CREATE INDEX IF NOT EXISTS idx_content_items_content_type ON content_items(content_type);
CREATE INDEX IF NOT EXISTS idx_content_items_status ON content_items(status);
CREATE INDEX IF NOT EXISTS idx_content_items_updated_at ON content_items(updated_at DESC);

-- RLS for content_items
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own content" ON content_items;
CREATE POLICY "Users can manage own content" ON content_items
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Grant access
GRANT ALL ON content_items TO service_role;
GRANT ALL ON content_items TO authenticated;

-- ============================================================================
-- writing_styles — user-defined writing styles for content generation
-- ============================================================================
CREATE TABLE IF NOT EXISTS writing_styles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    tone VARCHAR(100) DEFAULT 'professional',
    formality VARCHAR(50) DEFAULT 'medium',
    personality_tags JSONB DEFAULT '[]'::jsonb,
    sample_text TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_writing_styles_user_id ON writing_styles(user_id);

-- RLS for writing_styles
ALTER TABLE writing_styles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own styles" ON writing_styles;
CREATE POLICY "Users can manage own styles" ON writing_styles
    FOR ALL
    USING (true)
    WITH CHECK (true);

GRANT ALL ON writing_styles TO service_role;
GRANT ALL ON writing_styles TO authenticated;

-- ============================================================================
-- backtest_results — stores uploaded backtest CSVs and AI analysis
-- ============================================================================
CREATE TABLE IF NOT EXISTS backtest_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    strategy_id UUID,
    filename VARCHAR(500),
    raw_results TEXT,
    metrics JSONB DEFAULT '{}'::jsonb,
    ai_analysis TEXT,
    recommendations JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_backtest_results_user_id ON backtest_results(user_id);
CREATE INDEX IF NOT EXISTS idx_backtest_results_strategy_id ON backtest_results(strategy_id);

-- RLS for backtest_results
ALTER TABLE backtest_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own backtests" ON backtest_results;
CREATE POLICY "Users can manage own backtests" ON backtest_results
    FOR ALL
    USING (true)
    WITH CHECK (true);

GRANT ALL ON backtest_results TO service_role;
GRANT ALL ON backtest_results TO authenticated;
