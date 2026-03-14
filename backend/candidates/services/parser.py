import logging
import fitz  # PyMuPDF
from docx import Document

info_logger = logging.getLogger('app_info')
error_logger = logging.getLogger('app_error')


def extract_text(file_path: str) -> str:
    """Extract text from PDF or DOCX files."""
    file_path_lower = file_path.lower()

    try:
        if file_path_lower.endswith('.pdf'):
            doc = fitz.open(file_path)
            text = ""
            for page in doc:
                text += page.get_text()
            page_count = doc.page_count
            doc.close()
            info_logger.info(f"PDF text extracted: path={file_path} pages={page_count} chars={len(text.strip())}")
            return text.strip()

        elif file_path_lower.endswith('.docx'):
            doc = Document(file_path)
            text = "\n".join([p.text for p in doc.paragraphs if p.text.strip()]).strip()
            info_logger.info(f"DOCX text extracted: path={file_path} chars={len(text)}")
            return text

        else:
            raise ValueError(f"Unsupported file type: {file_path}")

    except Exception as e:
        error_logger.error(f"Failed to extract text from {file_path}: {e}", exc_info=True)
        raise
