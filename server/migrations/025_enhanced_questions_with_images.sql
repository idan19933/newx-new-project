-- Migration 025: Enhanced Questions with Images, Equations, and Diagrams
-- Supports mathematical equations, embedded images, and diagram extraction

-- 1. Add new columns to questions table
ALTER TABLE questions
    ADD COLUMN IF NOT EXISTS equations JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS question_images JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS has_diagrams BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS diagram_description TEXT,
    ADD COLUMN IF NOT EXISTS raw_math_content TEXT;

-- 2. Add new columns to exam_uploads for enhanced processing
ALTER TABLE exam_uploads
    ADD COLUMN IF NOT EXISTS contains_diagrams BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS extracted_images_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS processing_metadata JSONB DEFAULT '{}'::jsonb;

-- 3. Create table for storing extracted images from exams
CREATE TABLE IF NOT EXISTS exam_extracted_images (
                                                     id SERIAL PRIMARY KEY,
                                                     exam_upload_id INTEGER REFERENCES exam_uploads(id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    image_type VARCHAR(50), -- 'diagram', 'graph', 'illustration', 'equation'
    description TEXT,
    extracted_at TIMESTAMP DEFAULT NOW(),
    storage_path TEXT,
    width INTEGER,
    height INTEGER,
    CONSTRAINT fk_exam_upload FOREIGN KEY (exam_upload_id) REFERENCES exam_uploads(id),
    CONSTRAINT fk_question FOREIGN KEY (question_id) REFERENCES questions(id)
    );

-- 4. Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_questions_has_diagrams ON questions(has_diagrams);
CREATE INDEX IF NOT EXISTS idx_exam_images_question ON exam_extracted_images(question_id);
CREATE INDEX IF NOT EXISTS idx_exam_images_type ON exam_extracted_images(image_type);
CREATE INDEX IF NOT EXISTS idx_exam_uploads_diagrams ON exam_uploads(contains_diagrams);

-- 5. Add comments for documentation
COMMENT ON COLUMN questions.equations IS 'JSON array of mathematical equations in LaTeX format';
COMMENT ON COLUMN questions.question_images IS 'JSON array of image URLs associated with this question';
COMMENT ON COLUMN questions.has_diagrams IS 'TRUE if question contains graphs, diagrams, or illustrations';
COMMENT ON COLUMN questions.diagram_description IS 'Description of diagrams/graphs in the question';
COMMENT ON COLUMN questions.raw_math_content IS 'Raw mathematical content for rendering';

COMMENT ON TABLE exam_extracted_images IS 'Stores images extracted from exam pages';
COMMENT ON COLUMN exam_extracted_images.image_type IS 'Type of image: diagram, graph, illustration, equation';

-- 6. Create function to count images per question
CREATE OR REPLACE FUNCTION count_question_images(question_id_param INTEGER)
RETURNS INTEGER AS $$
BEGIN
RETURN (
    SELECT COUNT(*)
    FROM exam_extracted_images
    WHERE question_id = question_id_param
);
END;
$$ LANGUAGE plpgsql;

-- 7. Create view for questions with full image data
CREATE OR REPLACE VIEW questions_with_images AS
SELECT
    q.*,
    COALESCE(
            (SELECT json_agg(
                            json_build_object(
                                    'id', ei.id,
                                    'url', ei.image_url,
                                    'type', ei.image_type,
                                    'description', ei.description
                            ) ORDER BY ei.id
                    )
             FROM exam_extracted_images ei
             WHERE ei.question_id = q.id),
            '[]'::json
    ) as images
FROM questions q;

-- Migration complete
SELECT 'Migration 025 completed successfully!' as status,
       'Added support for equations, diagrams, and image extraction' as description;