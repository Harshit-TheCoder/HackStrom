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
            # google-genai can embed a list of strings
            response = self.client.models.embed_content(
                model='text-embedding-004',
                contents=input,
            )
            return [embed.values for embed in response.embeddings]
        except Exception as e:
            print(f"Embedding error: {e}")
            return [[0.0] * 768 for _ in input]

class MemoryRepository:
    """Manages the Vector DB for Supply Chain historical memory."""
    def __init__(self):
        # Using in-memory client for hackathon
        self.client = chromadb.Client()
        self.collection = self.client.get_or_create_collection(
            name="supply_chain_incidents",
            embedding_function=GeminiEmbeddingFunction()
        )
        self._seed_data()

    def _seed_data(self):
        """Seed dummy historical incidents to give the Decision Agent context."""
        existing = self.collection.count()
        if existing > 0:
            return
            
        events = [
            "Severe congestion at Chennai Port causing 3 day delays. Rerouting to Ennore port saved $5000 and 1 day.",
            "Hurricane near Florida coast. Vessels anchored. Delay probability 90%. Best action: Air freight critical components.",
            "Vendor B missed delivery due to raw material shortage. Vendor C was contracted at a 15% premium but met deadlines.",
            "Customs strike at Port of LA. Suggested action: wait out the 2-day strike as alternative ports are saturated."
        ]
        
        self.collection.add(
            documents=events,
            ids=[str(uuid.uuid4()) for _ in events]
        )

    def retrieve_similar(self, query: str, n_results: int = 2) -> list[str]:
        results = self.collection.query(
            query_texts=[query],
            n_results=n_results
        )
        if results and results["documents"] and results["documents"][0]:
            return results["documents"][0]
        return []

vector_memory = MemoryRepository()
