"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, ShieldAlert, Activity, CheckCircle, Search, Anchor } from "lucide-react";

const HISTORICAL_SHIPS = [
  { id: "SHP-X9001", route: "Singapore → Mumbai", status: "AT RISK", risk_level: "HIGH", logs: "Storm Warning: Port Congestion ETA +3 days. Auto-Pilot intervened.", vendor: "Mærsk (85)", time: "2 Mins Ago" },
  { id: "SHP-X9002", route: "Shanghai → Rotterdam", status: "ON TIME", risk_level: "LOW", logs: "Cleared Suez Canal without anomaly. Temperature strictly nominal.", vendor: "Hapag-Lloyd (92)", time: "14 Mins Ago" },
  { id: "SHP-X9003", route: "New York → London", status: "DELAYED", risk_level: "MEDIUM", logs: "SLA Threshold Breached. Customs Documentation hold identified.", vendor: "MSC (78)", time: "1 Hr Ago" },
  { id: "SHP-X9004", route: "Tokyo → San Francisco", status: "ON TIME", risk_level: "LOW", logs: "Pacific traverse clear. Fuel expenditure optimized.", vendor: "CMA CGM (89)", time: "3 Hrs Ago" },
  { id: "SHP-X9005", route: "Dubai → Chennai", status: "AT RISK", risk_level: "HIGH", logs: "Piracy vectors detected in adjacent geo-segment. Security reroute confirmed.", vendor: "Evergreen (84)", time: "4 Hrs Ago" },
  { id: "SHP-X9006", route: "Sydney → Los Angeles", status: "ON TIME", risk_level: "LOW", logs: "Routine waypoint reached. Humidity locked at 42%.", vendor: "COSCO (88)", time: "6 Hrs Ago" }
];

