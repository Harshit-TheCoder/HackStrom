from pydantic import BaseModel, Field
from typing import List, Optional

class ShipmentData(BaseModel):
    id: str
    origin: str
    destination: str
    current_location: str
    eta: str
    status: str
    vendor: str

class MonitorOutput(BaseModel):
    anomaly_detected: bool = Field(description="True if an anomaly is detected.")
    anomaly_type: str = Field(description="e.g., Delay, Stuck, Weather Disruption, Normal")
    description: str = Field(description="Detailed explanation of the anomaly.")

class ETAOutput(BaseModel):
    original_eta: str = Field(description="The initially planned ETA.")
    predicted_eta: str = Field(description="New predicted ETA based on current conditions.")
    delay_probability_percent: int = Field(description="Percentage probability of delay.")
    reasoning: str = Field(description="Explanation of why the ETA changed.")

class RiskOutput(BaseModel):
    risk_score: int = Field(description="Score from 0 to 100.")
    risk_category: str = Field(description="LOW, MEDIUM, or HIGH.")
    reason: str = Field(description="Explanation of why this risk exists.")

class DecisionOption(BaseModel):
    action: str = Field(description="The proposed action, e.g., Switch Vendor, Reroute.")
    pros: List[str] = Field(description="Pros of this action.")
    cons: List[str] = Field(description="Cons of this action.")
    confidence_score: float = Field(description="Confidence from 0.0 to 1.0.")
    expected_cost_impact: str = Field(description="Estimated cost impact.")

class DecisionOutput(BaseModel):
    options: List[DecisionOption] = Field(description="List of proposed options.")
    recommended_action: str = Field(description="The best option selected.")

class SimulationOutput(BaseModel):
    selected_option_validated: str = Field(description="The simulated option.")
    time_impact: str = Field(description="Simulated impact on time.")
    cost_impact: str = Field(description="Simulated impact on cost.")
    reliability_score: int = Field(description="Score out of 100.")
    comparison_summary: str = Field(description="Why this option won in simulation.")

class PolicyOutput(BaseModel):
    approved: bool = Field(description="Whether the action is approved under business policy.")
    budget_constraint_met: bool = Field(description="True if within budget.")
    notes: str = Field(description="Policy violation or approval notes.")

class ReportOutput(BaseModel):
    summary: str = Field(description="Final summary of the event and actions.")
    actions_taken: List[str] = Field(description="Actions finalized to be taken.")
    explanation: str = Field(description="Clear explanation of the entire logic chain.")

class AgentTrace(BaseModel):
    agent_name: str
    status: str
    logs: List[str]
    output: Optional[dict] = None

class ControlTowerContext(BaseModel):
    shipment: ShipmentData
    weather_data: dict = {}
    monitor_result: Optional[MonitorOutput] = None
    eta_result: Optional[ETAOutput] = None
    risk_result: Optional[RiskOutput] = None
    decision_result: Optional[DecisionOutput] = None
    simulation_result: Optional[SimulationOutput] = None
    policy_result: Optional[PolicyOutput] = None
    report_result: Optional[ReportOutput] = None
