"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearToken } from "@/lib/auth";
import ShipmentTracker from "./ShipmentTracker";
import LocationWeatherMap from "./LocationWeatherMap";
import ReasoningStream from "./ReasoningStream";
import ActionCards from "./ActionCards";
import GlobeModel from "./GlobeModel";
import { Play, Square, Bot, Shield, BrainCircuit, Activity, MessageSquare, Send, X, ShieldAlert, LogOut } from "lucide-react";
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
  const ws = useRef<WebSocket | null>(null);

  // Poll state endpoint
  useEffect(() => {
    const fetchState = async () => {
      try {
        const host = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
        const res = await fetch(`http://${host}:8000/api/state?shipment_id=${activeShipmentId}`);
        const data = await res.json();
        if (data && data.status !== "idle") {
          setState(data);
        }
      } catch (err) {
        // Silently ignore fetch errors to avoid console spam during hackathon if backend isn't ready
      }
    };

    const interval = setInterval(fetchState, 3000);
    return () => clearInterval(interval);
  }, [activeShipmentId]);

  // Handle WebSockets for live agent streaming
  useEffect(() => {
    const connectWs = () => {
      const host = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
      ws.current = new WebSocket(`ws://${host}:8000/ws/logs`);
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

  const toggleSimulation = async () => {
    const endpoint = isRunning ? "/api/stop" : "/api/start";
    const host = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
    try {
      await fetch(`http://${host}:8000${endpoint}`, { method: 'POST' });
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

  const submitChat = (e?: React.FormEvent, overrideText?: string) => {
    if (e) e.preventDefault();
    const textToSubmit = overrideText || chatQuery;
    if (!textToSubmit.trim()) return;
    
    setChatHistory(prev => [...prev, { sender: "user", text: textToSubmit }]);
    
    const query = textToSubmit.toLowerCase();
    let responseText = "Analyzing query semantics... Based on the latest matrix, our AI agents have simulated options to mitigate active risks.";
    
    // Intelligent keyword-based dynamic responses
    if (query.match(/hi|hello|hey/)) {
       responseText = "Hello! I am Nexus Operations AI. How can I assist you with your supply chain logistics today?";
    } else if (query.includes("cost") || query.includes("financial") || query.includes("money")) {
       const money = state?.decision_result?.options?.[0]?.financials;
       if (money) {
           responseText = `Financial Simulator indicates a delay penalty of ₹${money.delay_cost.toLocaleString()}. By enacting our optimal vector, we avoid the penalty minus a ₹${money.rerouting_cost.toLocaleString()} action cost, netting ₹${money.net_savings.toLocaleString()} in savings.`;
       } else {
           responseText = "Financials are stable. No current delay penalties mapped.";
       }
    } else if (query.includes("delay") || query.includes("eta") || query.includes("time") || query.includes("late")) {
       if (state?.eta_result) {
           responseText = `Shipment ${state.shipment?.id} was originally due ${state.eta_result.original_eta}. We predict a revised ETA of ${state.eta_result.predicted_eta} (${state.eta_result.delay_probability_percent}% probability) due to ${state.monitor_result?.anomaly_type || 'unforeseen disruptions'}.`;
       } else {
           responseText = "All shipments are currently mapping to their original ETAs. No delays detected on-chain.";
       }
    } else if (query.includes("risk") || query.includes("danger") || query.includes("weather")) {
       if (state?.risk_result) {
           responseText = `System indicates a ${state.risk_result.risk_category} threat level (Score: ${state.risk_result.risk_score}). Reason: ${state.risk_result.reason}.`;
       } else {
           responseText = "Threat vectors are currently low across the designated route.";
       }
    } else if (query.includes("vendor") || query.includes("score") || query.includes("supplier")) {
       if (state?.shipment?.vendor_details) {
           const v = state.shipment.vendor_details;
           responseText = `${v.vendor_name} currently holds an ML reliability score of ${v.reliability_score}/100. Their delay history is mapped as ${v.delay_history_rating}.`;
       } else {
           responseText = "Vendor metrics are mapping nominally. No active SLA breaches recorded.";
       }
    } else if (query.includes("more") || query.includes("info") || query.includes("detail") || query.includes("explain") || query.includes("about")) {
       if (state?.report_result) {
           responseText = `Detailed Analysis: ${state.report_result.explanation} The AI resolution was evaluated by the policy engine and is designated as: ${state.policy_result?.approved ? 'POLICY VALIDATED' : 'MANUAL APPROVAL REQUIRED'}.`;
       } else if (state?.monitor_result) {
           responseText = `Current situation context: ${state.monitor_result.description}. We are monitoring the vector.`;
       } else {
           responseText = "Our agent swarm is continuously analyzing real-time data from 400+ endpoints. No further anomalies are actively flagged.";
       }
    }

    setChatQuery("");
    
    setTimeout(() => {
       setChatHistory(prev => [...prev, { 
         sender: "nexus", 
         text: responseText 
       }]);
    }, 600 + Math.random() * 500); // 600 - 1100ms fake thinking delay
  }

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

    </div>
  );
}
