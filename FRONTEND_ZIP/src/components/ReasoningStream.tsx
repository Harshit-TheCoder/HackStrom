"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, Cpu } from "lucide-react";

export default function ReasoningStream({ logs }: { logs: any[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="glass-panel h-[500px] flex flex-col font-mono text-sm relative">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-3 text-indigo-400 font-bold uppercase text-xs tracking-wider">
        <Terminal className="w-4 h-4" /> 
        Live Agent Trace Logs
        <div className="ml-auto w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-3 pr-2"
      >
        <AnimatePresence initial={false}>
          {logs.map((log, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`p-3 rounded-md border ${
                log.status === 'RUNNING' ? 'bg-indigo-950/30 border-indigo-500/20 text-indigo-200' :
                log.status === 'STOPPED' ? 'bg-rose-950/30 border-rose-500/20 text-rose-200' :
                'bg-emerald-950/30 border-emerald-500/20 text-emerald-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-1 opacity-60 text-xs">
                <Cpu className="w-3 h-3" />
                <span className="font-bold">[{log.agent_name}]</span>
                <span className="ml-auto opacity-50">{new Date(log.timestamp || Date.now()).toLocaleTimeString()}</span>
              </div>
              <div className="text-slate-300 flex flex-col gap-1">
                {log.logs.map((l: string, i: number) => (
                   <span key={i} className="leading-relaxed">&gt; {l}</span>
                ))}
              </div>
              {log.output && (
                <div className="mt-2 text-xs p-2 bg-black/40 rounded border border-white/5 overflow-x-auto text-slate-400">
                  <pre>{JSON.stringify(log.output, null, 2)}</pre>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        
        {logs.length === 0 && (
          <div className="flex h-full items-center justify-center text-slate-600 opacity-50 italic">
            Waiting for simulation to start...
          </div>
        )}
      </div>
    </div>
  );
}
