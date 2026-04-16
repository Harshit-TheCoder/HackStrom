import json
from app.core.llm import llm_factory
from app.schemas import SimulationOutput, ControlTowerContext

class SimulationAgent:
    async def process(self, context: ControlTowerContext) -> SimulationOutput:
        prompt = f"""
        You are the SIMULATION AGENT.
        Proposed Decisions: {context.decision_result.model_dump_json() if context.decision_result else "None"}
        
        Task: Simulate the execution of the 'recommended_action' chosen by the Decision Agent.
        Estimate the quantitative impact on time and cost.
        Provide a reliability score out of 100 for this action.
        """
        return await llm_factory.generate_structured(prompt, SimulationOutput)

simulation_agent = SimulationAgent()
