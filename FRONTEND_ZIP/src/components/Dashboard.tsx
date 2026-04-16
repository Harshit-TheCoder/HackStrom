"use client";

import { useEffect, useState, useRef } from "react";
import ShipmentTracker from "./ShipmentTracker";
import ReasoningStream from "./ReasoningStream";
import ActionCards from "./ActionCards";
import GlobeModel from "./GlobeModel";
import { Play, Square } from "lucide-react";
import { motion } from "framer-motion";

export default function Dashboard() {
  const [state, setState] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  // Poll state endpoint
  useEffect(() => {
    const fetchState = async () => {
      try {
        const hostname = window.location.hostname;
        const res = await fetch(`http://${hostname}:8000/api/state`);
        const data = await res.json();
        if (data && data.status !== "idle") {
          setState(data);
        }
      } catch (err) {
        console.error("Failed to fetch state", err);
      }
    };

    const interval = setInterval(fetchState, 3000);
    return () => clearInterval(interval);
  }, []);

  // Handle WebSockets for live agent streaming
  useEffect(() => {
    const connectWs = () => {
      const hostname = window.location.hostname;
      ws.current = new WebSocket(`ws://${hostname}:8000/ws/logs`);
      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setLogs(prev => [...prev, { ...data, timestamp: Date.now() }]);
      };
      
      ws.current.onclose = () => {
        // Simple reconnect logic
        setTimeout(connectWs, 3000);
      };
    };
    
    connectWs();
    
    return () => {
      if (ws.current) ws.current.close();
    };
  }, []);

  const toggleSimulation = async () => {
    const endpoint = isRunning ? "/api/stop" : "/api/start";
    const hostname = window.location.hostname;
    try {
      await fetch(`http://${hostname}:8000${endpoint}`, { method: 'POST' });
      setIsRunning(!isRunning);
      if (!isRunning) {
        setLogs([{ agent_name: "SYSTEM", status: "RUNNING", logs: ["Initiating control tower simulation sequence..."], timestamp: Date.now() }]);
      }
    } catch (err) {
      console.error("Failed to start/stop simulation", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#02040a] p-4 md:p-8 font-sans text-slate-200">
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel border-b-2 border-b-cyan-500/30"
        >
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-purple-500">
              NEXUS AI CONTROL TOWER
            </h1>
            <p className="text-slate-400 mt-1 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isRunning ? 'bg-cyan-400' : 'bg-slate-500'}`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${isRunning ? 'bg-cyan-500' : 'bg-slate-500'}`}></span>
              </span>
              Real-time Global Supply Chain Engine
            </p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleSimulation}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all duration-300 ${
              isRunning 
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50 hover:bg-rose-500/30 neon-glow-magenta' 
                : 'bg-teal-500/20 text-teal-400 border border-teal-500/50 hover:bg-teal-500/30 neon-glow'
            }`}
          >
            {isRunning ? (
              <><Square size={18} fill="currentColor" /> STOP SCENARIO</>
            ) : (
              <><Play size={18} fill="currentColor" /> START SCENARIO</>
            )}
          </motion.button>
        </motion.div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: UI + Tracking */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Top row of left column: Tracker and Globe */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="h-[300px]"
              >
                 <ShipmentTracker state={state} />
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                  <GlobeModel />
              </motion.div>
            </div>

            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.3 }}
            >
              <ActionCards state={state} />
            </motion.div>

          </div>

          {/* Right Column: Reasoning Stream */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-4"
          >
            <ReasoningStream logs={logs} />
          </motion.div>
          
        </div>
      </div>
    </div>
  );
}
