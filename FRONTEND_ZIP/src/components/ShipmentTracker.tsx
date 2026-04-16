"use client";

import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Navigation, Clock, ShieldAlert } from "lucide-react";

export default function ShipmentTracker({ state }: { state: any }) {
  if (!state || !state.shipment) {
    return (
      <div className="glass-panel h-full flex items-center justify-center text-slate-500">
        Waiting for telemetry data...
      </div>
    );
  }

  const { shipment, weather_data, risk_result, eta_result } = state;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel-accent p-6 rounded-2xl flex flex-col gap-6"
    >
      <div className="flex justify-between items-start border-b border-cyan-500/20 pb-4">
        <div>
          <h2 className="text-2xl font-black tracking-widest text-teal-300 neon-text-cyan mb-1">{shipment.id}</h2>
          <p className="text-sm font-mono text-slate-400">{shipment.origin} <span className="text-teal-500">→</span> {shipment.destination}</p>
        </div>
        <motion.div 
          animate={{ boxShadow: ["0px 0px 5px #14b8a6", "0px 0px 15px #14b8a6", "0px 0px 5px #14b8a6"] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="px-4 py-1.5 bg-teal-500/10 text-teal-300 rounded-full text-xs font-bold border border-teal-500/30 tracking-widest uppercase"
        >
          {shipment.status}
        </motion.div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-black/40 p-4 rounded-xl border border-slate-700/50 hover:border-cyan-500/30 transition-colors">
          <div className="flex items-center gap-2 mb-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
            <Navigation className="w-3.5 h-3.5 text-cyan-500" /> Current Node
          </div>
          <div className="font-mono text-lg text-slate-200">{shipment.current_location}</div>
          {weather_data && weather_data.weather && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="mt-3 text-xs font-medium text-amber-400 bg-amber-500/10 px-2 py-1.5 rounded-md flex items-center gap-2 border border-amber-500/20"
            >
              <AlertTriangle className="w-3.5 h-3.5"/> 
              <span className="uppercase tracking-widest">{weather_data.weather[0].description}</span>
            </motion.div>
          )}
        </div>

        <div className="bg-black/40 p-4 rounded-xl border border-slate-700/50 hover:border-purple-500/30 transition-colors relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5 text-purple-400" /> Time to Target
          </div>
          <div className="font-mono text-lg">
            {eta_result ? <span className="text-rose-500 line-through mr-2 opacity-50 text-sm">{eta_result.original_eta}</span> : shipment.eta}
            {eta_result && <span className="text-teal-400 drop-shadow-md">{eta_result.predicted_eta}</span>}
          </div>
          {eta_result && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="mt-3 text-xs font-mono font-bold text-rose-300 bg-rose-500/20 inline-block px-2 py-1.5 rounded border border-rose-500/30"
            >
              DELAY_PROBABILITY: {eta_result.delay_probability_percent}%
            </motion.div>
          )}
        </div>
      </div>

      {risk_result && (
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring" }}
          className={`p-4 rounded-xl border-l-4 flex items-start gap-4 ${
            risk_result.risk_category === 'HIGH' ? 'bg-rose-950/40 border-rose-500 text-rose-200 shadow-[inset_0_0_20px_rgba(244,63,94,0.1)]' :
            risk_result.risk_category === 'MEDIUM' ? 'bg-amber-950/40 border-amber-500 text-amber-200' :
            'bg-teal-950/40 border-teal-500 text-teal-200'
          }`}
        >
          {risk_result.risk_category === 'HIGH' ? <ShieldAlert className="w-6 h-6 mt-1 flex-shrink-0 text-rose-400 animate-pulse" /> : <CheckCircle2 className="w-6 h-6 mt-1 flex-shrink-0 text-teal-400" />}
          <div>
            <div className="font-bold flex items-center gap-3 mb-1.5 uppercase tracking-widest text-sm">
              Threat Level: 
              <span className={`${risk_result.risk_category === 'HIGH' ? 'text-rose-400 neon-text-magenta' : 'text-teal-400'}`}>
                {risk_result.risk_category}
              </span>
              <span className="text-[10px] bg-black/60 px-2 py-0.5 rounded border border-white/10 font-mono">
                SCORE:{risk_result.risk_score}
              </span>
            </div>
            <p className="text-sm opacity-90 leading-relaxed font-mono">{risk_result.reason}</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
