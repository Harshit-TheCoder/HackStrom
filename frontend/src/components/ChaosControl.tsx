"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Wind, CloudRain, Zap, X, AlertTriangle, ShieldCheck, Anchor, DollarSign, Snowflake, Droplets } from "lucide-react";

interface Shipment {
  id: string;
  route: string;
}

export default function ChaosControl({ 
  activeShipmentId, 
  onShipmentChange, 
  mode = "chaos" 
}: { 
  activeShipmentId: string, 
  onShipmentChange: (id: string) => void,
  mode?: "nominal" | "chaos" | "all"
}) {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selectedShipment, setSelectedShipment] = useState(activeShipmentId);
  const [isInjecting, setIsInjecting] = useState(false);
  const [activeDisturbances, setActiveDisturbances] = useState<Record<string, any>>({});

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    const fetchShipments = async () => {
      try {
        const res = await fetch(`${API_URL}/api/shipments?mode=${mode}`);
        const data = await res.json();
        setShipments(data);
        
        // Populate active disturbances from names of existing chaos shipments if needed
        // For simplicity, we'll just track the ones launched in this session
      } catch (err) {
        console.error("Failed to fetch shipments", err);
      }
    };
    fetchShipments();
    const interval = setInterval(fetchShipments, 5000);
    return () => clearInterval(interval);
  }, [API_URL, mode]);

  useEffect(() => {
     setSelectedShipment(activeShipmentId);
  }, [activeShipmentId]);

  const launchChaosRoute = async (type: string, severity: string, desc: string) => {
    setIsInjecting(true);
    // Generate a unique ID for the new separate route
    const chaosId = `SHP-CH-${Math.floor(Math.random() * 899) + 100}`;
    try {
      await fetch(`${API_URL}/api/disturb`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shipment_id: chaosId,
          disturbance_type: type,
          severity: severity,
          description: desc
        })
      });
      // Optionally switch to the new route immediately
      onShipmentChange(chaosId);
      setActiveDisturbances(prev => ({ ...prev, [chaosId]: { type, severity } }));
    } catch (err) {
      console.error("Failed to launch chaos route", err);
    } finally {
      setIsInjecting(false);
    }
  };

  const clearDisturbance = async (id: string) => {
    try {
      await fetch(`${API_URL}/api/disturb/${id}`, { method: "DELETE" });
      setActiveDisturbances(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (err) {
      console.error("Failed to clear disturbance", err);
    }
  };

  const DISTURBANCE_TYPES = [
    { id: "suez", label: "Suez Blockage", icon: <Anchor className="w-5 h-5" />, severity: "Critical", desc: "Global artery blockage. Massive trade bottleneck." },
    { id: "bankruptcy", label: "Carrier Bankruptcy", icon: <DollarSign className="w-5 h-5" />, severity: "Critical", desc: "Carrier insolvency. Assets frozen at sea." },
    { id: "tsunami", label: "Tsunami Warning", icon: <CloudRain className="w-5 h-5" />, severity: "Critical", desc: "Regional infrastructure impact due to seismic activity." },
    { id: "cyber", label: "Cyber Lockdown", icon: <Zap className="w-5 h-5" />, severity: "High", desc: "Total IoT failure and remote system breach." },
    { id: "panama", label: "Panama Drought", icon: <Droplets className="w-5 h-5" />, severity: "High", desc: "Water level drop restricting vessel transit." },
    { id: "arctic", label: "Arctic Shortcut", icon: <Snowflake className="w-5 h-5" />, severity: "High", desc: "Experimental polar route under extreme stress." },
  ];

  return (
    <div className="glass-panel border-l border-cyan-500/20 h-full flex flex-col bg-slate-950/40 backdrop-blur-3xl shadow-2xl">
      <div className="p-6 border-b border-cyan-500/10 bg-gradient-to-r from-orange-500/10 to-transparent">
        <h2 className="text-xl font-bold text-orange-400 flex items-center gap-2 uppercase tracking-tighter">
          <Activity className="w-5 h-5 animate-pulse" /> Threat Simulator
        </h2>
        <p className="text-[10px] text-slate-500 font-mono mt-1">Manual Anomaly Injection & Route Spawn</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {/* Launch Mode */}
        <div className="space-y-4">
          <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2 block">
            Select Threat Vector to Launch
          </label>
          {DISTURBANCE_TYPES.map((d) => (
            <motion.button
              key={d.id}
              whileHover={{ scale: 1.02, x: 5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => launchChaosRoute(d.label, d.severity, d.desc)}
              disabled={isInjecting}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-800 bg-black/40 hover:border-orange-500/30 hover:bg-orange-950/5 transition-all text-left group"
            >
              <div className="p-2 rounded-lg bg-slate-900 text-slate-400 group-hover:text-orange-400 group-hover:bg-orange-900/20 transition-colors">
                {d.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 group-hover:text-white">{d.label}</span>
                  <span className={`text-[8px] px-1.5 py-0.5 rounded-full border ${
                    d.severity === 'Critical' ? 'border-rose-500/40 text-rose-400' : 'border-amber-500/40 text-amber-400'
                  }`}>
                    {d.severity}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 line-clamp-1 group-hover:text-slate-400">{d.desc}</p>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Active Overrides Status */}
        <div className="pt-4 border-t border-white/5">
          <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-4 block flex items-center justify-between">
            Active Chaos Routes
            <span className="text-orange-500 font-mono bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">{Object.keys(activeDisturbances).length}</span>
          </label>
          <div className="space-y-2">
            <AnimatePresence>
              {Object.entries(activeDisturbances).map(([id, data]: [string, any]) => (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => onShipmentChange(id)}
                  className={`border p-3 rounded-lg flex items-center justify-between cursor-pointer transition-all ${
                    activeShipmentId === id ? 'bg-orange-500/10 border-orange-500/40' : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${activeShipmentId === id ? 'bg-orange-400' : 'bg-slate-500'}`} />
                    <div>
                      <span className={`text-[10px] font-bold block ${activeShipmentId === id ? 'text-orange-300' : 'text-slate-400'}`}>{id}</span>
                      <span className="text-[9px] text-slate-500">{data.type}</span>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); clearDisturbance(id); }}
                    className="p-1.5 hover:bg-rose-500/20 rounded-md text-slate-600 hover:text-rose-400 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              ))}
              {Object.keys(activeDisturbances).length === 0 && (
                <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl">
                  <p className="text-[10px] text-slate-600 font-mono italic">No active anomalies detected.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-orange-500/10 bg-black/20">
        <div className="flex items-center gap-2 text-[9px] text-slate-500">
           <AlertTriangle className="w-3 h-3 text-amber-500" />
           <span>Dynamic route generation enabled. All data injected with (MANUALLY CREATED) metadata.</span>
        </div>
      </div>
    </div>
  );
}
