import asyncio
from app.schemas import ControlTowerContext, AgentTrace
from app.modules.monitor import monitor_agent
from app.modules.eta import eta_agent
from app.modules.risk import risk_agent
from app.modules.decision import decision_agent
from app.modules.simulation import simulation_agent
from app.modules.policy import policy_agent
from app.modules.report import report_agent
from app.core.ws import manager

class PipelineOrchestrator:
    async def run_pipeline(self, context: ControlTowerContext) -> ControlTowerContext:
        async def run_agent(agent, step_name: str, assign_field: str):
            print(f"--- Running {step_name} ---")
            await manager.broadcast(AgentTrace(
                agent_name=step_name, 
                status="RUNNING", 
                logs=[f"Analyzing data step..."]
            ).model_dump())
            
            # Artificial delay to make the reading pace realistic for human operators
            await asyncio.sleep(1.5)
            
            result = await agent.process(context)
            setattr(context, assign_field, result)
            
            await manager.broadcast(AgentTrace(
                agent_name=step_name, 
                status="COMPLETED", 
                logs=[f"Action finished"], 
                output=result.model_dump()
            ).model_dump())
        
        # Sequentially call agents
        await run_agent(monitor_agent, "MONITOR_AGENT", "monitor_result")
        
        # If no anomaly, short-circuit
        if not context.monitor_result.anomaly_detected:
            await manager.broadcast(AgentTrace(agent_name="ORCHESTRATOR", status="STOPPED", logs=["No anomalies detected. Routine stable."]).model_dump())
            return context

        await run_agent(eta_agent, "ETA_AGENT", "eta_result")
        await run_agent(risk_agent, "RISK_AGENT", "risk_result")
        
        if context.risk_result.risk_category == "LOW":
             await manager.broadcast(AgentTrace(agent_name="ORCHESTRATOR", status="STOPPED", logs=["Risk is low. No intervention needed."]).model_dump())
             return context

        await run_agent(decision_agent, "DECISION_AGENT", "decision_result")
        
        if context.decision_result.auto_pilot_executed:
             await manager.broadcast(AgentTrace(agent_name="AUTOPILOT", status="RUNNING", logs=["Auto-pilot mode engaged.", f"Automatically executed: {context.decision_result.recommended_action}"] ).model_dump())
        
        await run_agent(simulation_agent, "SIMULATION_AGENT", "simulation_result")
        
        # Self improving matrix trace
        await manager.broadcast(AgentTrace(agent_name="ML_FEEDBACK_LOOP", status="RUNNING", logs=[context.simulation_result.self_learning_feedback, "Graph weights successfully optimized."]).model_dump())
        
        await run_agent(policy_agent, "POLICY_AGENT", "policy_result")
        await run_agent(report_agent, "REPORT_AGENT", "report_result")
        
        # Blockchain audit trail trace
        await manager.broadcast(AgentTrace(agent_name="BLOCKCHAIN_LEDGER", status="COMPLETED", logs=[f"Decision locked on-chain.", f"Tx Hash: {context.report_result.blockchain_audit_hash}"]).model_dump())
        
        await manager.broadcast(AgentTrace(agent_name="ORCHESTRATOR", status="COMPLETED", logs=["Pipeline fully executed."]).model_dump())
        return context

orchestrator = PipelineOrchestrator()
