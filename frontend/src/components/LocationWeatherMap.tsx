"use client";

import React, { useMemo } from 'react';
import { Map, Marker, Overlay } from 'pigeon-maps';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

const defaultCenter: [number, number] = [20.5937, 78.9629]; // India

export default function LocationWeatherMap({ state }: { state: any }) {
  const weatherData = state?.weather_data;
  const riskData = state?.risk_result;
  
  const markerPosition = useMemo(() => {
    if (weatherData && weatherData.coord) {
      return [weatherData.coord.lat, weatherData.coord.lon] as [number, number];
    }
    return null;
  }, [weatherData]);

  // Provide some fake coordinates for the "high risk zones" near the actual marker to draw heatmaps.
  const riskZones = useMemo(() => {
     if (!riskData?.high_risk_zones || !markerPosition) return [];
     return riskData.high_risk_zones.map((zone: string, idx: number) => {
        // Just offset the zone slightly from the actual marker for visual danger areas
        return {
           name: zone,
           coord: [markerPosition[0] + (idx * 0.5 - 0.25), markerPosition[1] + (idx * 0.5 - 0.25)] as [number, number]
        };
     });
  }, [riskData, markerPosition]);

  return (
    <div className="w-full h-full min-h-[300px] relative rounded-xl overflow-hidden glass-panel bg-[#02040a]/80 p-0 border border-slate-700 shadow-xl shadow-cyan-900/10 flex flex-col">
      <div className="absolute inset-x-0 top-4 text-center z-10 pointer-events-none">
        <p className="text-xs font-mono text-teal-400 tracking-widest neon-text-cyan flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse hidden sm:inline-block"></span>
          REAL-TIME SATELLITE & RISK HEATMAP
        </p>
      </div>

      <div className="flex-1 relative filter brightness-90 contrast-125 sepia-[0.3] hue-rotate-[180deg]">
        <Map 
          defaultCenter={markerPosition || defaultCenter} 
          defaultZoom={markerPosition ? 6 : 4}
          animate={true}
          metaWheelZoom={true}
        >
          {/* Render Heatmap Overlays */}
          {riskZones.map((zone: { name: string, coord: [number, number] }, idx: number) => (
            <Overlay key={idx} anchor={zone.coord} offset={[50, 50]}>
               <div className="relative flex items-center justify-center w-[100px] h-[100px] pointer-events-none">
                  <motion.div 
                     animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0.1, 0.4] }}
                     transition={{ duration: 4, repeat: Infinity }}
                     className="absolute inset-0 bg-red-500 rounded-full blur-xl"
                  />
                  <div className="absolute top-0 text-[10px] font-bold text-red-100 bg-red-900/80 px-1 rounded border border-red-500/50">
                     ⚠️ {zone.name}
                  </div>
               </div>
            </Overlay>
          ))}

          {/* Render Actual Marker */}
          {markerPosition && (
            <Marker width={40} anchor={markerPosition} color="#14b8a6" />
          )}

          {markerPosition && weatherData && (
             <Overlay anchor={markerPosition} offset={[-15, 60]}>
               <div className="bg-black/80 backdrop-blur-md border border-cyan-500/30 p-2 rounded text-slate-200 text-xs shadow-xl min-w-[150px]">
                  <h3 className="font-bold text-sm text-cyan-400 mb-1">{weatherData.name || 'Location'}</h3>
                  <div className="space-y-1 font-mono">
                    <p className="capitalize flex items-center justify-between">
                      <span className="opacity-70">Sky:</span> 
                      <span className="font-semibold text-emerald-400">{weatherData.weather?.[0]?.description}</span>
                    </p>
                    <p className="flex items-center justify-between">
                      <span className="opacity-70">Temp:</span> 
                      <span className="font-semibold">{weatherData.main?.temp}°C</span>
                    </p>
                    <p className="flex items-center justify-between">
                      <span className="opacity-70">Hum:</span> 
                      <span className="font-semibold">{weatherData.main?.humidity}%</span>
                    </p>
                  </div>
               </div>
             </Overlay>
          )}
        </Map>
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
                      <span className={`${riskData.risk_category === 'HIGH' ? 'text-rose-400' : 'text-amber-400'}`}>{riskData.risk_category} ({riskData.risk_score})</span>
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
