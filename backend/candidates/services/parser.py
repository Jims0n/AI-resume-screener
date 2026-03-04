import fitz  # PyMuPDF
from docx import Document
import logging

logger = logging.getLogger(__name__)


def extract_text(file_path: str) -> str:
    """Extract text from PDF or DOCX files."""
    file_path_lower = file_path.lower()

    try:
        if file_path_lower.endswith('.pdf'):
            doc = fitz.open(file_path)
            text = ""
            for page in doc:
                text += page.get_text()
            doc.close()
            return text.strip()

        elif file_path_lower.endswith('.docx'):
            doc = Document(file_path)
            return "\n".join([p.text for p in doc.paragraphs if p.text.strip()]).strip()

        else:
            raise ValueError(f"Unsupported file type: {file_path}")

    except Exception as e:
        logger.error(f"Failed to extract text from {file_path}: {e}")
        raise
