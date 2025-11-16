"""
Mistral OCR Client for Local PDF Processing
NO CLOUD STORAGE - Processes PDFs from local disk only
"""

import os
import base64
from pathlib import Path
from typing import Dict, Any, Optional, List
from mistralai import Mistral


class MistralOCRClient:
    """Client for processing local PDF files with Mistral OCR API"""

    def __init__(self):
        self.client = Mistral(api_key=os.getenv('MISTRAL_API_KEY'))
        self.model = os.getenv('MISTRAL_MODEL', 'mistral-ocr-2505')

    def extract_text_from_pdf_bytes(self, pdf_bytes: bytes, filename: str = "document.pdf") -> Optional[Dict[str, Any]]:
        """
        Extract text from PDF bytes using Mistral OCR API

        Args:
            pdf_bytes: Raw PDF file bytes
            filename: Original filename for reference

        Returns:
            OCR result dictionary or None if failed
        """
        try:
            print(f"[OCR] Processing: {filename}")

            # Save to temporary file to pass to OCR API
            import tempfile
            with tempfile.NamedTemporaryFile(mode='wb', suffix='.pdf', delete=False) as tmp_file:
                tmp_file.write(pdf_bytes)
                tmp_path = tmp_file.name

            try:
                # Call Mistral OCR API - upload file directly
                import base64
                with open(tmp_path, 'rb') as pdf_file:
                    pdf_b64 = base64.b64encode(pdf_file.read()).decode('utf-8')

                response = self.client.ocr.process(
                    model=self.model,
                    document={
                        "type": "document_url",
                        "document_url": f"data:application/pdf;base64,{pdf_b64}"
                    }
                )

                # Extract text from OCR response pages
                if response and hasattr(response, 'pages'):
                    # Combine all page markdown text
                    page_texts = [page.markdown for page in response.pages if hasattr(page, 'markdown')]
                    ocr_text = '\n\n'.join(page_texts)

                    print(f"[OK] Extracted {len(ocr_text)} characters from {filename} ({len(page_texts)} pages)")

                    # Parse the OCR result with full structured data
                    parsed_result = self._parse_ocr_response(ocr_text, filename, response)
                    return parsed_result
                else:
                    print(f"[ERROR] No OCR response received for {filename}")
                    return None

            finally:
                # Clean up temporary file
                import os
                if os.path.exists(tmp_path):
                    os.unlink(tmp_path)

        except Exception as e:
            print(f"[ERROR] Error in OCR extraction for {filename}: {e}")
            return None

    def extract_text_from_file(self, file_path: str) -> Optional[Dict[str, Any]]:
        """
        Extract text from a PDF file on disk

        Args:
            file_path: Path to the PDF file

        Returns:
            OCR result dictionary or None if failed
        """
        try:
            with open(file_path, 'rb') as f:
                pdf_bytes = f.read()

            filename = os.path.basename(file_path)
            return self.extract_text_from_pdf_bytes(pdf_bytes, filename)

        except Exception as e:
            print(f"Error reading PDF file {file_path}: {e}")
            return None

    def _parse_ocr_response(self, ocr_text: str, filename: str, raw_response: Any = None) -> Dict[str, Any]:
        """
        Parse the OCR response into structured format

        Args:
            ocr_text: Raw OCR text from Mistral
            filename: Original filename
            raw_response: Full Mistral OCR response object (optional)

        Returns:
            Structured OCR result with full metadata
        """
        import json
        
        # Split by pages if page markers exist
        pages = self._split_by_pages(ocr_text)

        # Create structured result
        result = {
            "filename": filename,
            "doc_id": self._generate_doc_id(filename),
            "total_pages": len(pages),
            "pages": [],
            "raw_ocr_data": None  # Will store full structured output
        }

        # Extract structured data from raw response if available
        if raw_response and hasattr(raw_response, 'pages'):
            structured_pages = []
            
            for page_idx, page in enumerate(raw_response.pages):
                page_data = {
                    "page_number": page_idx + 1,
                    "markdown": getattr(page, 'markdown', ''),
                    "text": getattr(page, 'text', ''),
                }
                
                # Extract additional metadata if available
                if hasattr(page, 'metadata'):
                    page_data['metadata'] = self._serialize_object(page.metadata)
                
                if hasattr(page, 'bounding_boxes'):
                    page_data['bounding_boxes'] = self._serialize_object(page.bounding_boxes)
                
                if hasattr(page, 'confidence'):
                    page_data['confidence'] = page.confidence
                
                if hasattr(page, 'language'):
                    page_data['language'] = page.language
                
                # Add any other attributes from the page object
                for attr in dir(page):
                    if not attr.startswith('_') and attr not in ['markdown', 'text', 'metadata', 'bounding_boxes', 'confidence', 'language']:
                        try:
                            value = getattr(page, attr)
                            if not callable(value):
                                page_data[attr] = self._serialize_object(value)
                        except:
                            pass
                
                structured_pages.append(page_data)
            
            # Store the full structured OCR data
            result["raw_ocr_data"] = {
                "model": self.model,
                "pages": structured_pages,
                "total_pages": len(structured_pages)
            }
            
            # Also save to JSON file for debugging/analysis
            self._save_ocr_json(result["raw_ocr_data"], filename, result["doc_id"])

        # Create simplified pages for chunking (backward compatible)
        for page_num, page_text in enumerate(pages, 1):
            page_data = {
                "page_number": page_num,
                "text": page_text.strip(),
                "char_count": len(page_text.strip())
            }
            result["pages"].append(page_data)

        return result
    
    def _serialize_object(self, obj: Any) -> Any:
        """
        Serialize an object to JSON-compatible format
        
        Args:
            obj: Object to serialize
            
        Returns:
            JSON-compatible representation
        """
        import json
        
        if obj is None:
            return None
        
        # Handle basic types
        if isinstance(obj, (str, int, float, bool)):
            return obj
        
        # Handle lists
        if isinstance(obj, list):
            return [self._serialize_object(item) for item in obj]
        
        # Handle dicts
        if isinstance(obj, dict):
            return {key: self._serialize_object(value) for key, value in obj.items()}
        
        # Handle objects with __dict__
        if hasattr(obj, '__dict__'):
            return self._serialize_object(obj.__dict__)
        
        # Try to convert to string as fallback
        try:
            return str(obj)
        except:
            return None
    
    def _save_ocr_json(self, ocr_data: Dict[str, Any], filename: str, doc_id: str):
        """
        Save OCR structured output to JSON file
        
        Args:
            ocr_data: Structured OCR data
            filename: Original PDF filename
            doc_id: Document ID
        """
        import json
        from pathlib import Path
        
        # Create output directory
        output_dir = Path("ocr_outputs")
        output_dir.mkdir(exist_ok=True)
        
        # Save JSON file
        output_file = output_dir / f"{doc_id}_{filename.replace('.pdf', '')}.json"
        
        try:
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(ocr_data, f, indent=2, ensure_ascii=False)
            print(f"   [SAVED] OCR JSON: {output_file}")
        except Exception as e:
            print(f"   [WARNING] Could not save OCR JSON: {e}")

    def _split_by_pages(self, ocr_text: str) -> List[str]:
        """
        Split OCR text into pages

        Args:
            ocr_text: Raw OCR text

        Returns:
            List of page texts
        """
        # Look for page markers in the OCR text
        page_markers = [
            r'Page \d+',
            r'page \d+',
            r'--- Page \d+ ---',
            r'\n\d+\n',  # Simple page numbers
        ]

        pages = [ocr_text]  # Default: single page

        for marker_pattern in page_markers:
            if len(pages) > 1:
                break  # Already split

            import re
            if re.search(marker_pattern, ocr_text, re.IGNORECASE):
                # Split by page markers
                pages = re.split(marker_pattern, ocr_text)
                pages = [page.strip() for page in pages if page.strip()]
                break

        # If still single page but very long, try to split by content
        if len(pages) == 1 and len(ocr_text) > 10000:
            # Split long text into approximate pages
            chunk_size = 5000  # Approximate characters per page
            pages = [ocr_text[i:i + chunk_size] for i in range(0, len(ocr_text), chunk_size)]

        return pages

    def _generate_doc_id(self, filename: str) -> str:
        """Generate a unique document ID from filename"""
        import hashlib
        return hashlib.md5(filename.encode()).hexdigest()[:16]

    def batch_process_pdfs(self, pdf_files: List[str]) -> List[Dict[str, Any]]:
        """
        Process multiple PDF files

        Args:
            pdf_files: List of PDF file paths

        Returns:
            List of OCR results
        """
        results = []

        for pdf_file in pdf_files:
            print(f"Processing PDF: {pdf_file}")
            result = self.extract_text_from_file(pdf_file)
            if result:
                results.append(result)
            else:
                print(f"Failed to process {pdf_file}")

        print(f"Successfully processed {len(results)}/{len(pdf_files)} PDFs")
        return results


# Convenience functions
def extract_curriculum_pdf_text(file_path: str) -> Optional[Dict[str, Any]]:
    """Extract text from a curriculum PDF file"""
    client = MistralOCRClient()
    return client.extract_text_from_file(file_path)


def batch_extract_curriculum_pdfs(pdf_files: List[str]) -> List[Dict[str, Any]]:
    """Extract text from multiple curriculum PDFs"""
    client = MistralOCRClient()
    return client.batch_process_pdfs(pdf_files)


if __name__ == "__main__":
    # Example usage
    import sys

    if len(sys.argv) != 2:
        print("Usage: python ocr_service.py <pdf_file_path>")
        sys.exit(1)

    pdf_path = sys.argv[1]

    print("Mistral OCR Service Test")
    print(f"Processing: {pdf_path}")

    result = extract_curriculum_pdf_text(pdf_path)

    if result:
        print(f"Success! Extracted {result['total_pages']} pages")
        print(f"Doc ID: {result['doc_id']}")
        print(f"First page preview: {result['pages'][0]['text'][:200]}...")
    else:
        print("OCR extraction failed")
