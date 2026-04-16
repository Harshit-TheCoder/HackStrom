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
import { Play, Square, BrainCircuit, Activity, X, ShieldAlert, LogOut, Flame, Skull, AlertOctagon, Terminal, Zap } from "lucide-react";
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
  const [autoPilot, setAutoPilot] = useState(false);
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
          // Sync autoPilot state from backend
          if (data.auto_pilot_mode !== undefined) {
             setAutoPilot(data.auto_pilot_mode);
          }
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

  const toggleAutoPilot = async () => {
    const nextVal = !autoPilot;
    setAutoPilot(nextVal);
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const token = getToken();
    
    try {
      await fetch(`${apiUrl}/api/autopilot?shipment_id=${activeShipmentId}&enabled=${nextVal}`, {
        method: 'POST',
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
    } catch (err) {
      console.error("Auto-pilot toggle failed", err);
    }
  };

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
             <div className="flex bg-black/80 border border-orange-950/40 p-1 rounded-lg">
                <div className="px-4 py-2 text-[10px] font-black tracking-widest uppercase text-orange-500 bg-orange-500/10 border border-orange-500/30">
                   PRIMARY_CRISIS_OVERRIDE
                </div>
             </div>
             
             <Link href="/">
                <button className="flex items-center gap-2 bg-slate-900/50 hover:bg-slate-800 text-slate-400 border border-white/5 px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all">
                   <Terminal className="w-4 h-4"/> REAL dashboard
                </button>
             </Link>

             {/* Auto-Pilot Toggle in Chaos Style */}
             <div className="flex items-center gap-3 bg-black/40 px-3 py-2 rounded-lg border border-orange-500/20" onClick={toggleAutoPilot}>
               <span className="text-[10px] font-black uppercase tracking-widest text-orange-900">Auto-Pilot</span>
               <div className={`w-10 h-5 rounded-md cursor-pointer relative px-0.5 flex items-center transition-colors ${autoPilot ? 'bg-orange-500/30 border border-orange-400/50' : 'bg-slate-900 border border-slate-700'}`}>
                  <motion.div layout className={`w-4 h-4 rounded-sm ${autoPilot ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]' : 'bg-slate-600'}`} animate={{ x: autoPilot ? 20 : 0 }} />
               </div>
             </div>

             <motion.button 
               whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(249,115,22,0.4)" }}
               whileTap={{ scale: 0.95 }}
               onClick={() => {
                 // Trigger the first disturbance type as a "Strategic Reroute"
                 const firstType = "Suez Blockage"; 
                 const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
                 const token = getToken();
                 const chaosId = `SHP-CH-${Math.floor(Math.random() * 899) + 100}`;
                 
                 fetch(`${apiUrl}/api/disturb`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
                    body: JSON.stringify({
                      shipment_id: chaosId,
                      disturbance_type: firstType,
                      severity: "Critical",
                      description: "Global artery blockage. Massive trade bottleneck."
                    })
                 }).then(() => {
                   setActiveShipmentId(chaosId);
                   activeTrackerRef.current = chaosId;
                 });
               }}
               className="bg-orange-600 hover:bg-orange-500 text-white border border-orange-400 px-6 py-2.5 rounded-lg font-black text-xs tracking-[0.2em] shadow-[0_0_20px_rgba(249,115,22,0.2)] transition-all flex items-center gap-2"
             >
               <Zap className="w-4 h-4 fill-current" /> EXECUTE STRATEGIC REROUTE
             </motion.button>
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

        {/* Cinematic Decision Overlay */}
        <AnimatePresence>
           {state?.decision_result && (
              <motion.div 
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] w-[600px] pointer-events-none"
              >
                 <div className="bg-black/90 backdrop-blur-3xl border-2 border-orange-500/50 rounded-2xl p-6 shadow-[0_0_100px_rgba(249,115,22,0.3)] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-orange-500 animate-pulse" />
                    
                    <div className="flex items-center gap-4 mb-4">
                       <BrainCircuit className="w-8 h-8 text-orange-400" />
                       <h3 className="text-xl font-black italic text-orange-500 tracking-tighter uppercase">Strategic Decision Engine</h3>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                       <div className="space-y-1">
                          <span className="text-[9px] font-bold text-slate-500 uppercase">Input Problem</span>
                          <div className="bg-rose-950/40 p-2 rounded border border-rose-500/30 text-rose-400 text-[10px] font-bold uppercase">
                             {state.monitor_result?.anomaly_type || "DETECTION_PENDING"}
                          </div>
                       </div>
                       <div className="space-y-1">
                          <span className="text-[9px] font-bold text-slate-500 uppercase">Policy Check</span>
                          <div className="bg-indigo-950/40 p-2 rounded border border-indigo-500/30 text-indigo-300 text-[9px] leading-tight line-clamp-2">
                             {state.decision_result.policy_impact || "COMPLIANCE_VERIFIED"}
                          </div>
                       </div>
                       <div className="space-y-1">
                          <span className="text-[9px] font-bold text-slate-500 uppercase">Execution</span>
                          <div className="bg-emerald-950/40 p-2 rounded border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase">
                             REROUTE_SUCCESS
                          </div>
                       </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                       <span className="text-xs text-slate-400 font-mono italic">&gt; {state.decision_result.recommended_action}</span>
                       <span className="text-[10px] font-black text-orange-500">SAVINGS: ₹{state.decision_result.options?.[0]?.financials?.penalty_avoided?.toLocaleString() || "0"}</span>
                    </div>
                 </div>
              </motion.div>
           )}
        </AnimatePresence>

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
