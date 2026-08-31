from typing import Dict, Any, List, Optional

class DocumentLoader:
    """
    RAG Document loader component for extracting and chunking documents.
    """
    def load(self, file_path: str, filename: str) -> Dict[str, Any]:
        return {
            "filename": filename,
            "path": file_path,
            "status": "ready"
        }
