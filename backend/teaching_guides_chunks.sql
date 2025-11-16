-- Teaching Guides Chunks Table
-- Stores chunked teaching guide content for RAG retrieval

CREATE TABLE IF NOT EXISTS teaching_guides_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doc_id TEXT NOT NULL,
    guide_type TEXT NOT NULL,
    applicable_grades TEXT[] NOT NULL,
    topic TEXT NOT NULL,
    subtopic TEXT NOT NULL,
    section_header TEXT NOT NULL,
    chunk_text TEXT NOT NULL,
    page_start INTEGER NOT NULL,
    page_end INTEGER NOT NULL,
    is_general BOOLEAN DEFAULT FALSE,
    lang TEXT DEFAULT 'fr',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_teaching_guides_doc_id ON teaching_guides_chunks(doc_id);
CREATE INDEX IF NOT EXISTS idx_teaching_guides_guide_type ON teaching_guides_chunks(guide_type);
CREATE INDEX IF NOT EXISTS idx_teaching_guides_topic ON teaching_guides_chunks(topic);
CREATE INDEX IF NOT EXISTS idx_teaching_guides_grades ON teaching_guides_chunks USING GIN(applicable_grades);
CREATE INDEX IF NOT EXISTS idx_teaching_guides_is_general ON teaching_guides_chunks(is_general);
CREATE INDEX IF NOT EXISTS idx_teaching_guides_created_at ON teaching_guides_chunks(created_at);

-- Add comments for documentation
COMMENT ON TABLE teaching_guides_chunks IS 'Stores chunked teaching guide content for pedagogical support';
COMMENT ON COLUMN teaching_guides_chunks.id IS 'Unique identifier for the chunk';
COMMENT ON COLUMN teaching_guides_chunks.doc_id IS 'Source document identifier';
COMMENT ON COLUMN teaching_guides_chunks.guide_type IS 'Type of guide: pedagogical, strategy, activity, assessment';
COMMENT ON COLUMN teaching_guides_chunks.applicable_grades IS 'Array of applicable grade levels (CM1, CM2, 6e, etc.)';
COMMENT ON COLUMN teaching_guides_chunks.topic IS 'Main topic or chapter';
COMMENT ON COLUMN teaching_guides_chunks.subtopic IS 'Subtopic or section within the topic';
COMMENT ON COLUMN teaching_guides_chunks.section_header IS 'Section header or title';
COMMENT ON COLUMN teaching_guides_chunks.chunk_text IS 'The actual text content of the chunk';
COMMENT ON COLUMN teaching_guides_chunks.page_start IS 'Starting page number in source document';
COMMENT ON COLUMN teaching_guides_chunks.page_end IS 'Ending page number in source document';
COMMENT ON COLUMN teaching_guides_chunks.is_general IS 'True if applicable to all grades';
COMMENT ON COLUMN teaching_guides_chunks.lang IS 'Language code (default: fr for French)';
COMMENT ON COLUMN teaching_guides_chunks.created_at IS 'Timestamp when chunk was created';

-- Enable Row Level Security (optional, configure based on your needs)
-- ALTER TABLE teaching_guides_chunks ENABLE ROW LEVEL SECURITY;

-- Example RLS policies (uncomment and modify as needed)
-- CREATE POLICY "Enable read access for authenticated users" ON teaching_guides_chunks
--     FOR SELECT USING (auth.role() = 'authenticated');

-- CREATE POLICY "Enable insert for service role only" ON teaching_guides_chunks
--     FOR INSERT WITH CHECK (auth.role() = 'service_role');
