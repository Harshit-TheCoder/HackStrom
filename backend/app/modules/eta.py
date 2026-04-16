import json
from app.core.gemini import gemini_client
from app.schemas import ETAOutput, ControlTowerContext

class ETAAgent:
    async def process(self, context: ControlTowerContext) -> ETAOutput:
        prompt = f"""
        You are the ETA AGENT.
        Original ETA: {context.shipment.eta}
        Monitor Findings: {context.monitor_result.model_dump_json() if context.monitor_result else "None"}
        Weather: {json.dumps(context.weather_data)}
        
        Task: Recalculate the predicted ETA. Factor in weather severity and anomalies.
        Provide the probability of delay as a percentage.
        """
        return await gemini_client.generate_structured(prompt, ETAOutput)

eta_agent = ETAAgent()