export default function HistoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [fleetLogs, setFleetLogs] = useState(HISTORICAL_SHIPS);

  // Dynamically pull latest state for all active pipelines
  useEffect(() => {
    const fetchState = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiUrl}/api/states`);
        const statesData = await res.json();
        
        if (statesData) {
           setFleetLogs(prev => {
              const newLogs = [...prev];
              
              for (const shipId in statesData) {
                  const data = statesData[shipId];
                  if (!data || data.status === "idle" || !data.shipment) continue;

                  const isHighRisk = data.risk_result?.risk_category === "HIGH";
                  const isDelayed = data.eta_result && (data.eta_result.predicted_eta > data.eta_result.original_eta);
                  
                  const liveStatus = isHighRisk ? 'AT RISK' : (isDelayed ? 'DELAYED' : 'ON TIME');
                  const riskLevel = data.risk_result?.risk_category || 'NOMINAL';
                  
                  let logContext = data.monitor_result?.description || 'Active AI tracking mapping...';
                  if (data.decision_result?.options?.length > 0) {
                      logContext = `AI Intervened: Option [${data.decision_result.options[0].action}] selected. ${data.risk_result?.reason || ''}`;
                  }

                  const idx = newLogs.findIndex(s => s.id === data.shipment.id);
                  if (idx !== -1) {
                      newLogs[idx] = {
                          ...newLogs[idx],
                          status: liveStatus,
                          risk_level: riskLevel,
                          logs: `${logContext} [Loc: ${data.shipment.current_location}]`,
                          time: "LIVE",
                      };
                  }
              }
              return newLogs;
           });
        }
      } catch (err) {
        // Silent catch for hackathon
      }
    };

    const interval = setInterval(fetchState, 3000);
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = fleetLogs.filter(s => s.id.toLowerCase().includes(searchTerm.toLowerCase()) || s.route.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#02040a] p-4 md:p-8 font-sans text-slate-200">
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel border-b-2 border-b-indigo-500/30"
        >
          <div className="flex items-center gap-4">
             <Link href="/">
               <div className="p-2 bg-slate-800/50 hover:bg-slate-700 rounded-full border border-slate-600 transition-colors cursor-pointer text-slate-300">
                  <ArrowLeft className="w-5 h-5"/>
               </div>
             </Link>
             <div>
               <h1 className="text-2xl font-black tracking-widest text-indigo-400 flex items-center gap-2">
                 GLOBAL FLEET LOGS
               </h1>
               <p className="text-slate-400 text-xs uppercase tracking-widest font-bold">Historical Matrix Archive</p>
             </div>
          </div>
          
          <div className="flex items-center gap-3 bg-black/50 border border-slate-700 p-2 rounded-lg w-full md:w-[300px]">
             <Search className="w-4 h-4 text-slate-400" />
             <input 
               type="text"
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
               placeholder="Search SHP-ID or Route..."
               className="bg-transparent border-none outline-none text-sm w-full text-slate-200" 
             />
          </div>
        </motion.div>

        {/* Data Grid */}
        <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           className="glass-panel-accent p-0 overflow-hidden border border-indigo-900/40 rounded-2xl"
        >
           <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[900px]">
                 <thead>
                    <tr className="bg-black/80 border-b border-indigo-500/20 text-xs uppercase tracking-widest text-indigo-300">
                       <th className="p-4 rounded-tl-xl">Asset ID</th>
                       <th className="p-4">Geospatial Route</th>
                       <th className="p-4">Status & Risk</th>
                       <th className="p-4">Vendor</th>
                       <th className="p-4 w-[35%]">Last Log Entry</th>
                       <th className="p-4 rounded-tr-xl">Timestamp</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-800/80">
                    {filteredLogs.map((ship, idx) => (
                       <motion.tr 
                         key={idx}
                         initial={{ opacity: 0, x: -10 }}
                         animate={{ opacity: 1, x: 0 }}
                         transition={{ delay: idx * 0.1 }}
                         className="hover:bg-indigo-900/10 transition-colors group"
                       >
                          <td className="p-4 font-mono font-bold text-slate-200 flex items-center gap-2">
                             <Anchor className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 transition-colors" /> {ship.id}
                          </td>
                          <td className="p-4 text-sm font-mono text-slate-400">{ship.route.replace('→', ' ➔ ')}</td>
                          <td className="p-4">
                             <div className="flex flex-col gap-1.5">
                               {ship.status === 'AT RISK' && <span className="w-fit text-[10px] px-2 py-0.5 bg-rose-500/20 text-rose-400 rounded border border-rose-500/50 uppercase tracking-widest font-bold">⚠️ AT RISK</span>}
                               {ship.status === 'DELAYED' && <span className="w-fit text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded border border-amber-500/50 uppercase tracking-widest font-bold">⏳ DELAYED</span>}
                               {ship.status === 'ON TIME' && <span className="w-fit text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/50 uppercase tracking-widest font-bold">✔️ ON TIME</span>}
                               
                               <span className={`text-[9px] uppercase tracking-widest font-bold flex items-center gap-1 ${ship.risk_level === 'HIGH' ? 'text-rose-500' : ship.risk_level === 'MEDIUM' ? 'text-amber-500' : 'text-emerald-500'}`}>
                                  <ShieldAlert className="w-3 h-3" /> Risk: {ship.risk_level}
                               </span>
                             </div>
                          </td>
                          <td className="p-4 text-sm text-cyan-200">
                             {ship.vendor}
                          </td>
                          <td className="p-4 text-xs font-mono text-slate-300 opacity-80 leading-relaxed">
                             {ship.logs}
                          </td>
                          <td className="p-4 text-xs font-mono text-slate-500 flex items-center gap-1.5">
                             <Clock className="w-3 h-3" /> {ship.time}
                          </td>
                       </motion.tr>
                    ))}
                 </tbody>
              </table>
              {filteredLogs.length === 0 && (
                 <div className="p-12 text-center text-slate-500 font-mono flex flex-col items-center gap-2">
                    <Activity className="w-8 h-8 opacity-50" />
                    No shipments matching current query matrix.
                 </div>
              )}
           </div>
        </motion.div>
      </div>
    </div>
  );
}
