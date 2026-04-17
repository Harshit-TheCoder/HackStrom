# Nexus Global AI Control Tower — Full Feature Reference

A complete breakdown of every feature in the Nexus Control Tower platform.

---

## Table of Contents

1. [Authentication & Security](#1-authentication--security)
2. [Multi-Agent AI Pipeline](#2-multi-agent-ai-pipeline)
3. [Real-Time Simulation Engine](#3-real-time-simulation-engine)
4. [Role-Based Dashboard](#4-role-based-dashboard)
5. [3D Globe Visualization](#5-3d-globe-visualization)
6. [Geospatial Weather Map](#6-geospatial-weather-map)
7. [Shipment Tracker](#7-shipment-tracker)
8. [IoT Telemetry Monitoring](#8-iot-telemetry-monitoring)
9. [Financial Intelligence Engine](#9-financial-intelligence-engine)
10. [SLA Contract Monitoring](#10-sla-contract-monitoring)
11. [Vendor Reliability Scoring](#11-vendor-reliability-scoring)
12. [Auto-Pilot Autonomous Mode](#12-auto-pilot-autonomous-mode)
13. [Chaos Mode](#13-chaos-mode)
14. [Real-Time Reasoning Terminal](#14-real-time-reasoning-terminal)
15. [Risk Alert System](#15-risk-alert-system)
16. [Cascading Shipment Dependencies](#16-cascading-shipment-dependencies)
17. [Predictive ETA Engine](#17-predictive-eta-engine)
18. [Blockchain-Style Audit Trail](#18-blockchain-style-audit-trail)
19. [Fleet History Logs](#19-fleet-history-logs)
20. [Observability Stack](#20-observability-stack)
21. [Infrastructure & Deployment](#21-infrastructure--deployment)

---

## 1. Authentication & Security

### Email / Password Login with MFA
- Users register with email, password, and full name
- Passwords hashed with bcrypt — never stored in plain text
- Email and full name encrypted at rest using Fernet symmetric encryption (PII protection)
- On login, a 6-digit OTP is generated and sent to the user's email via SMTP
- OTP is verified at `/api/auth/verify-mfa` before a JWT is issued
- OTP is cleared from the database immediately after successful verification

### Google OAuth (Login & Signup)
- Both the login and signup pages support "Sign in / Sign up with Google"
- Uses the `@react-oauth/google` library on the frontend
- Google ID token is sent to the backend and verified using the official `google-auth` library
- On first Google login, a user account is automatically created (no password, MFA skipped)
- Returns a standard JWT — same session flow as email/password users

### JWT-Based Session Management
- Access tokens signed with HS256, expire in 30 minutes
- Tokens stored in `localStorage` on the frontend
- All protected API endpoints require `Authorization: Bearer <token>` header
- Invalid or expired tokens return `401 Session Expired`

### Route Protection
- Frontend: `ProtectedRoute` component checks for a valid token before rendering any page
- Backend: `get_current_user` dependency validates the JWT on every protected endpoint
- Role-based access control available via `RequireRole` dependency

### Security Headers
Every API response includes:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000`

### Rate Limiting
- `/api/start` and `/api/stop`: 10 requests/minute
- `/api/states`: 30 requests/minute
- `/api/disturb`: 10 requests/minute
- Powered by SlowAPI; returns `429 Too Many Requests` on breach

### Idempotency
- Key endpoints (`/api/start`, `/api/stop`, `/api/disturb`) support `X-Idempotency-Key` header
- Duplicate requests with the same key return the cached response — safe to retry

---

## 2. Multi-Agent AI Pipeline

The core intelligence of Nexus. Every shipment is processed through a sequential chain of 7 specialized AI agents on each simulation tick.

### Agent 1 — Monitor
- Detects anomalies in the shipment context (weather, traffic, IoT alerts)
- Outputs: `anomaly_detected`, `anomaly_type`, `description`
- Examples: "Severe Port Congestion", "Category 3 Cyclone", "Customs Documentation Hold"

### Agent 2 — ETA
- Predicts the revised delivery window based on detected anomalies
- Outputs: `original_eta`, `predicted_eta`, `delay_probability_percent`, `reasoning`

### Agent 3 — Risk
- Computes a risk score (0–100) and category (LOW / MEDIUM / HIGH)
- Identifies high-risk geographic zones
- Outputs: `risk_score`, `risk_category`, `reason`, `high_risk_zones`

### Agent 4 — Decision
- Generates actionable intervention options with pros, cons, and confidence scores
- Calculates full financial breakdown per option
- Outputs: `options[]`, `recommended_action`, `auto_pilot_executed`, `alternative_route`, `policy_impact`

### Agent 5 — Simulation
- Validates the recommended decision against counterfactual scenarios
- Outputs: `time_impact`, `cost_impact`, `reliability_score`, `comparison_summary`, `self_learning_feedback`

### Agent 6 — Policy
- Checks the decision against budget constraints and compliance rules
- Outputs: `approved`, `budget_constraint_met`, `notes`

### Agent 7 — Report
- Generates a human-readable executive summary of the entire pipeline run
- Outputs: `summary`, `actions_taken`, `explanation`, `blockchain_audit_hash`

### LLM Providers
- Supports both **Gemini 2.5 Flash** and **GPT-4o-mini** (OpenAI)
- Provider selected via `LLM_PROVIDER` environment variable (`gemini` or `openai`)
- Structured JSON output enforced via Pydantic schemas
- 15-second timeout per agent call
- Automatic fallback to pre-built scenario data if the LLM is unavailable or quota is exceeded

### LLM Caching
- Responses cached in-memory to avoid redundant API calls
- API call quota enforced via `MAX_LLM_CALLS` setting
- Cache hit logged to console

---

## 3. Real-Time Simulation Engine

### Simulation Loop
- Runs as a background async task when `/api/start` is called
- Processes all active shipments every 2 seconds
- Each tick: fetches live weather, generates random traffic data, runs the full 7-agent pipeline
- Stops cleanly when `/api/stop` is called

### Multiple Simultaneous Shipments
Six pre-loaded shipments run in parallel:

| ID | Route |
|----|-------|
| SHP-X9001 | Singapore → Mumbai Port |
| SHP-X9002 | UAE Port → Gujarat Port |
| SHP-X9003 | Singapore → Visakhapatnam Port |
| SHP-X9004 | Shanghai → Mumbai Port |
| SHP-X9005 | Rotterdam → UAE Port |
| SHP-X9006 | New York → Gujarat Port |

### Live IoT Fluctuation
- Container temperature and humidity values fluctuate randomly on each tick (±0.5°C, ±1% humidity)
- Simulates real sensor noise from in-transit containers

### WebSocket Streaming
- Agent logs streamed in real time over `ws://localhost:8000/ws/logs`
- Frontend receives and renders each agent's reasoning as it happens
- Auto-reconnects on disconnect (3-second retry)

---

## 4. Role-Based Dashboard

The dashboard layout dynamically reflows based on the selected operator role:

| Role | Focus |
|------|-------|
| **OPS** | Balanced view — Globe, Tracker, Map, Action Cards |
| **LOGISTICS** | Map-first — large weather map, then tracker and globe side by side |
| **FINANCE** | Cost-first — Action Cards (financials) at top, map below |

Role is selected via tab buttons in the navbar. No page reload required.

---

## 5. 3D Globe Visualization

- Built with `React Three Fiber` and `Three.js`
- Renders an interactive 3D Earth with real port coordinates
- Animated arcs connect origin and destination ports for the active shipment
- Pulsing glow effect on active route nodes
- Rotates automatically; user can drag to inspect any angle

---

## 6. Geospatial Weather Map

- Built with `Pigeon Maps` and `React Leaflet`
- Centers on the shipment's current location
- Displays live weather conditions fetched from OpenWeather API
- When a risk is detected, a red pulsing heatmap overlay renders over the danger coordinates
- Shows wind speed, temperature, humidity, and weather description
- Updates every simulation tick

---

## 7. Shipment Tracker

- Displays full shipment card for the active shipment
- Shows: ID, origin, destination, current location, status badge, ETA
- Live-updating vendor details, SLA status, and IoT telemetry
- Color-coded status badges: `IN_TRANSIT` (cyan), `AT RISK` (amber), `CRITICAL` (red)
- Shipment selector dropdown in the navbar to switch between all 6 shipments

---

## 8. IoT Telemetry Monitoring

Each shipment carries a simulated IoT sensor payload:

| Sensor | Description |
|--------|-------------|
| Temperature (°C) | Internal container temperature |
| Humidity (%) | Internal container humidity |
| Container Lock | Whether the container seal is intact |
| Status Alert | NORMAL / WARNING / DANGER |

- Values fluctuate in real time on each simulation tick
- Threshold breaches trigger status escalation
- Displayed on the shipment tracker card

---

## 9. Financial Intelligence Engine

Displayed in the Action Cards component:

- **Delay Cost** — projected financial loss from the current delay
- **Rerouting Cost** — cost of the AI-recommended intervention
- **Penalty Avoided** — SLA penalty saved by acting
- **Net Savings** — bottom-line impact of taking the recommended action
- All values sourced directly from the Decision Agent output
- Finance role view puts this panel at the top of the dashboard

---

## 10. SLA Contract Monitoring

Each shipment has an SLA contract with:
- `max_delay_hours` — maximum acceptable delay
- `penalty_per_hour` — financial penalty per hour of breach
- `contract_status` — NOMINAL / AT RISK / EXPOSED

When the predicted delay exceeds `max_delay_hours`, the status flips to `AT RISK` and is highlighted in amber on the tracker card.

---

## 11. Vendor Reliability Scoring

Each vendor has a profile with:
- `reliability_score` (0–100%) — historical on-time performance
- `cost_efficiency` (0–100%) — cost competitiveness
- `delay_history_rating` — Very Low / Low / Moderate / High / Extreme

Scores are displayed on the shipment tracker and factored into the Decision Agent's recommendations. The Simulation Agent updates vendor scores via `self_learning_feedback` after each run.

---

## 12. Auto-Pilot Autonomous Mode

- Toggle switch in the navbar header
- When ON: the Decision Agent's `auto_pilot_executed` flag is set to `true`
- The system autonomously executes rerouting decisions without waiting for human approval
- State is persisted per shipment on the backend
- Toggle syncs bidirectionally — backend state reflected in the frontend on each poll

---

## 13. Chaos Mode

A dedicated chaos injection system for stress-testing the AI pipeline.

### Access
- "Launch Chaos Mode" button in the navbar → `/chaos` page
- Also available as a side panel on the main dashboard

### Pre-built Chaos Scenarios

| Scenario | Description |
|----------|-------------|
| Suez Blockage | Evergreen-style canal blockage |
| Panama Drought | Critical water level drop |
| Arctic Shortcut | Experimental polar route under stress |
| Carrier Bankruptcy | Immediate insolvency event at sea |
| Tsunami Warning | Seismic activity in the Indian Ocean |
| Cyber Lockdown | Total IoT failure and fleet breach |

### How It Works
- Selecting a scenario injects a manual disturbance into a shipment context
- The AI pipeline immediately processes the chaos event on the next tick
- A new chaos shipment (`SHP-CH-XXX`) is created if the target doesn't exist
- Chaos shipments have extreme SLA exposure and critical IoT alerts
- Disturbances can be cleared via the UI to return to normal simulation

---

## 14. Real-Time Reasoning Terminal

- Live WebSocket feed of all agent activity
- Each agent log entry shows: agent name, status (RUNNING / COMPLETE / ERROR), and log lines
- Typewriter-style rendering for a "live thinking" effect
- Color-coded by agent type
- Scrollable, auto-scrolls to latest entry
- Filters to only show logs for the currently selected shipment

---

## 15. Risk Alert System

- Floating alert stack fixed to the top-right of the dashboard
- Appears automatically when `risk_category === "HIGH"`
- Shows the risk reason from the Risk Agent
- Animated slide-in from the right
- Dismisses automatically when risk drops below HIGH

---

## 16. Cascading Shipment Dependencies

Each shipment can declare dependencies on other shipments:

```
SHP-X9001 depends on → SHP-X9002 (JIT Factory Assembly, 24h impact)
```

- If SHP-X9001 is delayed, the system flags that SHP-X9002's factory assembly will be starved
- Dependency type and impact delay hours are tracked
- Visible in the shipment data and factored into risk scoring

---

## 17. Predictive ETA Engine

- Does not use static delivery windows
- ETA Agent recalculates arrival time on every simulation tick
- Factors in: weather severity, traffic congestion, port status, anomaly type
- Outputs both original ETA and revised predicted ETA
- Delay probability percentage shown on the tracker

---

## 18. Blockchain-Style Audit Trail

- Every completed pipeline run generates a mock blockchain transaction hash
- Hash stored in the Report Agent output (`blockchain_audit_hash`)
- Provides an immutable record of every AI decision made
- Displayed in the Action Cards component
- Fleet history page shows all past pipeline runs with their hashes

---

## 19. Fleet History Logs

- Accessible at `/history`
- Shows all past simulation runs stored in PostgreSQL
- Each entry includes: shipment ID, timestamp, agent outputs, decisions taken
- Persistent across restarts (PostgreSQL-backed)
- Protected route — requires authentication

---

## 20. Observability Stack

Full production-grade observability included via Docker Compose.

### Prometheus
- Scrapes backend metrics from `/metrics` endpoint
- Tracks: request counts, latency, error rates, simulation ticks
- Available at `http://localhost:9090`

### Grafana
- Pre-configured dashboards for backend metrics
- Datasources auto-provisioned (Prometheus, Loki, Tempo)
- Anonymous access enabled for demo convenience
- Available at `http://localhost:3001`

### Loki + Promtail
- Collects all container logs (backend, frontend, db)
- Promtail tails Docker container log files and ships to Loki
- Queryable from Grafana with LogQL

### Tempo
- Distributed tracing via OpenTelemetry
- Backend instrumented with `opentelemetry-instrumentation-fastapi`
- Traces exported to Tempo over OTLP gRPC
- Visualize request traces in Grafana

---

## 21. Infrastructure & Deployment

### Docker Compose
Full stack runs with a single command:
```bash
docker compose up --build
```

Services started:

| Service | Port | Description |
|---------|------|-------------|
| `nexus_frontend` | 3000 | Next.js frontend |
| `nexus_backend` | 8000 | FastAPI backend |
| `nexus_db` | 5433 | PostgreSQL 17 |
| `nexus_pgadmin` | 5050 | pgAdmin 4 UI |
| `nexus_prometheus` | 9090 | Metrics collection |
| `nexus_grafana` | 3001 | Dashboards |
| `nexus_loki` | 3100 | Log aggregation |
| `nexus_tempo` | 3200 | Distributed tracing |

### Database
- PostgreSQL 17 (primary)
- SQLite fallback for local development without Docker
- Async SQLAlchemy 2.0 with connection pooling
- Auto-migration on startup via `init_db()`
- Migration script included: `backend/app/db/migrate_sqlite_to_pg.py`

### Backend
- FastAPI with async/await throughout
- Uvicorn ASGI server
- ChromaDB for vector memory (RAG context retrieval)
- Event bus (`asyncio.Queue`) for internal pub/sub between agents

### Frontend
- Next.js 16 with App Router
- Standalone output mode for Docker deployment
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` baked in at build time via Docker build args
- TypeScript strict mode with build error suppression for hackathon speed

### Environment Variables

**Backend (`backend/.env`)**
```
GOOGLE_API_KEY=          # Gemini API key
OPENAI_API_KEY=          # OpenAI API key (for GPT-4o-mini)
OPEN_WEATHER_API_KEY=    # OpenWeather API key
JWT_SECRET_KEY=          # JWT signing secret
FERNET_ENCRYPTION_KEY=   # Fernet key for PII encryption
GOOGLE_CLIENT_ID=        # Google OAuth client ID
SMTP_SERVER=             # SMTP server for MFA emails
SMTP_PORT=               # SMTP port
SMTP_EMAIL=              # Sender email address
SMTP_PASSWORD=           # SMTP app password
POSTGRES_USER=           # PostgreSQL username
POSTGRES_PASSWORD=       # PostgreSQL password
POSTGRES_DB=             # Database name
POSTGRES_HOST=           # Database host
POSTGRES_PORT=           # Database port
LLM_PROVIDER=            # "gemini" or "openai"
MAX_LLM_CALLS=           # Max LLM API calls per session
```

**Root (`.env`)** — used by Docker Compose
```
POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_DB=
NEXT_PUBLIC_GOOGLE_CLIENT_ID=   # Passed as build arg to frontend
```

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend framework | Next.js 16, React 19, TypeScript |
| Styling | TailwindCSS 4, Framer Motion |
| 3D rendering | Three.js, React Three Fiber, Drei |
| Maps | Pigeon Maps, React Leaflet |
| Auth (frontend) | @react-oauth/google |
| Backend framework | FastAPI, Uvicorn |
| Database | PostgreSQL 17, SQLAlchemy 2.0 (async) |
| Vector memory | ChromaDB |
| AI providers | Gemini 2.5 Flash, GPT-4o-mini |
| Auth (backend) | PyJWT, bcrypt, Fernet, google-auth |
| Observability | Prometheus, Grafana, Loki, Tempo, OpenTelemetry |
| Containerization | Docker, Docker Compose |
| Weather data | OpenWeather API |
