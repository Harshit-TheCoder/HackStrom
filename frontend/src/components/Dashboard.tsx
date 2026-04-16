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
import { Play, Square, Bot, Shield, BrainCircuit, Activity, MessageSquare, Send, X, ShieldAlert, LogOut, Flame } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Role = "OPS" | "LOGISTICS" | "FINANCE";

export default function Dashboard() {
  const router = useRouter();
  
  const [activeShipmentId, setActiveShipmentId] = useState<string>("SHP-X9001");
  const activeTrackerRef = useRef("SHP-X9001");

  useEffect(() => {
     const stored = localStorage.getItem("activeShipmentId");
     if (stored) {
         setActiveShipmentId(stored);
         activeTrackerRef.current = stored;
     }
  }, []);

  const [state, setState] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [role, setRole] = useState<Role>("OPS");
  const [autoPilot, setAutoPilot] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatQuery, setChatQuery] = useState("");
  const [chatHistory, setChatHistory] = useState([
    { sender: "nexus", text: "Nexus NLP initialized. Ask me anything about the current supply chain state." }
  ]);
  const [chaosOpen, setChaosOpen] = useState(false);
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
        
        if (res.status === 401) {
          // Silent failure for polling, but could log
          return;
        }

        const data = await res.json();
        if (data && data.status !== "idle") {
          setState(data);
        }
      } catch (err) {
        // Silently ignore fetch errors to avoid console spam
      }
    };

    const interval = setInterval(fetchState, 3000);
    return () => clearInterval(interval);
  }, [activeShipmentId]);

  // Handle WebSockets for live agent streaming
  useEffect(() => {
    const connectWs = () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const wsUrl = apiUrl.replace(/^http/, 'ws') + "/ws/logs";
      
      ws.current = new WebSocket(wsUrl);
      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        // Only accept explicitly routed logs or legacy system logs without IDs
        if (!data.shipment_id || data.shipment_id === activeTrackerRef.current) {
           setLogs(prev => [...prev, { ...data, timestamp: Date.now() }]);
        }
      };
      
      ws.current.onclose = () => {
        setTimeout(connectWs, 3000);
      };
    };
    
    connectWs();
    
    return () => {
      if (ws.current) ws.current.close();
    };
  }, []);

  const [chaosDisturbances, setChaosDisturbances] = useState<any[]>([]);

  // Simulation controls
  const toggleSimulation = async () => {
    const endpoint = isRunning ? "/api/stop" : "/api/start";
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const token = getToken();
    
    try {
      const res = await fetch(`${apiUrl}${endpoint}`, { 
        method: 'POST',
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });

      if (res.status === 401) {
        alert("Session Expired. Please login again.");
        handleLogout();
        return;
      }

      if (res.status === 429) {
        alert("Action Rate Limited. Please wait a few seconds before retrying.");
        return;
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        alert(`System Error: ${errorData.detail || "Failed to communicate with control tower."}`);
        return;
      }

      setIsRunning(!isRunning);
      if (!isRunning) {
        setLogs([{ agent_name: "SYSTEM", status: "RUNNING", logs: ["Initiating control tower simulation sequence..."], timestamp: Date.now() }]);
      }
    } catch (err) {
      console.error("Failed to start/stop simulation", err);
    }
  };

  const handleLogout = () => {
     clearToken();
     router.push("/login");
  };

  const submitChat = (e?: React.FormEvent, manualQuery?: string) => {
    if (e) e.preventDefault();
    const query = manualQuery || chatQuery;
    if (!query) return;

    setChatHistory(prev => [...prev, { sender: "user", text: query }]);
    setChatQuery("");

    // Simulate AI thinking and response
    setTimeout(() => {
      let response = "Analyzing Nexus telemetry... ";
      const q = query.toLowerCase();
      
      if (q.includes("delay")) {
          response += state?.eta_result?.reasoning || "Current ETA is stable, but monitoring Malacca Strait congestion.";
      } else if (q.includes("financial") || q.includes("cost")) {
          response += `Current projected delay cost is $${state?.decision_result?.options[0]?.financials?.delay_cost || '0'}. Rerouting could save up to $${state?.decision_result?.options[0]?.financials?.penalty_avoided || '15,000'}.`;
      } else if (q.includes("vendor") || q.includes("reliability")) {
          response += `${state?.shipment.vendor} has a reliability score of ${state?.shipment.vendor_details?.reliability_score}%. They are currently performing within SLA.`;
      } else if (q.includes("risk")) {
          response += state?.risk_result?.reason || "Minimal environmental risk detected at current coordinates.";
      } else {
          response += "I've processed your query. The autonomous control tower is maintaining optimal route efficiency.";
      }

      setChatHistory(prev => [...prev, { sender: "nexus", text: response }]);
    }, 800);
  };


  // ... (Nominal Dashboard return remains below)

  // Real-time Risk Alerts derived from logs
  const latestAlerts = logs.filter(l => l.agent_name === "RISK_AGENT" || l.agent_name === "SLA_MONITOR").slice(-3);
  
  const SUGGESTED_QUERIES = [
    "What is the delay?",
    "Give me more information about it",
    "What is the financial impact?",
    "Check Vendor Score"
  ];

  return (
    <div className="min-h-screen bg-[#02040a] p-4 md:p-6 font-sans text-slate-200 overflow-x-hidden relative">
      
      {/* Floating Alert Stack for high-severity events */}
      <div className="fixed top-24 right-6 z-50 flex flex-col gap-2 w-80 pointer-events-none">
         <AnimatePresence>
            {state?.risk_result?.risk_category === "HIGH" && (
                <motion.div 
                   initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 100, opacity: 0 }}
                   className="bg-rose-950/80 backdrop-blur-xl border border-rose-500/50 p-3 rounded-lg shadow-2xl flex items-start gap-3 pointer-events-auto"
                >
                   <ShieldAlert className="w-5 h-5 text-rose-400 mt-0.5 animate-pulse" />
                   <div>
                      <h4 className="text-xs font-bold text-rose-300 uppercase tracking-widest leading-none mb-1">CRITICAL RISK ALERT</h4>
                      <p className="text-[11px] leading-tight text-rose-200/80 font-mono">{state.risk_result.reason}</p>
                   </div>
                </motion.div>
            )}
         </AnimatePresence>
      </div>

      <div className="max-w-[1600px] mx-auto space-y-6">
        
        {/* Futuristic Header & Navbar */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col 2xl:flex-row flex-wrap items-center justify-between gap-6 glass-panel border-b-2 border-b-cyan-500/30 w-full"
        >
          <div className="flex items-center gap-4">
             <div className="bg-black/50 p-2 rounded-xl border border-white/10">
                <BrainCircuit className="w-8 h-8 text-cyan-400 animate-pulse" />
             </div>
             <div>
               <h1 className="text-2xl lg:text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-400 via-cyan-400 to-purple-500 neon-text-cyan flex items-center gap-2">
                 NEXUS CONTROL TOWER
               </h1>
               <p className="text-slate-400 mt-0.5 flex items-center gap-2 text-xs lg:text-sm uppercase tracking-widest font-bold">
                 <span className="relative flex h-2 w-2">
                   <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isRunning ? 'bg-cyan-400' : 'bg-slate-500'}`}></span>
                   <span className={`relative inline-flex rounded-full h-2 w-2 ${isRunning ? 'bg-cyan-500' : 'bg-slate-500'}`}></span>
                 </span>
                 Autonomous Global Supply Chain Engine
               </p>
             </div>
          </div>

          {/* Role Tabs & Route Selector */}
          <div className="flex flex-col md:flex-row items-center gap-4 overflow-x-auto pb-2 xl:pb-0 shrink-0 w-full xl:w-auto">
             <div className="flex bg-black/60 p-1 rounded-full border border-slate-700 shrink-0">
               {(["OPS", "LOGISTICS", "FINANCE"] as Role[]).map(r => (
                 <button 
                   key={r}
                   onClick={() => setRole(r)}
                   className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-widest transition-all ${role === r ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/50' : 'text-slate-500 hover:text-slate-300'}`}
                 >
                   {r}
                 </button>
               ))}
               <Link href="/history">
                  <button className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-widest transition-all text-slate-500 hover:text-cyan-300 hover:bg-cyan-900/20`}>
                     FLEET LOGS
                  </button>
               </Link>
             </div>

             <select 
               value={activeShipmentId} 
               onChange={(e) => { 
                  setActiveShipmentId(e.target.value); 
                  activeTrackerRef.current = e.target.value;
                  localStorage.setItem("activeShipmentId", e.target.value);
                  setState(null); 
                  setLogs([]); 
               }}
               className="bg-black/80 border border-cyan-900/60 shadow-lg text-cyan-300 text-[10px] sm:text-xs font-bold tracking-widest px-4 py-2 rounded-full outline-none hover:border-cyan-500/80 transition-all cursor-pointer w-full md:w-[280px]"
             >
               <option value="SHP-X9001">SHP-X9001: Singapore ➔ Mumbai</option>
               <option value="SHP-X9002">SHP-X9002: UAE ➔ Gujarat</option>
               <option value="SHP-X9003">SHP-X9003: Singapore ➔ Vizag</option>
               <option value="SHP-X9004">SHP-X9004: Shanghai ➔ Mumbai</option>
               <option value="SHP-X9005">SHP-X9005: Rotterdam ➔ UAE</option>
               <option value="SHP-X9006">SHP-X9006: New York ➔ Gujarat</option>
             </select>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-4 shrink-0 w-full xl:w-auto pt-2 xl:pt-0 border-t xl:border-none border-white/10">
            <button onClick={handleLogout} className="flex items-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors">
               <LogOut className="w-3 h-3"/> Disconnect
            </button>
            {/* Auto-Pilot Toggle */}
            <div className="flex items-center gap-3 bg-black/40 px-3 py-1.5 rounded-full border border-white/5" onClick={() => setAutoPilot(!autoPilot)}>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Auto-Pilot</span>
              <div className={`w-10 h-5 rounded-full cursor-pointer relative px-0.5 flex items-center transition-colors ${autoPilot ? 'bg-emerald-500/40 border border-emerald-400/50 glow-emerald' : 'bg-slate-800 border border-slate-600'}`}>
                 <motion.div layout className={`w-4 h-4 rounded-full ${autoPilot ? 'bg-emerald-400' : 'bg-slate-400'}`} animate={{ x: autoPilot ? 20 : 0 }} />
              </div>
            </div>
            
            <Link href="/chaos">
              <button 
                 className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all bg-slate-900/50 text-slate-500 border border-white/5 hover:text-orange-400 hover:bg-orange-950/20 shadow-[0_0_15px_rgba(249,115,22,0.1)] hover:shadow-[0_0_25px_rgba(249,115,22,0.3)]"
              >
                 <Flame className="w-3 h-3 group-hover:animate-pulse" /> Launch Chaos Mode
              </button>
            </Link>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleSimulation}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold transition-all duration-300 shadow-xl ${
                isRunning 
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50 hover:bg-rose-500/30 neon-glow-magenta' 
                  : 'bg-teal-500/20 text-teal-400 border border-teal-500/50 hover:bg-teal-500/30 neon-glow'
              }`}
            >
              {isRunning ? (
                <><Square size={16} fill="currentColor" /> OFFLINE</>
              ) : (
                <><Play size={16} fill="currentColor" /> INITIATE</>
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* Dynamic Grid Layout based on Role */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
          
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Role conditional ordering */}
            {role === "FINANCE" ? (
               // Finance focuses on actions & costs
               <>
                 <ActionCards state={state} />
                 <div className="h-[350px]"><LocationWeatherMap state={state} /></div>
               </>
            ) : role === "LOGISTICS" ? (
               // Logistics focuses on Map & Trackers deeply
               <>
                 <div className="h-[400px]"><LocationWeatherMap state={state} /></div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[300px]">
                   <ShipmentTracker state={state} />
                   <GlobeModel state={state} />
                 </div>
               </>
            ) : (
               // OPS focuses on everything balanced
               <>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="h-[350px]">
                      <ShipmentTracker state={state} />
                   </motion.div>
                   <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="h-[350px]">
                       <GlobeModel state={state} />
                   </motion.div>
                 </div>
                 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-[350px]">
                   <LocationWeatherMap state={state} />
                 </motion.div>
                 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                   <ActionCards state={state} />
                 </motion.div>
               </>
            )}
            
          </div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className={`lg:col-span-4 flex flex-col max-h-[1050px]`}
          >
            <ReasoningStream logs={logs} />
          </motion.div>
          
        </div>
      </div>

      {/* NLP Chat Widget */}
      <div className="fixed bottom-6 right-6 z-50">
         <AnimatePresence>
           {chatOpen ? (
             <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="bg-black/80 backdrop-blur-3xl border border-cyan-500/40 rounded-2xl shadow-2xl shadow-cyan-900/20 w-[350px] overflow-hidden flex flex-col h-[500px]"
             >
               <div className="bg-cyan-950/50 p-3 border-b border-cyan-500/30 flex justify-between items-center">
                 <div className="flex items-center gap-2 text-cyan-300 font-bold tracking-widest uppercase text-sm">
                   <Bot className="w-5 h-5"/> Ask Nexus AI
                 </div>
                 <button onClick={() => setChatOpen(false)} className="text-slate-400 hover:text-white"><X className="w-4 h-4"/></button>
               </div>
               
               <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                 {chatHistory.map((msg, i) => (
                    <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                       <div className={`p-3 max-w-[85%] rounded-2xl text-xs leading-relaxed font-mono ${msg.sender === 'user' ? 'bg-indigo-600 border border-indigo-400 text-white rounded-tr-none' : 'bg-slate-800/80 border border-slate-600 text-teal-200 rounded-tl-none'}`}>
                          {msg.text}
                       </div>
                    </div>
                 ))}
               </div>

               {/* Predefined Trigger Keywords / Suggestions */}
               <div className="p-2 border-t border-cyan-500/10 bg-black/40 flex flex-wrap gap-2">
                 {SUGGESTED_QUERIES.map((q, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => submitChat(undefined, q)}
                      className="px-2 py-1 bg-cyan-900/40 border border-cyan-500/30 rounded-md text-[10px] text-cyan-200 hover:bg-cyan-700/60 transition-colors whitespace-nowrap"
                    >
                      {q}
                    </button>
                 ))}
               </div>

               <form onSubmit={(e) => submitChat(e)} className="p-3 border-t border-cyan-500/20 bg-black/60 flex items-center gap-2">
                 <input 
                   type="text" 
                   value={chatQuery}
                   onChange={e => setChatQuery(e.target.value)}
                   className="flex-1 bg-transparent border-none outline-none text-sm text-slate-200 placeholder:text-slate-600 font-mono" 
                   placeholder="Query the logistics matrix..." 
                 />
                 <button type="submit" className="p-2 bg-cyan-600/30 hover:bg-cyan-500/50 text-cyan-400 rounded-lg transition-colors">
                    <Send className="w-4 h-4"/>
                 </button>
               </form>
             </motion.div>
           ) : (
             <motion.button 
               whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
               onClick={() => setChatOpen(true)}
               className="w-14 h-14 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-cyan-900/50 border border-cyan-300/50 neon-glow"
             >
               <MessageSquare className="w-6 h-6" />
             </motion.button>
           )}
         </AnimatePresence>
       </div>

       {/* Chaos Control Side Panel */}
       <AnimatePresence>
         {chaosOpen && (
           <>
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setChaosOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] pointer-events-auto"
              />
              <motion.div 
                initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 h-full w-[400px] z-[60] shadow-2xl pointer-events-auto"
              >
                 <ChaosControl 
                    mode="nominal"
                   activeShipmentId={activeShipmentId} 
                   onShipmentChange={(id) => {
                     setActiveShipmentId(id);
                     activeTrackerRef.current = id;
                     localStorage.setItem("activeShipmentId", id);
                   }} 
                 />
                 <button 
                   onClick={() => setChaosOpen(false)}
                   className="absolute top-6 right-6 p-2 bg-black/40 hover:bg-black/60 rounded-full text-slate-400 hover:text-white transition-colors"
                 >
                   <X className="w-5 h-5" />
                 </button>
              </motion.div>
           </>
         )}
       </AnimatePresence>

    </div>
  );
}
