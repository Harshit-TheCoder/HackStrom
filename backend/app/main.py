import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from app.core.ws import manager
from app.schemas import ControlTowerContext, ShipmentData
from app.infrastructure.weather import weather_client
from app.orchestrator.pipeline import orchestrator
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.db.database import init_db
from app.modules.auth import router as auth_router
from contextlib import asynccontextmanager
from app.core.events import event_bus

limiter = Limiter(key_func=get_remote_address)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB on startup
    await init_db()
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

app.add_middleware(SecurityHeadersMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global State
global_contexts = {}
simulation_running = False

@app.get("/health")
@limiter.limit("5/minute")
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
    global global_contexts, simulation_running
    import random
    
    shipments = [
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

    for ship in shipments:
        global_contexts[ship.id] = ControlTowerContext(
            shipment=ship, weather_data={}, traffic_data={},
            demand_sync={"demand_status": "NOMINAL", "shortage_risk_percent": 10, "market_impact": "None"},
            auto_pilot_mode=False
        )
    
    while simulation_running:
        for ship in shipments:
            w_ctx = global_contexts[ship.id]
            curr_ship = w_ctx.shipment

            # Fluctuate IoT randomly for the demo
            curr_ship.iot_telemetry.temperature_c += random.uniform(-0.5, 0.5)
            curr_ship.iot_telemetry.humidity_percent += random.uniform(-1.0, 1.0)
            
            weather_city_map = {
               "Approaching Chennai Port": "Chennai",
               "Arabian Sea": "Mumbai",
               "Bay of Bengal": "Visakhapatnam",
               "Malacca Strait": "Singapore",
               "Red Sea": "Dubai",
               "Mediterranean": "Rome"
            }
            city_to_query = weather_city_map.get(curr_ship.current_location, "London")
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
            global_contexts[ship.id] = await orchestrator.run_pipeline(ctx)
            
        # Re-run loop every X seconds for the demo
        await asyncio.sleep(8)

@app.post("/api/start")
async def start_simulation(background_tasks: BackgroundTasks):
    global simulation_running
    if not simulation_running:
        simulation_running = True
        # Kick off background task
        background_tasks.add_task(run_simulation_loop)
    return {"status": "started"}

@app.post("/api/stop")
async def stop_simulation():
    global simulation_running
    simulation_running = False
    return {"status": "stopped"}

@app.get("/api/state")
async def get_state(shipment_id: str = "SHP-X9001"):
    ctx = global_contexts.get(shipment_id)
    if not ctx:
        return {"status": "idle"}
    return ctx.model_dump()

@app.get("/api/states")
async def get_all_states():
    # Return mapping of all states
    return {sid: ctx.model_dump() for sid, ctx in global_contexts.items()}
