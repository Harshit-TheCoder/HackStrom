import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from app.core.ws import manager
from app.schemas import ControlTowerContext, ShipmentData, DisturbanceRequest, DisturbanceResponse
from app.infrastructure.weather import weather_client
from app.orchestrator.pipeline import orchestrator
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from app.db import models
from app.db.database import db_manager, init_db
from app.core.idempotency import get_cached_request, save_request_result
from app.modules.auth import router as auth_router
from contextlib import asynccontextmanager
from app.infrastructure.memory import vector_memory
from app.core.events import event_bus
from app.core.dependencies import get_current_user
from fastapi import Depends

from app.core.telemetry import setup_telemetry
from prometheus_client import make_asgi_app

limiter = Limiter(key_func=get_remote_address)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Initialize Telemetry (Loki/Tempo/Prometheus)
    setup_telemetry(app)
    
    # 2. Initialize DB on startup
    await init_db()
    # 3. Initialize Vector Memory (ChromaDB)
    await vector_memory.initialize()
    # Start EventBus logic
    await event_bus.start()
    yield

app = FastAPI(title="Real-Time Supply Chain Control Tower API", version="1.0.0", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

app.add_middleware(SlowAPIMiddleware)
app.add_middleware(SecurityHeadersMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 📈 Mount Metrics Endpoint
app.mount("/metrics", make_asgi_app())

# Global State
global_contexts = {}
manual_disturbances = {}  # shipment_id -> disturbance_data
simulation_running = False

INITIAL_SHIPMENTS = [
    ShipmentData(
        id="SHP-X9001", origin="Singapore", destination="Mumbai Port", current_location="Approaching Chennai Port",
        eta="2026-04-18", status="IN_TRANSIT", vendor="Oceanic Freight",
        vendor_details={"vendor_name": "Oceanic Freight", "reliability_score": 82, "cost_efficiency": 75, "delay_history_rating": "Moderate"},
        sla_contract={"max_delay_hours": 12, "penalty_per_hour": 50000, "contract_status": "AT RISK"},
        iot_telemetry={"temperature_c": 4.5, "humidity_percent": 88.2, "container_locked": True, "status_alert": "NORMAL"},
        dependencies=[{"related_shipment_id": "SHP-X9002", "dependency_type": "JIT Factory Assembly", "impact_delay_hours": 24}]
    ),
    ShipmentData(
        id="SHP-X9002", origin="UAE Port", destination="Gujarat Port", current_location="Arabian Sea",
        eta="2026-04-19", status="IN_TRANSIT", vendor="Desert Star Logistics",
        vendor_details={"vendor_name": "Desert Star", "reliability_score": 90, "cost_efficiency": 85, "delay_history_rating": "Low"},
        sla_contract={"max_delay_hours": 24, "penalty_per_hour": 25000, "contract_status": "NOMINAL"},
        iot_telemetry={"temperature_c": 22.0, "humidity_percent": 45.0, "container_locked": True, "status_alert": "NORMAL"},
        dependencies=[]
    ),
    ShipmentData(
        id="SHP-X9003", origin="Singapore", destination="Vishakapatnam Port", current_location="Bay of Bengal",
        eta="2026-04-20", status="IN_TRANSIT", vendor="Eastern Seas Co",
        vendor_details={"vendor_name": "Eastern Seas", "reliability_score": 88, "cost_efficiency": 80, "delay_history_rating": "Low"},
        sla_contract={"max_delay_hours": 18, "penalty_per_hour": 30000, "contract_status": "NOMINAL"},
        iot_telemetry={"temperature_c": 18.0, "humidity_percent": 75.0, "container_locked": True, "status_alert": "NORMAL"},
        dependencies=[]
    ),
    ShipmentData(
        id="SHP-X9004", origin="Shanghai", destination="Mumbai Port", current_location="Malacca Strait",
        eta="2026-04-22", status="IN_TRANSIT", vendor="FarEast Cargo",
        vendor_details={"vendor_name": "FarEast", "reliability_score": 79, "cost_efficiency": 90, "delay_history_rating": "High"},
        sla_contract={"max_delay_hours": 48, "penalty_per_hour": 15000, "contract_status": "NOMINAL"},
        iot_telemetry={"temperature_c": 2.5, "humidity_percent": 65.0, "container_locked": True, "status_alert": "NORMAL"},
        dependencies=[]
    ),
    ShipmentData(
        id="SHP-X9005", origin="Rotterdam", destination="UAE Port", current_location="Red Sea",
        eta="2026-04-25", status="IN_TRANSIT", vendor="EuroLine Carriers",
        vendor_details={"vendor_name": "EuroLine", "reliability_score": 95, "cost_efficiency": 60, "delay_history_rating": "Very Low"},
        sla_contract={"max_delay_hours": 6, "penalty_per_hour": 100000, "contract_status": "NOMINAL"},
        iot_telemetry={"temperature_c": 5.0, "humidity_percent": 50.0, "container_locked": True, "status_alert": "NORMAL"},
        dependencies=[]
    ),
    ShipmentData(
        id="SHP-X9006", origin="New York", destination="Gujarat Port", current_location="Mediterranean",
        eta="2026-04-28", status="IN_TRANSIT", vendor="Atlantic Way",
        vendor_details={"vendor_name": "Atlantic Way", "reliability_score": 86, "cost_efficiency": 72, "delay_history_rating": "Moderate"},
        sla_contract={"max_delay_hours": 36, "penalty_per_hour": 20000, "contract_status": "NOMINAL"},
        iot_telemetry={"temperature_c": -12.0, "humidity_percent": 30.0, "container_locked": True, "status_alert": "NORMAL"},
        dependencies=[]
    ),
]

CHAOS_SCENARIOS = {
    "Suez Blockage": {
        "origin": "Shanghai",
        "destination": "Rotterdam",
        "current_location": "Suez Canal",
        "vendor": "Global Carriers",
        "description": "Evergreen type blockage in the main artery of global trade."
    },
    "Panama Drought": {
        "origin": "Houston",
        "destination": "Shanghai",
        "current_location": "Panama Canal",
        "vendor": "Pan-Oceanic",
        "description": "Critical water level drop restricting heavy vessel transit."
    },
    "Arctic Shortcut": {
        "origin": "Busan",
        "destination": "Oslo",
        "current_location": "Arctic Circle",
        "vendor": "Ice-Link Logistics",
        "description": "Experimental polar route under extreme environmental stress."
    },
    "Carrier Bankruptcy": {
        "origin": "New York",
        "destination": "London",
        "current_location": "Mid-Atlantic",
        "vendor": "Hanjin-esque Carriers",
        "description": "Immediate insolvency event freezing all assets at sea."
    },
    "Tsunami Warning": {
        "origin": "Singapore",
        "destination": "Mumbai Port",
        "current_location": "Indian Ocean",
        "vendor": "Apex Logistics",
        "description": "Regional infrastructure impact due to seismic activity sea-level rise."
    },
    "Cyber Lockdown": {
        "origin": "Frankfurt",
        "destination": "Singapore",
        "current_location": "Global Server Bank",
        "vendor": "SecureShip IT",
        "description": "Total IoT failure and remote system breach across the fleet."
    }
}

@app.get("/health")
async def health_check(request: Request):
    return {"status": "ok", "message": "Backend is running"}

app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])

