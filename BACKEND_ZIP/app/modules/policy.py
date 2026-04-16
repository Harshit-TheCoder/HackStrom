from app.core.gemini import gemini_client
from app.schemas import PolicyOutput, ControlTowerContext

class PolicyAgent:
    async def process(self, context: ControlTowerContext) -> PolicyOutput:
        prompt = f"""
        You are the POLICY AGENT.
        Simulated Action: {context.simulation_result.model_dump_json() if context.simulation_result else "None"}
        
        Task: Validate the action against standard business policies (e.g. max cost impact allowed is 20% of shipment value, avoid unvetted vendors).
        Determine if the action is approved or rejected, and if budget constraints are met.
        """
        return await gemini_client.generate_structured(prompt, PolicyOutput)

policy_agent = PolicyAgent()
