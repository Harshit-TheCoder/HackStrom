"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearToken, getToken } from "@/lib/auth";
import ShipmentTracker from "./ShipmentTracker";
import LocationWeatherMap from "./LocationWeatherMap";
import ReasoningStream from "./ReasoningStream";
import ActionCards from "./ActionCards";
import GlobeModel from "./GlobeModel";
import ChaosControl from "./ChaosControl";
import { Play, Square, BrainCircuit, Activity, X, ShieldAlert, LogOut, Flame, Skull, AlertOctagon, Terminal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Role = "CRISIS_MGR" | "INTEL" | "RECOVERY";

export default function ChaosDashboard() {
  const router = useRouter();
  
  const [activeShipmentId, setActiveShipmentId] = useState<string>("SHP-CH-999");
  const activeTrackerRef = useRef("SHP-CH-999");

  const [state, setState] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(true); // Default to RUNNING for chaos
  const [role, setRole] = useState<Role>("CRISIS_MGR");
  const ws = useRef<WebSocket | null>(null);

  // Poll state endpoint
  useEffect(() => {
    const fetchState = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const token = getToken();
        const res = await fetch(`${apiUrl}/api/state?shipment_id=${activeShipmentId}`, {
          headers: token ? { "Authorization": `Bearer ${token}` } : {}
        });
        const data = await res.json();
        if (data && data.status !== "idle") {
          setState(data);
        }
      } catch (err) {}
    };

    const interval = setInterval(fetchState, 3000);
    return () => clearInterval(interval);
  }, [activeShipmentId]);

  // WebSockets for live agent streaming
  useEffect(() => {
    const connectWs = () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const wsUrl = apiUrl.replace(/^http/, 'ws') + "/ws/logs";
      
      ws.current = new WebSocket(wsUrl);
      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (!data.shipment_id || data.shipment_id === activeTrackerRef.current) {
           setLogs(prev => [...prev, { ...data, timestamp: Date.now() }]);
        }
      };
      ws.current.onclose = () => setTimeout(connectWs, 3000);
    };
    connectWs();
    return () => ws.current?.close();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0202] p-4 md:p-6 font-mono text-orange-200 overflow-x-hidden relative selection:bg-orange-500/30">
      
      {/* Background Glitch Effect Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay" />
      
      {/* Scanning Line Animation */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-20 animate-scan z-[100]" />

      <div className="max-w-[1700px] mx-auto space-y-6">
        
        {/* Crisis Header */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col lg:flex-row items-center justify-between gap-6 p-6 rounded-2xl bg-black/80 border-2 border-orange-500/40 shadow-[0_0_50px_rgba(249,115,22,0.15)] relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-orange-500/5 to-transparent pointer-events-none" />
          
          <div className="flex items-center gap-6 z-10">
             <div className="bg-orange-500/10 p-4 rounded-full border border-orange-500/30 animate-pulse shadow-[0_0_20px_rgba(249,115,22,0.2)]">
                <Skull className="w-10 h-10 text-orange-500" />
             </div>
             <div>
               <h1 className="text-3xl lg:text-5xl font-black tracking-tighter text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.5)] italic">
                 CHAOS COMMAND CENTER
               </h1>
               <div className="flex items-center gap-3 mt-1 text-orange-400/60 text-xs uppercase tracking-[0.3em]">
                  <Activity className="w-3 h-3" />
                  STRESS-TESTING AI RESILIENCE LAYER v4.0.Chaos
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-600"></span>
                  </span>
               </div>
             </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 z-10">
             <div className="flex bg-black/80 border border-orange-900/40 p-1 rounded-lg">
                {(["CRISIS_MGR", "INTEL", "RECOVERY"] as Role[]).map(r => (
                  <button 
                    key={r}
                    onClick={() => setRole(r)}
                    className={`px-4 py-2 text-[10px] font-bold tracking-widest uppercase transition-all ${role === r ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'text-orange-900 hover:text-orange-500'}`}
                  >
                    {r}
                  </button>
                ))}
             </div>
             
             <Link href="/">
                <button className="flex items-center gap-2 bg-slate-900/50 hover:bg-slate-800 text-slate-400 border border-white/5 px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all">
                   <Terminal className="w-4 h-4"/> REAL dashboard
                </button>
             </Link>

             <motion.div 
               animate={{ borderColor: ["rgba(249,115,22,0.2)", "rgba(249,115,22,0.6)", "rgba(249,115,22,0.2)"] }}
               transition={{ duration: 1.5, repeat: Infinity }}
               className="bg-orange-600/10 text-orange-500 border border-orange-500/30 px-6 py-2.5 rounded-lg font-black text-sm tracking-[0.2em] shadow-[0_0_20px_rgba(249,115,22,0.1)]"
             >
               CRITICAL_MODE_ACTIVE
             </motion.div>
          </div>
        </motion.div>

        {/* Chaos Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-[calc(100vh-200px)]">
          
          {/* Threats & Simulator */}
          <div className="xl:col-span-3 h-full overflow-hidden">
              <ChaosControl 
                 activeShipmentId={activeShipmentId} 
                 mode="chaos"
                 onShipmentChange={(id) => {
                   setActiveShipmentId(id);
                   activeTrackerRef.current = id;
                   setState(null);
                   setLogs([]);
                 }} 
              />
          </div>

          {/* Main Visualization Center */}
          <div className="xl:col-span-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar p-1">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[350px]">
                <div className="border border-orange-500/20 rounded-2xl overflow-hidden shadow-2xl relative group">
                   <div className="absolute top-3 left-3 z-10 bg-black/80 border border-orange-500/30 px-3 py-1 rounded text-[10px] text-orange-500 font-bold uppercase">Target Telemetry</div>
                   <ShipmentTracker state={state} />
                </div>
                <div className="border border-orange-500/20 rounded-2xl overflow-hidden shadow-2xl relative">
                   <div className="absolute top-3 left-3 z-10 bg-black/80 border border-orange-500/30 px-3 py-1 rounded text-[10px] text-orange-500 font-bold uppercase">Orbital Tracking</div>
                   <GlobeModel state={state} />
                </div>
             </div>
             
             <div className="min-h-[400px] border-2 border-orange-500/20 rounded-2xl overflow-hidden relative shadow-[0_0_40px_rgba(0,0,0,0.5)]">
                <div className="absolute top-3 left-3 z-[1000] bg-orange-600 border border-orange-400 px-3 py-1 rounded text-[10px] text-white font-black uppercase flex items-center gap-2 animate-pulse">
                   <AlertOctagon className="w-3 h-3" /> Area of Operation
                </div>
                <LocationWeatherMap state={state} />
             </div>

             <ActionCards state={state} />
          </div>

          {/* Agent reasoning - Re-skinned */}
          <div className="xl:col-span-3 h-full overflow-hidden flex flex-col border border-orange-500/20 rounded-2xl bg-black/40 backdrop-blur-xl">
             <div className="p-4 border-b border-orange-500/20 flex items-center justify-between bg-orange-950/20">
                <span className="text-xs font-black uppercase tracking-widest text-orange-500">Neural Agent Uplink</span>
                <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
             </div>
             <div className="flex-1 overflow-hidden relative">
                <ReasoningStream logs={logs} />
                {/* Visual "Static/Interference" overlay for chaos effect */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-orange-500/5 to-transparent mix-blend-screen opacity-10" />
             </div>
          </div>

        </div>

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .glass-panel-accent {
          background: rgba(20, 0, 0, 0.6) !important;
          border-color: rgba(249, 115, 22, 0.2) !important;
        }
        .neon-text-cyan {
          color: #f97316 !important;
          text-shadow: 0 0 10px rgba(249, 115, 22, 0.5) !important;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #000;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #f97316;
          border-radius: 10px;
        }
        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
        .animate-scan {
          animation: scan 4s linear infinite;
        }
      `}} />
    </div>
  );
}