@app.websocket("/ws/logs")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

async def run_simulation_loop():
    print("DEBUG: [simulation] Entering run_simulation_loop")
    global global_contexts, simulation_running
    import random
    
    # Initialize state with predefined shipments
    for ship in INITIAL_SHIPMENTS:
        if ship.id not in global_contexts:
            global_contexts[ship.id] = ControlTowerContext(
                shipment=ship, weather_data={}, traffic_data={},
                demand_sync={"demand_status": "NOMINAL", "shortage_risk_percent": 10, "market_impact": "None"},
                auto_pilot_mode=False
            )
    
    while simulation_running:
        active_ids = list(global_contexts.keys())
        for sid in active_ids:
            w_ctx = global_contexts[sid]
            curr_ship = w_ctx.shipment

            # Fluctuate IoT randomly for the demo
            if curr_ship.iot_telemetry:
                curr_ship.iot_telemetry.temperature_c += random.uniform(-0.5, 0.5)
                curr_ship.iot_telemetry.humidity_percent += random.uniform(-1.0, 1.0)
            
            weather_city_map = {
               "Approaching Chennai Port": "Chennai",
               "Arabian Sea": "Mumbai",
               "Bay of Bengal": "Visakhapatnam",
               "Malacca Strait": "Singapore",
               "Red Sea": "Dubai",
               "Mediterranean": "Rome",
               "Suez Canal": "Suez",
               "Panama Canal": "Panama City"
            }
            city_to_query = weather_city_map.get(curr_ship.current_location, "London")
            
            # Check for manual overrides
            if sid in manual_disturbances:
                dist = manual_disturbances[sid]
                weather_data = {
                    "weather": [{"main": f"{dist['disturbance_type']} (MANUALLY CREATED)", "description": dist["description"]}],
                    "main": {"temp": 25.0, "humidity": 90},
                    "wind": {"speed": 50.0 if "Critical" in dist["severity"] else 15.0},
                    "is_manual": True
                }
            else:
                weather_data = await weather_client.get_weather_by_city(city_to_query)
            
            if not weather_data:
                weather_data = {}
            
            traffic_data = {
                "route_status": "Severe Congestion" if random.random() > 0.8 else "Clear",
                "congestion_index": random.randint(20, 100),
                "delay_minutes": random.randint(0, 120) if random.random() > 0.8 else 0
            }
            
            ctx = ControlTowerContext(
                shipment=curr_ship,
                weather_data=weather_data,
                traffic_data=traffic_data,
                demand_sync=w_ctx.demand_sync,
                auto_pilot_mode=False
            )
            
            # Run orchestrated agents
            print(f"DEBUG: [simulation] Running pipeline for {sid}")
            global_contexts[sid] = await orchestrator.run_pipeline(ctx)
            
        # Re-run loop every X seconds for the demo
        await asyncio.sleep(8)

