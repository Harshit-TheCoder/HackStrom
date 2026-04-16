# 🌐 Nexus Global AI Control Tower

<div align="center">

<img src="https://img.icons8.com/nolan/256/network.png" width="110"/>

### AI-Powered Supply Chain Command Center

**Real-Time • Predictive • Autonomous • Multi-Agent Intelligence**

<br/>

![FastAPI](https://img.shields.io/badge/FastAPI-Async-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-blue?style=for-the-badge&logo=typescript&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-3D-black?style=for-the-badge&logo=three.js)
![WebSockets](https://img.shields.io/badge/WebSockets-Realtime-informational?style=for-the-badge)
![Gemini](https://img.shields.io/badge/Gemini_2.5_Flash-AI-8A2BE2?style=for-the-badge&logo=google)
![Status](https://img.shields.io/badge/Status-Hackathon%20Ready-success?style=for-the-badge)

<br/>

> *Not just a dashboard — a living, thinking supply chain system*

</div>

---

## 🧠 What is Nexus?

**Nexus Global Control Tower** is a next-generation AI logistics orchestration platform that simulates and manages global supply chains in real time.

| Role | Description |
|------|-------------|
| 🛰️ Mission Control | Global trade visibility across all shipments |
| 🤖 AI Decision Engine | Autonomous rerouting, vendor switching, risk intervention |
| 🌍 Digital Twin | Real-time simulation of logistics networks |

---

## 🎯 Why Nexus?

| Traditional Supply Chains | Nexus |
|--------------------------|-------|
| Reactive ❌ | Predictive ✅ |
| Fragmented ❌ | Orchestrated ✅ |
| Human-dependent ❌ | Autonomous ✅ |
| Opaque ❌ | Transparent (Audit Trail) ✅ |

---

## ⚙️ System Flow

```
📦 Shipment Data + 🌦️ Weather API + 🌡️ IoT Telemetry + 🚦 Traffic Data
                              ↓
                    🧠 AI Agent Pipeline
                              ↓
   Monitor → ETA → Risk → Decision → Simulation → Policy → Report
                              ↓
              ⚡ Real-Time WebSocket Streaming
                              ↓
        🌍 3D Globe  |  📊 Dashboards  |  💬 AI Terminal
```

---

## 🤖 AI Agent Swarm

| Agent | Responsibility |
|-------|---------------|
| 🛰️ **Monitor** | Detect anomalies in real time |
| ⏱️ **ETA** | Predict delivery windows |
| ⚠️ **Risk** | Compute dynamic risk scores |
| 🧠 **Decision** | Suggest optimal interventions |
| 🧪 **Simulation** | Predict counterfactual outcomes |
| 📜 **Policy** | Validate compliance constraints |
| 📊 **Report** | Generate executive summaries |

> 💡 Each agent enriches the shipment context → forming a **collective AI brain**

---

## ✨ Feature Highlights

### 🌍 Holographic 3D Globe
- Interactive Earth model with live shipping routes
- Animated arcs between real-world ports
- Real-time geospatial tracking overlay

### ⚡ Real-Time Reasoning Terminal
- Live streaming AI agent logs (WebSocket)
- Typewriter-style reasoning output
- Full decision transparency

### 🧭 Multi-Route Shipment Tracking
- Track multiple vessels simultaneously
- Seamless shipment switching
- Persistent state memory

### 🌡️ IoT Telemetry Simulation
- Container temperature & humidity monitoring
- Lock status tracking
- Alert thresholds with auto-escalation

### 💸 Financial Intelligence Engine
- Delay cost vs rerouting cost analysis
- SLA penalty calculator
- Net savings optimization

### 🔗 Blockchain-style Audit Trail
- Immutable, append-only decision log
- Full AI accountability chain
- Exportable compliance records

### 🤖 Auto-Pilot Mode
- Fully autonomous rerouting decisions
- Intelligent vendor switching
- Zero-human-intervention operation

---

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│          Frontend  (Next.js 14)      │
│   3D Globe • Dashboard • AI Chat    │
└──────────────────┬──────────────────┘
                   │  WebSockets + REST API
┌──────────────────▼──────────────────┐
│           Backend  (FastAPI)         │
│   Async Event Bus • AI Pipeline     │
│   SQLAlchemy • WebSocket Server     │
└──────────────────┬──────────────────┘
                   │
┌──────────────────▼──────────────────┐
│        External Intelligence         │
│  Gemini 2.5 Flash • OpenWeather     │
│  ChromaDB (RAG Memory)              │
└─────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| Next.js 14 + React | App framework |
| TypeScript | Type safety |
| Three.js + React Three Fiber | 3D Globe rendering |
| TailwindCSS + Framer Motion | Styling & animations |
| Pigeon Maps | 2D geospatial overlay |

### Backend
| Technology | Purpose |
|-----------|---------|
| FastAPI | Async REST API server |
| AsyncIO (asyncio.Queue) | Event-driven pub/sub bus |
| WebSockets | Real-time log streaming |
| SQLAlchemy + SQLite | Persistent state & audit trail |

### AI / Intelligence
| Technology | Purpose |
|-----------|---------|
| Gemini 2.5 Flash | Multi-agent LLM backbone |
| ChromaDB | RAG memory for context retrieval |
| OpenWeather API | Live weather disruption data |

---

## 📁 Project Structure

```
nexus-control-tower/
│
├── backend/
│   ├── app/
│   │   ├── core/               # Config, security, Gemini client, events
│   │   │   ├── config.py
│   │   │   ├── dependencies.py
│   │   │   ├── events.py
│   │   │   ├── gemini.py
│   │   │   ├── security.py
│   │   │   └── ioc.py
│   │   ├── db/                 # Database layer
│   │   ├── infrastructure/     # External integrations
│   │   │   ├── memory.py       # ChromaDB RAG
│   │   │   └── weather.py      # OpenWeather API
│   │   ├── modules/            # AI Agents
│   │   │   ├── auth.py
│   │   │   ├── monitor.py
│   │   │   ├── eta.py
│   │   │   ├── risk.py
│   │   │   ├── decision.py
│   │   │   ├── simulation.py
│   │   │   ├── policy.py
│   │   │   └── report.py
│   │   ├── orchestrator/       # Pipeline coordination
│   │   │   ├── pipeline.py
│   │   │   ├── main.py
│   │   │   └── schemas.py
│   │   └── main.py
│   ├── requirements.txt
│   └── hackathon.db
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   │   ├── ActionCards.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── GlobeModel.tsx
│   │   │   ├── LocationWeatherMap.tsx
│   │   │   ├── MapComponent.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   ├── ReasoningStream.tsx
│   │   │   └── ShipmentTracker.tsx
│   │   └── lib/
│   ├── public/
│   ├── package.json
│   └── next.config.ts
│
└── README.md
```

---

## ⚡ Local Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- Gemini API Key
- OpenWeather API Key

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/nexus-control-tower.git
cd nexus-control-tower
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (macOS/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
cp .env.example .env
# Add your GEMINI_API_KEY and OPENWEATHER_API_KEY to .env

# Start server
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

### 4. Access the Application

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/start` | Start simulation loop |
| `POST` | `/api/stop` | Stop simulation |
| `GET` | `/api/state` | Get current shipment state |
| `WS` | `ws://localhost:8000/ws/logs` | Real-time agent log stream |

---

## 🎮 How to Use

1. Open `http://localhost:3000`
2. Log in and select your role: **OPS / LOGISTICS / FINANCE**
3. Click **INITIATE** to start the simulation
4. Watch the 7 AI agents activate in the Reasoning Terminal
5. Monitor live risk scores, ETA predictions, and decisions
6. Toggle **Auto-Pilot** to hand full control to the AI
7. Chat with **Nexus Assistant** for real-time Q&A

---

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm run test
```

---

## 🐛 Troubleshooting

| Problem | Fix |
|---------|-----|
| `uvicorn not found` | `pip install uvicorn` |
| Port 8000 in use | `uvicorn app.main:app --port 8001` |
| WebSocket not connecting | Ensure backend is running; check browser Network tab |
| 3D Globe not loading | Check browser WebGL support |

---

## 🚢 Deployment

### Backend (Docker)

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY . .
RUN pip install -r requirements.txt
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```bash
docker build -t nexus-backend .
docker run -p 8000:8000 nexus-backend
```

### Frontend (Vercel)

```bash
cd frontend
npm run build
# Deploy via Vercel CLI or GitHub integration
```

---

## 🏆 Hackathon Edge

| Feature | Impact |
|---------|--------|
| ✅ 7-agent AI pipeline | Not just one model — a coordinated swarm |
| ✅ Real-time WebSocket streaming | Live system, not polling |
| ✅ 3D Globe visualization | Unforgettable demo factor |
| ✅ Event-driven async backend | Production-grade architecture |
| ✅ Auto-Pilot autonomous mode | True zero-human-intervention AI |
| ✅ Financial impact engine | Quantified business value |
| ✅ Blockchain-style audit trail | Trust, transparency, accountability |

> 🧠 **This is AI + Systems Design + Visualization + Real-Time Intelligence — combined.**

---

## 🌟 Future Scope

- 🛰️ Live satellite AIS feed integration
- 📡 Real IoT device streaming (MQTT)
- 🤖 Reinforcement learning for autonomous routing optimization
- ☁️ Enterprise multi-tenant SaaS deployment
- 🌐 Multi-language support for global ops teams

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">

🚀 **Built for Hackathons. Engineered for the Future.**

*Nexus Control Tower = AI + Systems Design + Visualization + Real-Time Intelligence*

⭐ If this project impressed you, consider giving it a star!

</div>