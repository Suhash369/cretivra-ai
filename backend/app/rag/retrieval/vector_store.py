from typing import List, Dict, Any, Optional

class VectorStore:
    """
    RAG Vector Store interface for ChromaDB / local vector indexing.
    """
    def __init__(self):
        self._index: Dict[str, Any] = {}

    def add_documents(self, docs: List[Dict[str, Any]]):
        pass

    def similarity_search(self, query: str, top_k: int = 4) -> List[Dict[str, Any]]:
        return []
