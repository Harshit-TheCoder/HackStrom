import json
from app.core.llm import llm_factory
from app.schemas import ReportOutput, ControlTowerContext

class ReportAgent:
    async def process(self, context: ControlTowerContext) -> ReportOutput:
        # Pass a subset to avoid token limits, but for hackathon we pass the whole context
        prompt = f"""
        You are the REPORT AGENT.
        Final State before reporting:
        Risk: {context.risk_result.model_dump_json() if context.risk_result else 'None'}
        Decision: {context.decision_result.model_dump_json() if context.decision_result else 'None'}
        Simulation: {context.simulation_result.model_dump_json() if context.simulation_result else 'None'}
        Policy: {context.policy_result.model_dump_json() if context.policy_result else 'None'}
        
        Task: Synthesize the final structured JSON payload containing the summary, explicitly approved actions to take, and a clear explanation of the entire logic chain.
        This output will be consumed by the dashboard and stakeholders.
        """
        return await llm_factory.generate_structured(prompt, ReportOutput)

report_agent = ReportAgent()
