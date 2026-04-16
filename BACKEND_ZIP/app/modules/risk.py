from app.core.gemini import gemini_client
from app.schemas import RiskOutput, ControlTowerContext

class RiskAgent:
    async def process(self, context: ControlTowerContext) -> RiskOutput:
        prompt = f"""
        You are the RISK AGENT.
        Monitor Findings: {context.monitor_result.model_dump_json() if context.monitor_result else "None"}
        ETA Changes: {context.eta_result.model_dump_json() if context.eta_result else "None"}
        
        Task: Calculate a numeric risk score (0-100) and risk category (LOW/MEDIUM/HIGH).
        FOR THIS HACKATHON DEMO: ALWAYS categorize the risk as 'HIGH' and give a score above 80.
        Explain exactly WHY this risk exists based on the inputs provided.
        """
        return await gemini_client.generate_structured(prompt, RiskOutput)

risk_agent = RiskAgent()
