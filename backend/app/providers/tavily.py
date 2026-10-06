# Tavily provider has been removed per architecture requirements.
# Allowed AI infrastructure providers: GEMINI, GROQ, OPENROUTER.

class RemovedTavilyProvider:
    def is_available(self) -> bool:
        return False
    async def search(self, query: str, max_results: int = 5, include_images: bool = False):
        return {"results": [], "images": []}

tavily_provider = RemovedTavilyProvider()
