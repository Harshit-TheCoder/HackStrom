from google import genai
from google.genai import types
from pydantic import BaseModel
from typing import Type, TypeVar
from app.core.config import settings

T = TypeVar("T", bound=BaseModel)

class GeminiFactory:
    """Factory to interact with Gemini 2.5 Flash via google-genai."""
    
    def __init__(self):
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY) if settings.GEMINI_API_KEY else None
        self.model_name = "gemini-2.5-flash"

    async def generate_structured(self, prompt: str, schema: Type[T]) -> T:
        """Helper to force structured JSON output from Gemini."""
        if not self.client:
            # Fallback for hackathon testing without real key
            print(f"No GEMINI_API_KEY. Using fallback dataset for {schema.__name__}.")
            return self._get_fallback_for_schema(schema)
        try:
            # Run the synchronous Gemini call in a separate thread so we don't block FastAPI's Event Loop!
            def call_gemini():
                return self.client.models.generate_content(
                    model=self.model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=schema,
                        temperature=0.2,
                    )
                )
            
            import asyncio
            response = await asyncio.wait_for(asyncio.to_thread(call_gemini), timeout=15.0)
            return schema.model_validate_json(response.text)
            
        except asyncio.TimeoutError:
            print(f"Gemini API Timeout for {schema.__name__}. Using fallback dataset.")
            return self._get_fallback_for_schema(schema)
        except Exception as e:
            print(f"Gemini API Error: {e}. Using fallback dataset.")
            return self._get_fallback_for_schema(schema)

    def _get_fallback_for_schema(self, schema: Type[T]) -> T:
        """Custom fake dataset fallback when AI is too slow or errors out (Dynamic Scenarios)."""
        import random
        
        scenarios = [
            # Scenario 1: Port Congestion
            {
                "MonitorOutput": {"anomaly_detected": True, "anomaly_type": "Severe Port Congestion", "description": "High volumes at Chennai Port due to storm warnings causing a 3-day backlog."},
                "ETAOutput": {"original_eta": "2026-04-18", "predicted_eta": "2026-04-21", "delay_probability_percent": 95, "reasoning": "Port congestion severely limits offloading capacity."},
                "RiskOutput": {"risk_score": 88, "risk_category": "HIGH", "reason": "3-day delay incurs heavy demurrage fees and impacts downstream manufacturing.", "high_risk_zones": ["Chennai Port", "Ennore"]},
                "DecisionOutput": {"options": [{"action": "Reroute to Ennore Port", "pros": ["Faster offloading"], "cons": ["Extra trucking cost"], "confidence_score": 0.85, "financials": {"delay_cost": 150000, "rerouting_cost": 30000, "penalty_avoided": 120000, "net_savings": 120000}}], "recommended_action": "Reroute to Ennore Port", "auto_pilot_executed": True},
                "SimulationOutput": {"selected_option_validated": "Reroute to Ennore Port", "time_impact": "Saves 2 days", "cost_impact": "Adds $2000 in transit", "reliability_score": 85, "comparison_summary": "Rerouting saves ₹1.2L vs delay penalty.", "self_learning_feedback": "Vendor Ennore Logistics updated: +5 Reliability."},
                "PolicyOutput": {"approved": True, "budget_constraint_met": True, "notes": "Approved under emergency routing policy exception."},
                "ReportOutput": {"summary": "Shipment delayed at Chennai. Rerouted to Ennore.", "actions_taken": ["Instructed carrier to divert"], "explanation": "Mitigated port congestion using fallback routing.", "blockchain_audit_hash": "0x4b7f9a831e5d22bcf45a1"}
            },
            # Scenario 2: Customs Regulatory Hold
            {
                "MonitorOutput": {"anomaly_detected": True, "anomaly_type": "Customs Documentation Hold", "description": "Bill of Lading discrepancies flagged by customs AI scanner. Container frozen."},
                "ETAOutput": {"original_eta": "2026-04-18", "predicted_eta": "2026-04-23", "delay_probability_percent": 100, "reasoning": "Standard regulatory clearing takes 5 business days without intervention."},
                "RiskOutput": {"risk_score": 92, "risk_category": "HIGH", "reason": "Perishable goods inside. A 5-day hold risks complete cargo spoilage.", "high_risk_zones": ["Customs Terminal B"]},
                "DecisionOutput": {"options": [{"action": "Engage Premium Broker", "pros": ["Clears in 24h"], "cons": ["High expedition fee"], "confidence_score": 0.90, "financials": {"delay_cost": 250000, "rerouting_cost": 50000, "penalty_avoided": 200000, "net_savings": 200000}}], "recommended_action": "Engage Premium Broker", "auto_pilot_executed": False},
                "SimulationOutput": {"selected_option_validated": "Engage Premium Broker", "time_impact": "Reduces delay to 1 day", "cost_impact": "$1500 expedition fee", "reliability_score": 90, "comparison_summary": "Saves perishable cargo worth $50,000 for a minor fee.", "self_learning_feedback": "Broker ML model weight adjusted: +0.02"},
                "PolicyOutput": {"approved": True, "budget_constraint_met": True, "notes": "Approved automatically due to high cargo value preservation rules."},
                "ReportOutput": {"summary": "Customs hold detected. Premium broker engaged.", "actions_taken": ["Dispatched fast-track broker"], "explanation": "Acted immediately to prevent spoilage of sensitive cargo.", "blockchain_audit_hash": "0x98fde2a1bc3649dd"}
            },
            # Scenario 3: Extreme Weather Event
            {
                "MonitorOutput": {"anomaly_detected": True, "anomaly_type": "Category 3 Cyclone", "description": "Cyclone approaching the eastern coast. Maritime authority orders ships to anchor offshore."},
                "ETAOutput": {"original_eta": "2026-04-18", "predicted_eta": "2026-04-22", "delay_probability_percent": 85, "reasoning": "Vessels must drift until the storm passes before docking operations resume."},
                "RiskOutput": {"risk_score": 75, "risk_category": "MEDIUM", "reason": "Routine weather delay. Schedule impact is moderate, material risk is low.", "high_risk_zones": ["Bay of Bengal South"]},
                "DecisionOutput": {"options": [{"action": "Drift offshore", "pros": ["Safest maneuver"], "cons": ["4-day delay"], "confidence_score": 0.95, "financials": {"delay_cost": 0, "rerouting_cost": 0, "penalty_avoided": 0, "net_savings": 0}}], "recommended_action": "Drift offshore", "auto_pilot_executed": True},
                "SimulationOutput": {"selected_option_validated": "Drift offshore", "time_impact": "Adds 4 days", "cost_impact": "Negligible fuel cost", "reliability_score": 99, "comparison_summary": "Safety protocol dictates drifting. Rerouting is highly dangerous.", "self_learning_feedback": "Weather matrix correlation updated"},
                "PolicyOutput": {"approved": True, "budget_constraint_met": True, "notes": "Aligned with mandatory maritime safety constraints."},
                "ReportOutput": {"summary": "Shipment anchored offshore due to cyclone.", "actions_taken": ["Ordered vessel to holding pattern"], "explanation": "Ensured vessel safety under maritime extreme weather SOP.", "blockchain_audit_hash": "0xff10294ab18239091c"}
            }
        ]

        # Use time seeding or simple random choice to grab a scenario
        import time
        # Pick one scenario pseudo-randomly that cycles nicely 
        # (So all agents in one single simulation loop pass get the SAME scenario!)
        # We can seed it by hour/minute so it remains stable for a full minute loop
        current_minute = int(time.time() / 60)
        scenario_idx = current_minute % len(scenarios)
        selected_scenario = scenarios[scenario_idx]
        
        name = schema.__name__
        if name in selected_scenario:
            return schema(**selected_scenario[name])
        return schema()

gemini_client = GeminiFactory()
