"use client";

import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Navigation, Clock, ShieldAlert, Thermometer, Droplets, Lock, Star, Link as LinkIcon } from "lucide-react";

export default function ShipmentTracker({ state }: { state: any }) {
  if (!state || !state.shipment) {
    return (
      <div className="glass-panel h-full flex items-center justify-center text-slate-500 font-mono animate-pulse">
        Waiting for telemetry data...
      </div>
    );
  }

  const { shipment, weather_data, risk_result, eta_result } = state;
  const iot = shipment.iot_telemetry;
  const vendor = shipment.vendor_details;
  const sla = shipment.sla_contract;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel-accent p-6 rounded-2xl flex flex-col gap-5 h-[350px] overflow-y-auto custom-scrollbar"
    >
      <div className="flex flex-col gap-3 border-b border-cyan-500/20 pb-4">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-2xl font-black tracking-widest text-teal-300 neon-text-cyan flex items-center flex-wrap gap-3">
              {shipment.id}
            </h2>
            {sla && (
              <span className={`w-fit text-[10px] px-2 py-0.5 rounded-full border ${sla.contract_status === 'AT RISK' ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 animate-pulse' : 'bg-teal-500/20 text-teal-400 border-teal-500/50'}`}>
                SLA: {sla.contract_status}
              </span>
            )}
          </div>
          <motion.div 
            animate={{ boxShadow: ["0px 0px 5px #14b8a6", "0px 0px 15px #14b8a6", "0px 0px 5px #14b8a6"] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="px-3 py-1 bg-teal-500/10 text-teal-300 rounded-full text-[10px] md:text-xs font-bold border border-teal-500/30 tracking-widest uppercase shrink-0"
          >
            {shipment.status}
          </motion.div>
        </div>
        <p className="text-sm font-mono text-slate-400 mt-1">{shipment.origin} <span className="text-teal-500">→</span> {shipment.destination}</p>
      </div>

      {/* IoT & Telemetry Row */}
      {iot && (
        <div className="flex justify-between bg-black/60 rounded-xl p-4 border border-slate-700/50 shadow-inner relative">
           <div className="absolute top-0 right-0 p-1 opacity-20"><Lock className={`w-12 h-12 ${iot.container_locked ? 'text-teal-500' : 'text-rose-500'}`} /></div>
           <div className="flex items-center gap-2 md:gap-4 z-10 w-full justify-between">
              <div className="flex flex-col items-center">
                 <div className="text-[9px] md:text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1 mb-1"><Thermometer className="w-3 h-3 text-cyan-400"/> Temp</div>
                 <div className="font-mono text-base md:text-lg text-cyan-300">{iot.temperature_c.toFixed(1)}°C</div>
              </div>
              <div className="flex flex-col items-center border-l border-white/5 pl-2 md:pl-4">
                 <div className="text-[9px] md:text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1 mb-1"><Droplets className="w-3 h-3 text-blue-400"/> Humidity</div>
                 <div className="font-mono text-base md:text-lg text-blue-300">{iot.humidity_percent.toFixed(1)}%</div>
              </div>
              <div className="flex flex-col items-center border-l border-white/5 pl-2 md:pl-4">
                 <div className="text-[9px] md:text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1 mb-1"><Star className="w-3 h-3 text-amber-400"/> Vendor</div>
                 <div className="font-mono text-base md:text-lg text-amber-300">{vendor?.reliability_score || 85}/100</div>
              </div>
           </div>
        </div>
      )}

      {/* Tracking Data Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-black/40 p-4 rounded-xl border border-slate-700/50 hover:border-cyan-500/30 transition-colors">
          <div className="flex items-center gap-2 mb-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
            <Navigation className="w-3.5 h-3.5 text-cyan-500" /> Current Node
          </div>
          <div className="font-mono text-sm md:text-md text-slate-200">{shipment.current_location}</div>
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
          <div className="font-mono text-lg flex flex-col xl:flex-row xl:items-center xl:gap-2">
            {eta_result ? <span className="text-rose-500 line-through opacity-50 text-sm">{eta_result.original_eta}</span> : <span>{shipment.eta}</span>}
            {eta_result && <span className="text-teal-400 drop-shadow-md">{eta_result.predicted_eta}</span>}
          </div>
          {eta_result && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="mt-3 text-xs font-mono font-bold text-rose-300 bg-rose-500/20 inline-block px-2 py-1.5 rounded border border-rose-500/30"
            >
              DELAY_PROB: {eta_result.delay_probability_percent}%
            </motion.div>
          )}
        </div>
      </div>

      {shipment.dependencies && shipment.dependencies.length > 0 && (
         <div className="bg-indigo-950/20 p-2 inset-0 border border-indigo-500/20 rounded text-xs flex items-center gap-2 text-indigo-300 font-mono">
            <LinkIcon className="w-3 h-3 text-indigo-400" />
            Dependency: {shipment.dependencies[0].dependency_type} ({shipment.dependencies[0].related_shipment_id})
         </div>
      )}

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
