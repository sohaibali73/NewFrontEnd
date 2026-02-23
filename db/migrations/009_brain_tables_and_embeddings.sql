-- Migration 009: Create brain_documents and brain_chunks tables with pgvector embeddings
-- Required by: api/routes/brain.py (Knowledge Base)
-- Date: 2026-02-23
-- Prerequisites: pgvector extension must be enabled in Supabase

-- ============================================================================
-- Enable pgvector extension (must be done first)
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- brain_documents — uploaded documents for RAG knowledge base
-- ============================================================================
CREATE TABLE IF NOT EXISTS brain_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uploaded_by UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    filename VARCHAR(500),
    file_type VARCHAR(100),
    file_size BIGINT DEFAULT 0,
    category VARCHAR(100) DEFAULT 'general',
    subcategories JSONB DEFAULT '[]'::jsonb,
    tags JSONB DEFAULT '[]'::jsonb,
    raw_content TEXT,
    summary TEXT,
    content_hash VARCHAR(64),
    source_type VARCHAR(50) DEFAULT 'upload',
    is_processed BOOLEAN DEFAULT FALSE,
    chunk_count INTEGER DEFAULT 0,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brain_documents_uploaded_by ON brain_documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_brain_documents_category ON brain_documents(category);
CREATE INDEX IF NOT EXISTS idx_brain_documents_content_hash ON brain_documents(content_hash);
CREATE INDEX IF NOT EXISTS idx_brain_documents_created_at ON brain_documents(created_at DESC);

-- RLS
ALTER TABLE brain_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage brain documents" ON brain_documents;
CREATE POLICY "Users can manage brain documents" ON brain_documents
    FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON brain_documents TO service_role;
GRANT ALL ON brain_documents TO authenticated;

-- ============================================================================
-- brain_chunks — document chunks with vector embeddings for RAG
-- ============================================================================
CREATE TABLE IF NOT EXISTS brain_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES brain_documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1536),  -- OpenAI/Voyage embedding dimension
    token_count INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brain_chunks_document_id ON brain_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_brain_chunks_chunk_index ON brain_chunks(chunk_index);

-- Create HNSW index for fast vector similarity search (if embedding column populated)
-- This is the key index for RAG performance
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_brain_chunks_embedding') THEN
        CREATE INDEX idx_brain_chunks_embedding ON brain_chunks
            USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
    END IF;
EXCEPTION
    WHEN others THEN
        -- IVFFlat requires training data; skip if table is empty
        RAISE NOTICE 'Skipping IVFFlat index creation (will be created after data is inserted)';
END $$;

-- RLS
ALTER TABLE brain_chunks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read brain chunks" ON brain_chunks;
CREATE POLICY "Users can read brain chunks" ON brain_chunks
    FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON brain_chunks TO service_role;
GRANT ALL ON brain_chunks TO authenticated;

-- ============================================================================
-- brain_learnings — AI-generated learnings/insights from documents
-- ============================================================================
CREATE TABLE IF NOT EXISTS learnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES brain_documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500),
    content TEXT,
    category VARCHAR(100) DEFAULT 'general',
    tags JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learnings_user_id ON learnings(user_id);
CREATE INDEX IF NOT EXISTS idx_learnings_document_id ON learnings(document_id);

ALTER TABLE learnings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage learnings" ON learnings;
CREATE POLICY "Users can manage learnings" ON learnings
    FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON learnings TO service_role;
GRANT ALL ON learnings TO authenticated;

-- ============================================================================
-- Function: Vector similarity search for RAG
-- ============================================================================
CREATE OR REPLACE FUNCTION match_brain_chunks(
    query_embedding vector(1536),
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 5,
    filter_document_id uuid DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    document_id uuid,
    chunk_index integer,
    content text,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        bc.id,
        bc.document_id,
        bc.chunk_index,
        bc.content,
        1 - (bc.embedding <=> query_embedding) AS similarity
    FROM brain_chunks bc
    WHERE 
        bc.embedding IS NOT NULL
        AND (filter_document_id IS NULL OR bc.document_id = filter_document_id)
        AND 1 - (bc.embedding <=> query_embedding) > match_threshold
    ORDER BY bc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
