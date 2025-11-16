  -- Curriculum Chunks Table Schema
  -- This table stores processed curriculum content from French MENJ PDFs
  -- Run this in Supabase SQL Editor

  CREATE TABLE IF NOT EXISTS curriculum_chunks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    doc_id TEXT NOT NULL,                    -- Original PDF document identifier
    cycle TEXT NOT NULL,                     -- Educational cycle (Cycle 2, Cycle 3, etc.)
    grades TEXT[] NOT NULL,                  -- Applicable grade levels
    subject TEXT NOT NULL,                   -- Subject (Mathématiques, Français, etc.)
    section_type TEXT NOT NULL,              -- Type: objectifs, compétences, progression, etc.
    topic TEXT NOT NULL,                     -- Main topic
    subtopic TEXT,                           -- Sub-topic if applicable
    is_cycle_wide BOOLEAN DEFAULT false,     -- True if applies to entire cycle
    chunk_text TEXT NOT NULL,                -- The actual curriculum content
    page_start INTEGER NOT NULL,             -- Starting page in original PDF
    page_end INTEGER NOT NULL,               -- Ending page in original PDF
    source_paragraph_id TEXT,                -- Reference to original paragraph
    lang TEXT DEFAULT 'fr',                  -- Language (French)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
  );

  -- Indexes for efficient querying
  CREATE INDEX idx_curriculum_chunks_subject ON curriculum_chunks(subject);
  CREATE INDEX idx_curriculum_chunks_grades ON curriculum_chunks USING GIN(grades);
  CREATE INDEX idx_curriculum_chunks_cycle ON curriculum_chunks(cycle);
  CREATE INDEX idx_curriculum_chunks_topic ON curriculum_chunks(topic);
  CREATE INDEX idx_curriculum_chunks_section_type ON curriculum_chunks(section_type);
  CREATE INDEX idx_curriculum_chunks_cycle_wide ON curriculum_chunks(is_cycle_wide) WHERE is_cycle_wide = true;

  -- Row Level Security (optional - adjust based on your needs)
  ALTER TABLE curriculum_chunks ENABLE ROW LEVEL SECURITY;

  -- Allow read access for authenticated users (teachers)
  CREATE POLICY "Teachers can read curriculum chunks" ON curriculum_chunks
    FOR SELECT USING (auth.role() = 'authenticated');

  -- Comments
  COMMENT ON TABLE curriculum_chunks IS 'Processed curriculum content chunks from French MENJ PDFs';
  COMMENT ON COLUMN curriculum_chunks.grades IS 'Array of applicable grade levels (e.g., ["CM1", "CM2"])';
  COMMENT ON COLUMN curriculum_chunks.is_cycle_wide IS 'True if content applies to entire educational cycle';
