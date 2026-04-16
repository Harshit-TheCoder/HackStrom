import chromadb
from chromadb import Documents, EmbeddingFunction, Embeddings
from google import genai
from app.core.config import settings
import uuid

class GeminiEmbeddingFunction(EmbeddingFunction):
    """Custom embedding function using google-genai text-embedding-004."""
    def __init__(self):
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY) if settings.GEMINI_API_KEY else None
    
    def __call__(self, input: Documents) -> Embeddings:
        if not self.client:
            # Fallback for dev without key
            return [[0.1] * 768 for _ in input]
            
        try:
            # Try different variations of model naming and fallback logic
            models_to_try = [
                'text-embedding-004',         # Standard
                'models/text-embedding-004',  # Explicit prefix
                'embedding-001',              # Stable fallback
                'models/embedding-001'        # Explicit prefix stable
            ]
            
            last_error = None
            for model_name in models_to_try:
                try:
                    response = self.client.models.embed_content(
                        model=model_name,
                        contents=input,
                    )
                    return [embed.values for embed in response.embeddings]
                except Exception as e:
                    last_error = e
                    continue
            
            # If all model attempts fail, return a fallback embedding to keep the app functional
            if last_error:
                print(f"Embedding service unavailable (falling back to dummy): {last_error}")
            return [[0.1] * 768 for _ in input]
            
        except Exception as e:
            print(f"Unexpected embedding error: {e}")
            return [[0.0] * 768 for _ in input]

class MemoryRepository:
    """Manages the Vector DB for Supply Chain historical memory."""
    def __init__(self):
        # Using in-memory client for hackathon
        self.client = chromadb.Client()
        self.collection = None
        self._initialized = False

    async def initialize(self):
        """Async-safe initialization to prevent blocking startup."""
        if self._initialized:
            return
            
        try:
            self.collection = self.client.get_or_create_collection(
                name="supply_chain_incidents",
                embedding_function=GeminiEmbeddingFunction()
            )
            await self._seed_data()
            self._initialized = True
            print("Memory repository initialized successfully.")
        except Exception as e:
            print(f"Failed to initialize memory repository: {e}")

    async def _seed_data(self):
        """Seed dummy historical incidents to give the Decision Agent context."""
        if not self.collection:
            return
            
        existing = self.collection.count()
        if existing > 0:
            return
            
        events = [
            "Severe congestion at Chennai Port causing 3 day delays. Rerouting to Ennore port saved $5000 and 1 day.",
            "Hurricane near Florida coast. Vessels anchored. Delay probability 90%. Best action: Air freight critical components.",
            "Vendor B missed delivery due to raw material shortage. Vendor C was contracted at a 15% premium but met deadlines.",
            "Customs strike at Port of LA. Suggested action: wait out the 2-day strike as alternative ports are saturated."
        ]
        
        try:
            self.collection.add(
                documents=events,
                ids=[str(uuid.uuid4()) for _ in events]
            )
        except Exception as e:
            print(f"Seeding error (this is okay, falling back): {e}")

    def retrieve_similar(self, query: str, n_results: int = 2) -> list[str]:
        if not self._initialized or not self.collection:
            return []
            
        try:
            results = self.collection.query(
                query_texts=[query],
                n_results=n_results
            )
            if results and results["documents"] and results["documents"][0]:
                return results["documents"][0]
        except Exception as e:
            print(f"Retrieval error: {e}")
            
        return []

vector_memory = MemoryRepository()
