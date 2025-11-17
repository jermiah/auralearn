# Curriculum Database Guide

## Overview

The `curriculum_chunks` table in Supabase contains processed French national curriculum content from official MENJ (Ministère de l'Éducation Nationale et de la Jeunesse) PDF documents. This database powers the AI-driven assessment generation system.

## Database Schema

### Table: `curriculum_chunks`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Auto-generated unique identifier (Primary Key) |
| `doc_id` | TEXT | Original PDF document identifier (MD5 hash of filename) |
| `cycle` | TEXT | Educational cycle (e.g., "Cycle 2", "Cycle 3") |
| `grades` | TEXT[] | Array of applicable grade levels (e.g., ["CM1", "CM2", "6e"]) |
| `subject` | TEXT | Subject area (e.g., "Mathématiques", "Français", "Sciences et technologie") |
| `section_type` | TEXT | Content type (e.g., "Compétences travaillées", "Objectifs", "Repères de progression") |
| `topic` | TEXT | Main topic or theme |
| `subtopic` | TEXT | Specific subtopic within the main topic |
| `is_cycle_wide` | BOOLEAN | True if content applies to entire cycle, false if grade-specific |
| `chunk_text` | TEXT | The actual curriculum content (150-300 tokens per chunk) |
| `page_start` | INTEGER | Starting page number in original PDF |
| `page_end` | INTEGER | Ending page number in original PDF |
| `source_paragraph_id` | TEXT | Reference identifier for the original paragraph |
| `lang` | TEXT | Language code (default: "fr" for French) |
| `created_at` | TIMESTAMP | Record creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

## Content Structure

### Chunking Strategy

The curriculum content is processed using a **three-level chunking system**:

1. **Level A - Subject Splitting**: Documents are split by major subject headings (Volet 1, Volet 2, Volet 3, subject names)
2. **Level B - Section Splitting**: Each subject is divided by section types (objectives, competencies, progression markers)
3. **Level C - Token-Based Chunking**: Sections are broken into 150-300 token chunks while preserving semantic coherence

### Subjects Covered

The database includes content for:
- **Mathématiques** (Mathematics)
- **Français** (French Language)
- **Sciences et technologie** (Science and Technology)
- **Histoire et géographie** (History and Geography)
- **Enseignement moral et civique** (Moral and Civic Education)
- **Éducation artistique** (Arts Education)
- **Langues vivantes** (Foreign Languages)
- **Éducation physique et sportive** (Physical Education)
- **Éducation à la vie affective et relationnelle** (Relationship and Affective Education)

### Grade Levels

- **Cycle 3**: CM1, CM2, 6e (Sixième)
- Additional cycles can be added as needed

## Using the Database for Assessment Generation

### Query Examples

#### 1. Get all chunks for a specific subject and grade:

```sql
SELECT * FROM curriculum_chunks
WHERE subject = 'Mathématiques'
  AND 'CM1' = ANY(grades)
ORDER BY page_start
LIMIT 50;
```

#### 2. Get cycle-wide content for a subject:

```sql
SELECT * FROM curriculum_chunks
WHERE subject = 'Français'
  AND is_cycle_wide = true;
```

#### 3. Get specific section types:

```sql
SELECT * FROM curriculum_chunks
WHERE subject = 'Sciences et technologie'
  AND section_type LIKE '%Compétences%'
  AND 'CM2' = ANY(grades);
```

#### 4. Search by topic:

```sql
SELECT * FROM curriculum_chunks
WHERE subject = 'Mathématiques'
  AND topic ILIKE '%fractions%'
  AND 'CM1' = ANY(grades);
```

### Python Client Usage

```python
from assessment_pipeline.ingestion.supabase_client import SupabaseClient

# Initialize client
client = SupabaseClient()

# Get chunks for specific subject and grades
chunks = client.get_chunks_by_subject_and_grades(
    subject='Mathématiques',
    grades=['CM1', 'CM2'],
    limit=50
)

# Get cycle-wide chunks
cycle_chunks = client.get_cycle_wide_chunks(
    subject='Français',
    limit=50
)

# Custom search with filters
filters = {
    'subject': 'Sciences et technologie',
    'cycle': '3',
    'is_cycle_wide': False
}
results = client.search_chunks(filters, limit=100)

# Get database statistics
stats = client.get_table_stats()
print(f"Total chunks: {stats['total_chunks']}")
print(f"Subjects: {stats['subjects']}")
print(f"Cycles: {stats['cycles']}")
```

## Assessment Generation Workflow

### Step 1: Retrieve Relevant Curriculum Content

Based on teacher's requirements (subject, grade, difficulty level), query the database to retrieve relevant curriculum chunks.

```python
# Example: Generate assessment for CM1 Mathematics
subject = "Mathématiques"
grade = "CM1"
target_level = "intermediate"

# Get relevant chunks
chunks = client.get_chunks_by_subject_and_grades(
    subject=subject,
    grades=[grade],
    limit=20
)
```

### Step 2: Context Building

Combine retrieved chunks to build context for the AI model:

```python
context = "\n\n".join([
    f"Topic: {chunk['topic']}\n"
    f"Section: {chunk['section_type']}\n"
    f"Content: {chunk['chunk_text']}"
    for chunk in chunks
])
```

### Step 3: Generate Questions

Use the context with an AI model (e.g., BLACKBOX AI) to generate assessment questions:

```python
from assessment_pipeline.blackbox_client import BlackboxClient

blackbox = BlackboxClient()

prompt = f"""
Based on the following French national curriculum content for {grade} {subject}:

{context}

Generate 5 assessment questions at {target_level} difficulty level.
Each question should:
- Test understanding of the curriculum content
- Be appropriate for {grade} students
- Include multiple choice options
- Provide correct answer and explanation
"""

questions = blackbox.generate_questions(prompt)
```

### Step 4: Store Generated Questions

Save generated questions to the `assessment_questions` table for reuse.

## Data Quality & Maintenance

### Current Status
- ✅ **1,329 chunks** successfully ingested from 11 PDF documents
- ✅ All chunks validated with Pydantic schemas
- ✅ Indexed for efficient querying by subject, grades, cycle, and topic

### Maintenance Tasks

1. **Regular Updates**: When new curriculum documents are released, run the ingestion pipeline
2. **Quality Checks**: Periodically verify chunk quality and completeness
3. **Performance Monitoring**: Monitor query performance and optimize indexes as needed

### Re-running Ingestion

To update or re-ingest curriculum content:

```bash
# Navigate to project directory
cd aura-learn

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Run ingestion script
python -B backend\assessment_pipeline\ingestion\ingest_curriculum.py
```

## Indexes

The following indexes are created for optimal query performance:

- `idx_curriculum_chunks_subject` - Subject filtering
- `idx_curriculum_chunks_grades` - Grade array filtering (GIN index)
- `idx_curriculum_chunks_cycle` - Cycle filtering
- `idx_curriculum_chunks_topic` - Topic filtering
- `idx_curriculum_chunks_section_type` - Section type filtering
- `idx_curriculum_chunks_cycle_wide` - Cycle-wide content filtering

## Security

Row Level Security (RLS) is enabled with the following policy:
- **Read Access**: Authenticated users (teachers) can read all curriculum chunks
- **Write Access**: Restricted to service role (ingestion pipeline only)

## Future Enhancements

1. **Vector Embeddings**: Add embedding column for semantic search
2. **Full-Text Search**: Implement PostgreSQL full-text search on `chunk_text`
3. **Difficulty Scoring**: Add AI-generated difficulty scores for each chunk
4. **Cross-References**: Link related chunks across subjects
5. **Multi-Language Support**: Add translations for international schools

## Support

For issues or questions about the curriculum database:
- Check the ingestion logs in `backend/assessment_pipeline/ingestion/`
- Review the schema in `backend/curriculum_chunks.sql`
- Consult the ingestion pipeline code in `backend/assessment_pipeline/ingestion/`
