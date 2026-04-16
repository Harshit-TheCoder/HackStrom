import json
from app.core.llm import llm_factory
from app.schemas import MonitorOutput, ControlTowerContext

class MonitorAgent:
    async def process(self, context: ControlTowerContext) -> MonitorOutput:
        prompt = f"""
        You are the MONITOR AGENT for a supply chain system.
        Analyze the following shipment and weather data:
        Shipment: {context.shipment.model_dump_json()}
        Weather at location: {json.dumps(context.weather_data)}
        
        Task: Detect any anomalies (delay, stuck, unusual weather patterns). 
        IMPORTANT: If the weather or data contains the tag "(MANUALLY CREATED)", you MUST include that EXACT tag in your `anomaly_type` and starting of your `description`.
        
        Analyze the provided data objectively. If weather conditions are clear and there are no traffic delays, set `anomaly_detected` to false and `anomaly_type` to "Normal". 
        Only detect anomalies if there are visible disruptions in the provided telemetry, weather, or traffic data.
        Output ONLY structured JSON.
        """
        return await llm_factory.generate_structured(prompt, MonitorOutput)

monitor_agent = MonitorAgent()
