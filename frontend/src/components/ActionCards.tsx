"use client";

import { motion } from "framer-motion";
import { GitBranch, Zap, FileJson, TrendingDown, DollarSign } from "lucide-react";

export default function ActionCards({ state }: { state: any }) {
  if (!state || !state.decision_result) return null;

  const decision = state.decision_result;
  const sim = state.simulation_result;
  const policy = state.policy_result;
  const recommended = decision.options.find((o: any) => o.action === decision.recommended_action) || decision.options[0];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel-accent overflow-auto custom-scrollbar h-[350px]"
    >
      <div className="flex justify-between items-center mb-6">
         <h3 className="text-xl font-black flex items-center gap-2 text-cyan-300 tracking-widest uppercase">
           <GitBranch className="w-5 h-5 text-cyan-400" />
           AI Resolution Matrix
         </h3>
         {decision.auto_pilot_executed && (
           <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 px-3 py-1 rounded text-[10px] tracking-widest uppercase font-bold animate-pulse">
             🤖 Auto-Pilot Executed
           </span>
         )}
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="bg-gradient-to-br from-[#10172a] to-[#020617] border border-cyan-500/30 p-6 rounded-xl relative overflow-hidden neon-glow group"
      >
        {/* Glow effect */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-500/20 blur-[50px] rounded-full group-hover:bg-cyan-400/30 transition-colors duration-700" />

        <div className="flex justify-between items-start mb-4 relative z-10">
          <div>
            <div className="text-[10px] font-bold text-cyan-400 tracking-[0.2em] uppercase mb-1.5 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> Optimal Vector
            </div>
            <h4 className="text-2xl font-black text-white tracking-wide">{decision.recommended_action}</h4>
          </div>
          
          <div className="text-right">
             <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-1.5">Confidence</div>
             <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                className="text-2xl font-mono font-black text-teal-400 neon-text-cyan flex items-center gap-1 justify-end"
             >
               {(recommended?.confidence_score * 100 || 85).toFixed(0)}<span className="text-sm opacity-50">%</span>
             </motion.div>
          </div>
        </div>

        {/* Financial Simulator */}
        {recommended?.financials && (
          <motion.div 
             initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} transition={{ delay: 0.4 }}
             className="bg-black/50 border border-white/5 rounded-lg p-3 my-4 relative z-10 font-mono text-xs text-slate-300"
          >
             <div className="font-bold text-[10px] uppercase text-emerald-400 mb-2 flex flex-row items-center gap-1 border-b border-white/10 pb-1">
                <DollarSign className="w-3 h-3" /> Financial Impact Simulator
             </div>
             <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="flex justify-between"><span>SLA Delay Cost:</span> <span className="text-rose-400">-₹{recommended.financials.delay_cost.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Action Cost:</span> <span className="text-amber-400">-₹{recommended.financials.rerouting_cost.toLocaleString()}</span></div>
             </div>
             <div className="mt-2 pt-2 border-t border-white/10 flex justify-between font-bold text-sm text-emerald-300 bg-emerald-500/10 p-1.5 rounded">
                <span>Net Penalty Savings:</span>
                <span>+₹{recommended.financials.net_savings.toLocaleString()}</span>
             </div>
          </motion.div>
        )}

        {sim && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            className="grid grid-cols-2 gap-4 mt-4 relative z-10"
          >
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1.5">Temporal Impact</div>
              <div className="text-sm font-mono text-teal-300 bg-teal-950/40 px-3 py-1.5 rounded inline-block border border-teal-500/30">{sim.time_impact}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1.5">Capital Impact</div>
              <div className="text-sm font-mono flex items-center gap-1.5 text-rose-300 bg-rose-950/40 px-3 py-1.5 rounded inline-flex border border-rose-500/30">
                <TrendingDown className="w-4 h-4 text-rose-400" /> {sim.cost_impact}
              </div>
            </div>
          </motion.div>
        )}

        {policy && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
            className="mt-6 pt-5 border-t border-cyan-500/20 relative z-10"
          >
             <div className={`p-4 rounded-xl border text-sm flex items-start gap-4 ${policy.approved ? 'bg-teal-950/30 border-teal-500/40 text-teal-200' : 'bg-rose-950/30 border-rose-500/40 text-rose-200'}`}>
                <FileJson className={`w-6 h-6 flex-shrink-0 mt-0.5 ${policy.approved ? 'text-teal-400' : 'text-rose-400'}`} />
                <div>
                  <div className="font-bold tracking-wider uppercase text-[11px] mb-1 opacity-80">{policy.approved ? "Policy Validated" : "Manual Override Required"}</div>
                  <div className="font-mono text-sm leading-relaxed">{policy.notes}</div>
                </div>
             </div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
