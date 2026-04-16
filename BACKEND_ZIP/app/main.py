import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from app.core.ws import manager
from app.schemas import ControlTowerContext, ShipmentData
from app.infrastructure.weather import weather_client
from app.orchestrator.pipeline import orchestrator

app = FastAPI(title="Real-Time Supply Chain Control Tower API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global State
global_context = None
simulation_running = False

@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "Backend is running"}

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
    global global_context, simulation_running
    
    # Initialize basic shipment
    shipment = ShipmentData(
        id="SHP-X9001",
        origin="Singapore",
        destination="Mumbai",
        current_location="Approaching Chennai Port",
        eta="2026-04-18",
        status="IN_TRANSIT",
        vendor="Oceanic Freight"
    )
    
    while simulation_running:
        weather_data = await weather_client.get_weather_by_city("Chennai")
        
        global_context = ControlTowerContext(
            shipment=shipment,
            weather_data=weather_data
        )
        
        # Run orchestrated agents
        global_context = await orchestrator.run_pipeline(global_context)
        
        # Re-run loop every X seconds for the demo
        await asyncio.sleep(20)

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
async def get_state():
    if not global_context:
        return {"status": "idle"}
    return global_context.model_dump()
