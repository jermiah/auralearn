# Mistral OCR Structured Output Capture Guide

## Overview

The curriculum ingestion pipeline now captures and stores the **complete structured output** from Mistral OCR API, not just the extracted text. This provides access to all metadata, confidence scores, bounding boxes, and other structured data that Mistral returns.

## What's Captured

### 1. **Text Content** ✅
- **Markdown format**: Structured text with formatting preserved
- **Plain text**: Raw text extraction
- Both formats are captured for each page

### 2. **Page Metadata** ✅
- Page numbers
- Character counts
- Language detection (if available)
- Confidence scores (if available)

### 3. **Structured Data** ✅
- **Bounding boxes**: Coordinates for text elements (if available)
- **Document metadata**: Any additional metadata from Mistral
- **All page attributes**: Any other data Mistral provides

### 4. **JSON Export** ✅
- Full OCR response saved to `ocr_outputs/` directory
- One JSON file per PDF document
- Filename format: `{doc_id}_{filename}.json`

## File Structure

```
aura-learn/
├── backend/assessment_pipeline/ingestion/
│   └── ocr_client.py          # Enhanced OCR client
├── ocr_outputs/                # Auto-created directory
│   ├── {doc_id}_document1.json
│   ├── {doc_id}_document2.json
│   └── ...
└── .gitignore                  # ocr_outputs/ excluded from git
```

## OCR Response Structure

The enhanced `ocr_client.py` now returns:

```python
{
    "filename": "document.pdf",
    "doc_id": "abc123def456",
    "total_pages": 108,
    "pages": [
        {
            "page_number": 1,
            "text": "extracted text...",
            "char_count": 5000
        },
        # ... more pages
    ],
    "raw_ocr_data": {
        "model": "mistral-ocr-2505",
        "total_pages": 108,
        "pages": [
            {
                "page_number": 1,
                "markdown": "# Heading\n\nText...",
                "text": "plain text...",
                "metadata": {...},           # If available
                "bounding_boxes": [...],     # If available
                "confidence": 0.95,          # If available
                "language": "fr",            # If available
                # ... any other attributes Mistral provides
            },
            # ... more pages with full metadata
        ]
    }
}
```

## Key Features

### 1. **Backward Compatible**
- Existing chunking pipeline still works with simplified `pages` array
- No changes needed to downstream code

### 2. **Full Data Preservation**
- All Mistral OCR data is captured in `raw_ocr_data`
- Nothing is lost from the original response

### 3. **Automatic JSON Export**
- Every PDF processed gets a JSON file saved
- Useful for debugging, analysis, and future enhancements

### 4. **Flexible Serialization**
- Handles complex objects from Mistral API
- Converts to JSON-compatible format automatically

## Code Changes

### Enhanced Methods

#### `extract_text_from_pdf_bytes()`
- Now passes full `response` object to parser
- Captures complete OCR data

#### `_parse_ocr_response()`
- New parameter: `raw_response` (optional)
- Extracts all available attributes from response
- Stores in `raw_ocr_data` field

#### `_serialize_object()` (NEW)
- Converts complex objects to JSON-compatible format
- Handles nested structures, lists, dicts
- Fallback to string representation

#### `_save_ocr_json()` (NEW)
- Saves structured OCR data to JSON file
- Creates `ocr_outputs/` directory automatically
- UTF-8 encoding for French characters

## Usage

### Running the Pipeline

```bash
# Activate virtual environment
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate     # Windows

# Run ingestion
python backend/assessment_pipeline/ingestion/ingest_curriculum.py
```

### Output

```
[OCR] Processing: document.pdf
[OK] Extracted 310773 characters from document.pdf (108 pages)
[SAVED] OCR JSON: ocr_outputs/abc123def456_document.json
```

### Accessing Structured Data

