from app.core.gemini import gemini_client
from app.schemas import DecisionOutput, ControlTowerContext
from app.infrastructure.memory import vector_memory
import json

class DecisionAgent:
    async def process(self, context: ControlTowerContext) -> DecisionOutput:
        # Construct RAG query
        query = " ".join([
            context.monitor_result.description if context.monitor_result else "",
            context.risk_result.reason if context.risk_result else "",
            "Shipment is delayed."
        ])
        
        historical_context = vector_memory.retrieve_similar(query)
        
        prompt = f"""
        You are the DECISION AGENT.
        Current Situation:
        Risk: {context.risk_result.model_dump_json() if context.risk_result else "None"}
        ETA: {context.eta_result.model_dump_json() if context.eta_result else "None"}
        
        Past Similar RAG Cases: {json.dumps(historical_context)}
        
        Task: Propose multiple actionable strategies (e.g. rerouting, vendor switching).
        Include pros/cons, a confidence score (0.0 to 1.0), and estimated cost impact.
        Select one recommended action.
        """
        return await gemini_client.generate_structured(prompt, DecisionOutput)

decision_agent = DecisionAgent()