@app.post("/api/start", dependencies=[Depends(get_current_user)])
@limiter.limit("10/minute")
async def start_simulation(
    request: Request, 
    background_tasks: BackgroundTasks, 
    current_user: models.User = Depends(get_current_user)
):
    print("DEBUG: [api] POST /api/start received")
    
    # Idempotency Check
    idempotency_key = request.headers.get("X-Idempotency-Key")
    user_id = current_user.id
    
    if idempotency_key:
        async with db_manager.session() as db:
            cached = await get_cached_request(db, idempotency_key, "/api/start", user_id)
            if cached:
                return cached[1]
    
    global simulation_running
    if not simulation_running:
        simulation_running = True
        # Kick off background task
        background_tasks.add_task(run_simulation_loop)
    
    res = {"status": "started"}
    
    if idempotency_key:
        async with db_manager.session() as db:
            await save_request_result(db, idempotency_key, "/api/start", 200, res, user_id)
            
    return res

@app.post("/api/stop", dependencies=[Depends(get_current_user)])
@limiter.limit("10/minute")
async def stop_simulation(
    request: Request, 
    current_user: models.User = Depends(get_current_user)
):
    print("DEBUG: [api] POST /api/stop received")
    
    # Idempotency Check
    idempotency_key = request.headers.get("X-Idempotency-Key")
    user_id = current_user.id
    
    if idempotency_key:
        async with db_manager.session() as db:
            cached = await get_cached_request(db, idempotency_key, "/api/stop", user_id)
            if cached:
                return cached[1]
    
    global simulation_running
    simulation_running = False
    res = {"status": "stopped"}
    
    if idempotency_key:
        async with db_manager.session() as db:
            await save_request_result(db, idempotency_key, "/api/stop", 200, res, user_id)
            
    return res

@app.get("/api/state")
async def get_state(shipment_id: str = "SHP-X9001"):
    ctx = global_contexts.get(shipment_id)
    if not ctx:
        return {"status": "idle"}
    return ctx.model_dump()