```python
from backend.assessment_pipeline.ingestion.ocr_client import MistralOCRClient

client = MistralOCRClient()
result = client.extract_text_from_file("path/to/document.pdf")

# Access simplified pages (for chunking)
for page in result['pages']:
    print(f"Page {page['page_number']}: {page['text'][:100]}...")

# Access full structured data
if result['raw_ocr_data']:
    for page in result['raw_ocr_data']['pages']:
        print(f"Page {page['page_number']}:")
        print(f"  Markdown: {page['markdown'][:100]}...")
        print(f"  Confidence: {page.get('confidence', 'N/A')}")
        print(f"  Language: {page.get('language', 'N/A')}")
        if 'bounding_boxes' in page:
            print(f"  Bounding boxes: {len(page['bounding_boxes'])} elements")
```

## JSON File Example

```json
{
  "model": "mistral-ocr-2505",
  "total_pages": 108,
  "pages": [
    {
      "page_number": 1,
      "markdown": "# Cycle 3\n\n## Français\n\nLes programmes...",
      "text": "Cycle 3 Français Les programmes...",
      "metadata": {
        "page_width": 595,
        "page_height": 842
      },
      "confidence": 0.98,
      "language": "fr"
    }
  ]
}
```

## Benefits

### 1. **Future-Proof**
- Can leverage additional Mistral features as they're added
- No need to re-process PDFs if we need more data

### 2. **Debugging**
- JSON files help troubleshoot OCR issues
- Can inspect what Mistral actually returned

### 3. **Enhanced Features**
- Can use confidence scores for quality filtering
- Bounding boxes enable precise text location
- Metadata enables advanced document analysis

### 4. **Research & Analysis**
- Full data available for improving chunking algorithms
- Can analyze OCR quality across documents
- Enables A/B testing of different processing approaches

## Configuration

### Environment Variables

```bash
# .env file
MISTRAL_API_KEY=your_api_key_here
MISTRAL_MODEL=mistral-ocr-2505
```

### Output Directory

The `ocr_outputs/` directory is:
- ✅ Auto-created if it doesn't exist
- ✅ Excluded from git (in `.gitignore`)
- ✅ Safe to delete (can be regenerated)

## Testing

### Verify Structured Output

```bash
# Process a single PDF
python backend/assessment_pipeline/ingestion/ocr_client.py path/to/test.pdf

# Check the JSON output
cat ocr_outputs/{doc_id}_test.json | jq .
```

### Inspect Captured Data

```python
import json

# Load saved OCR data
with open('ocr_outputs/{doc_id}_document.json', 'r', encoding='utf-8') as f:
    ocr_data = json.load(f)

# Inspect structure
print(f"Model: {ocr_data['model']}")
print(f"Total pages: {ocr_data['total_pages']}")

# Check what data is available
first_page = ocr_data['pages'][0]
print(f"Available fields: {list(first_page.keys())}")
```

## Troubleshooting

### JSON Files Not Created

**Issue**: No JSON files in `ocr_outputs/`

**Solutions**:
1. Check write permissions on directory
2. Verify OCR extraction succeeded
3. Check console for `[SAVED]` messages

### Missing Metadata

**Issue**: Some fields are `null` or missing

**Explanation**: Mistral may not return all fields for every document. The code captures whatever is available.

### Large JSON Files

**Issue**: JSON files are very large

**Solution**: This is normal for documents with many pages or detailed bounding boxes. The files are compressed well by git if needed.

## Next Steps

### Potential Enhancements

1. **Database Storage**: Store `raw_ocr_data` in Supabase JSONB column
2. **Confidence Filtering**: Skip low-confidence chunks
3. **Bounding Box Visualization**: Create visual overlays on PDFs
4. **Language Detection**: Auto-detect and tag content language
5. **Quality Metrics**: Track OCR quality across documents

### Integration Ideas

1. **Advanced Chunking**: Use bounding boxes for smarter splitting
2. **Table Extraction**: Leverage structured data for tables
3. **Multi-language Support**: Use language detection for routing
4. **Quality Assurance**: Flag low-confidence extractions for review

## Summary

The enhanced OCR client now provides:
- ✅ Complete structured output from Mistral OCR
- ✅ Automatic JSON export for all processed PDFs
- ✅ Backward compatibility with existing pipeline
- ✅ Foundation for advanced features

All changes have been committed to the `rag_pipeline` branch.
