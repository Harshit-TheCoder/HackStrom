"use client";

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import dynamic from 'next/dynamic';

// Next.js requirement to prevent Leaflet from running on Server side
const DynamicMap = dynamic(() => import('./MapComponent'), { 
    ssr: false,
    loading: () => <div className="w-full h-full min-h-[300px] flex items-center justify-center text-cyan-400 animate-pulse bg-black/50">Loading Geospatial Data...</div>
});

export default function LocationWeatherMap({ state }: { state: any }) {
  const riskData = state?.risk_result;

  return (
    <div className="w-full h-full min-h-[300px] relative rounded-xl overflow-hidden glass-panel bg-[#02040a]/80 p-0 border border-slate-700 shadow-xl shadow-cyan-900/10 flex flex-col">
      <div className="absolute inset-x-0 top-4 text-center z-10 pointer-events-none">
        <p className="text-xs font-mono text-teal-400 tracking-widest neon-text-cyan flex items-center justify-center gap-2 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse hidden sm:inline-block"></span>
          REAL-TIME SATELLITE & ROUTING
        </p>
      </div>

      <div className="flex-1 relative z-0">
         <DynamicMap state={state} />
      </div>

      {/* Enhanced Information Overlay */}
      <div className="absolute bottom-4 left-4 z-10 w-[calc(100%-2rem)] md:w-auto md:max-w-[300px] pointer-events-none">
         <div className="bg-black/70 backdrop-blur-md p-3 border border-slate-700/80 rounded-xl shadow-lg">
            <h4 className="text-[10px] text-teal-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5 border-b border-white/10 pb-1">
               <AlertTriangle className="w-3 h-3" /> Live Geospatial Analysis
            </h4>
            
            <div className="space-y-2 text-xs font-mono">
               {riskData ? (
                 <>
                   <div className="flex items-center justify-between">
                      <span className="text-slate-400">Threat Level:</span>
                      <span className={`${riskData.risk_category === 'HIGH' ? 'text-rose-400 font-bold animate-pulse' : 'text-emerald-400'}`}>{riskData.risk_category} ({riskData.risk_score})</span>
                   </div>
                   <div className="text-slate-300 opacity-90 leading-tight">
                      {riskData.reason}
                   </div>
                 </>
               ) : (
                 <div className="text-slate-500 animate-pulse">Awaiting matrix input...</div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
}
