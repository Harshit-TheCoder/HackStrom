import asyncio
import time
from abc import ABC, abstractmethod
from typing import Type, TypeVar, Optional
from pydantic import BaseModel
from google import genai
from google.genai import types
from openai import OpenAI
from app.core.config import settings
from app.core.cache import llm_cache

T = TypeVar("T", bound=BaseModel)

def _get_fallback_for_schema(schema: Type[T]) -> T:
    """Custom fake dataset fallback when AI is too slow or errors out (Dynamic Scenarios)."""
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
    current_minute = int(time.time() / 60)
    scenario_idx = current_minute % len(scenarios)
    selected_scenario = scenarios[scenario_idx]
    name = schema.__name__
    if name in selected_scenario:
        return schema(**selected_scenario[name])
    return schema()

class LLMProvider(ABC):
    @abstractmethod
    async def generate_structured(self, prompt: str, schema: Type[T]) -> T:
        pass

class GeminiProvider(LLMProvider):
    def __init__(self):
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY) if settings.GEMINI_API_KEY else None
        self.model_name = "gemini-2.5-flash"

    async def generate_structured(self, prompt: str, schema: Type[T]) -> T:
        if not self.client:
            return _get_fallback_for_schema(schema)
        try:
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
            response = await asyncio.wait_for(asyncio.to_thread(call_gemini), timeout=15.0)
            return schema.model_validate_json(response.text)
        except Exception as e:
            print(f"Gemini Error: {e}")
            return _get_fallback_for_schema(schema)

class OpenAIProvider(LLMProvider):
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None
        self.model_name = "gpt-4o-mini"

    async def generate_structured(self, prompt: str, schema: Type[T]) -> T:
        if not self.client:
            return _get_fallback_for_schema(schema)
        try:
            def call_openai():
                return self.client.beta.chat.completions.parse(
                    model=self.model_name,
                    messages=[{"role": "user", "content": prompt}],
                    response_format=schema,
                    temperature=0.2,
                )
            response = await asyncio.wait_for(asyncio.to_thread(call_openai), timeout=15.0)
            return response.choices[0].message.parsed
        except Exception as e:
            print(f"OpenAI Error: {e}")
            return _get_fallback_for_schema(schema)

class LLMFactory:
    def __init__(self):
        self.providers = {
            "gemini": GeminiProvider(),
            "openai": OpenAIProvider()
        }

    async def generate_structured(self, prompt: str, schema: Type[T]) -> T:
        schema_name = schema.__name__
        cached_data = llm_cache.get(prompt, schema_name)
        if cached_data:
            print(f"LLM Cache Hit for {schema_name}")
            return schema.model_validate(cached_data)

        # Quota Check
        total_calls = llm_cache.get_api_call_count()
        if total_calls >= settings.MAX_LLM_CALLS:
            print(f"LLM API QUOTA EXCEEDED ({total_calls}/{settings.MAX_LLM_CALLS}). Falling back to dummy data.")
            return _get_fallback_for_schema(schema)

        # Call provider and increment count
        provider_name = settings.LLM_PROVIDER
        provider = self.providers.get(provider_name, self.providers["gemini"])
        result = await provider.generate_structured(prompt, schema)
        
        # Only increment quota for non-fallback results (if possible to distinguish)
        # For simplicity, we increment if we called the provider
        llm_cache.increment_api_call_count()
        
        llm_cache.set(prompt, schema_name, result.model_dump())
        return result

llm_factory = LLMFactory()
