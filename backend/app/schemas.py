from pydantic import BaseModel, Field
from typing import List, Optional

class VendorScore(BaseModel):
    vendor_name: str
    reliability_score: int
    cost_efficiency: int
    delay_history_rating: str

class SLAContract(BaseModel):
    max_delay_hours: int = 12
    penalty_per_hour: int = 50000
    contract_status: str = "SAFE"

class IoTData(BaseModel):
    temperature_c: float
    humidity_percent: float
    container_locked: bool
    status_alert: str = "NORMAL"

class MultiShipmentDependency(BaseModel):
    related_shipment_id: str
    dependency_type: str = "Warehouse Sync"
    impact_delay_hours: int

class ShipmentData(BaseModel):
    id: str
    origin: str
    destination: str
    current_location: str
    eta: str
    status: str
    vendor: str
    vendor_details: Optional[VendorScore] = None
    sla_contract: Optional[SLAContract] = None
    iot_telemetry: Optional[IoTData] = None
    dependencies: List[MultiShipmentDependency] = []

class TrafficCongestionOutput(BaseModel):
    route_status: str = "Clear"
    congestion_index: int = 20
    delay_minutes: int = 0

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
    high_risk_zones: List[str] = Field(default=[])

class FinancialImpact(BaseModel):
    delay_cost: int
    rerouting_cost: int
    penalty_avoided: int
    net_savings: int

class DecisionOption(BaseModel):
    action: str = Field(description="The proposed action, e.g., Switch Vendor, Reroute.")
    pros: List[str] = Field(description="Pros of this action.")
    cons: List[str] = Field(description="Cons of this action.")
    confidence_score: float = Field(description="Confidence from 0.0 to 1.0.")
    financials: Optional[FinancialImpact] = None

class DecisionOutput(BaseModel):
    options: List[DecisionOption] = Field(description="List of proposed options.")
    recommended_action: str = Field(description="The best option selected.")
    auto_pilot_executed: bool = Field(default=False)

class SimulationOutput(BaseModel):
    selected_option_validated: str = Field(description="The simulated option.")
    time_impact: str = Field(description="Simulated impact on time.")
    cost_impact: str = Field(description="Simulated impact on cost.")
    reliability_score: int = Field(description="Score out of 100.")
    comparison_summary: str = Field(description="Why this option won in simulation.")
    self_learning_feedback: str = Field(default="Feedback merged into matrix")

class PolicyOutput(BaseModel):
    approved: bool = Field(description="Whether the action is approved under business policy.")
    budget_constraint_met: bool = Field(description="True if within budget.")
    notes: str = Field(description="Policy violation or approval notes.")

class ReportOutput(BaseModel):
    summary: str = Field(description="Final summary of the event and actions.")
    actions_taken: List[str] = Field(description="Actions finalized to be taken.")
    explanation: str = Field(description="Clear explanation of the entire logic chain.")
    blockchain_audit_hash: str = Field(default="0x000000000000")

class AgentTrace(BaseModel):
    shipment_id: Optional[str] = None
    agent_name: str
    status: str
    logs: List[str]
    output: Optional[dict] = None

class DemandSyncOutput(BaseModel):
    demand_status: str = "Stable"
    shortage_risk_percent: int = 15
    market_impact: str = "None"

class ControlTowerContext(BaseModel):
    shipment: ShipmentData
    weather_data: dict = {}
    traffic_data: Optional[TrafficCongestionOutput] = None
    monitor_result: Optional[MonitorOutput] = None
    eta_result: Optional[ETAOutput] = None
    risk_result: Optional[RiskOutput] = None
    decision_result: Optional[DecisionOutput] = None
    simulation_result: Optional[SimulationOutput] = None
    policy_result: Optional[PolicyOutput] = None
    report_result: Optional[ReportOutput] = None
    demand_sync: Optional[DemandSyncOutput] = None
    auto_pilot_mode: bool = False

class DisturbanceRequest(BaseModel):
    shipment_id: str
    disturbance_type: str  # e.g., "Cyclone", "Port Strike", "Heavy Flood"
    severity: str        # e.g., "Critical", "Moderate"
    description: str

class DisturbanceResponse(BaseModel):
    status: str
    message: str
