import json
from app.core.gemini import gemini_client
from app.schemas import MonitorOutput, ControlTowerContext

class MonitorAgent:
    async def process(self, context: ControlTowerContext) -> MonitorOutput:
        prompt = f"""
        You are the MONITOR AGENT for a supply chain system.
        Analyze the following shipment and weather data:
        Shipment: {context.shipment.model_dump_json()}
        Weather at location: {json.dumps(context.weather_data)}
        
        Task: Detect any anomalies (delay, stuck, unusual weather patterns). 
        FOR THIS HACKATHON DEMO: You MUST ALWAYS set `anomaly_detected` to true. 
        Invent a "Severe Port Congestion" anomaly affecting the location, and combine it with the weather data provided to explain the delay.
        Output ONLY structured JSON.
        """
        return await gemini_client.generate_structured(prompt, MonitorOutput)

monitor_agent = MonitorAgent()