@app.get("/api/states", dependencies=[Depends(get_current_user)])
@limiter.limit("30/minute")
async def get_all_states(request: Request):
    # Return mapping of all states
    return {sid: ctx.model_dump() for sid, ctx in global_contexts.items()}

@app.get("/api/shipments")
async def get_shipments(mode: str = "all"):
    """
    Returns shipments filtered by mode. 
    mode='nominal' -> standard shipments only.
    mode='chaos' -> chaos shipments (SHP-CH-*) only.
    mode='all' -> all shipments.
    """
    all_shipments = [{"id": sid, "route": f"{ctx.shipment.origin} ➔ {ctx.shipment.destination}"} for sid, ctx in global_contexts.items()]
    
    if mode == "nominal":
        return [s for s in all_shipments if not s["id"].startswith("SHP-CH-")]
    elif mode == "chaos":
        return [s for s in all_shipments if s["id"].startswith("SHP-CH-")]
    return all_shipments

@app.post("/api/disturb", response_model=DisturbanceResponse, dependencies=[Depends(get_current_user)])
@limiter.limit("10/minute")
async def create_disturbance(
    request: Request, 
    req: DisturbanceRequest, 
    current_user: models.User = Depends(get_current_user)
):
    # Idempotency Check
    idempotency_key = request.headers.get("X-Idempotency-Key")
    user_id = current_user.id
    
    if idempotency_key:
        async with db_manager.session() as db:
            cached = await get_cached_request(db, idempotency_key, "/api/disturb", user_id)
            if cached:
                return cached[1]
                
    # If the shipment doesn't exist, create a new separate Chaos shipment
    if req.shipment_id not in global_contexts:
        import random
        chaos_id = req.shipment_id if req.shipment_id.startswith("SHP-CH") else f"SHP-CH-{random.randint(100, 999)}"
        
        # Check if there's a scenario template for this type
        scenario = CHAOS_SCENARIOS.get(req.disturbance_type, {})
        
        new_ship = ShipmentData(
            id=chaos_id, 
            origin=scenario.get("origin", "Global Hub"), 
            destination=scenario.get("destination", "Crisis Zone"), 
            current_location=scenario.get("current_location", "Suez Canal"),
            eta="2026-05-01", 
            status="CRITICAL_TRANSIT" if "Suez" in req.disturbance_type else "ALERT", 
            vendor=scenario.get("vendor", "Chaos Logistics"),
            vendor_details={"vendor_name": scenario.get("vendor", "Chaos"), "reliability_score": 45, "cost_efficiency": 30, "delay_history_rating": "Extreme"},
            sla_contract={"max_delay_hours": 2, "penalty_per_hour": 500000, "contract_status": "EXPOSED"},
            iot_telemetry={"temperature_c": 15.0, "humidity_percent": 95.0, "container_locked": True, "status_alert": "DANGER"},
            dependencies=[]
        )
        global_contexts[new_ship.id] = ControlTowerContext(
            shipment=new_ship, weather_data={}, traffic_data={},
            demand_sync={"demand_status": "CRITICAL", "shortage_risk_percent": 85, "market_impact": "High"},
            auto_pilot_mode=False
        )
        target_id = new_ship.id
    else:
        target_id = req.shipment_id

    manual_disturbances[target_id] = req.model_dump()
    res = {"status": "success", "message": f"Injected {req.disturbance_type} into {target_id}"}
    
    if idempotency_key:
        async with db_manager.session() as db:
            await save_request_result(db, idempotency_key, "/api/disturb", 200, res, user_id)
            
    return res

@app.delete("/api/disturb/{shipment_id}", dependencies=[Depends(get_current_user)])
@limiter.limit("10/minute")
async def clear_disturbance(request: Request, shipment_id: str):
    if shipment_id in manual_disturbances:
        del manual_disturbances[shipment_id]
        return {"status": "success", "message": "Disturbance cleared"}
    return {"status": "error", "message": "No disturbance found"}
