"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, Cpu } from "lucide-react";

// ChatGPT style typewriter effect component
function TypewriterLine({ text, speed = 20 }: { text: string, speed?: number }) {
  const [displayed, setDisplayed] = useState("");
  
  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.substring(0, i + 1));
        i++;
      } else {
        clearInterval(timer);
      }
    }, speed);
    
    return () => clearInterval(timer);
  }, [text, speed]);
  
  return <span>&gt; {displayed}</span>;
}

export default function ReasoningStream({ logs }: { logs: any[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      // Force scroll after a short delay to account for typing
      const scrollNext = () => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }
      scrollNext();
      const scrollInterval = setInterval(scrollNext, 100);
      setTimeout(() => clearInterval(scrollInterval), 5000); // clear after 5s of typing
      return () => clearInterval(scrollInterval);
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
        className="flex-1 overflow-y-auto space-y-3 pr-2 scroll-smooth"
      >
        <AnimatePresence initial={false}>
          {logs.map((log, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`p-3 rounded-md border shadow-lg ${
                log.status === 'RUNNING' ? 'bg-indigo-950/30 border-indigo-500/20 text-indigo-200' :
                log.status === 'STOPPED' ? 'bg-rose-950/30 border-rose-500/20 text-rose-200' :
                'bg-emerald-950/30 border-emerald-500/20 text-emerald-200 shadow-emerald-900/20'
              }`}
            >
              <div className="flex items-center gap-2 mb-2 opacity-70 text-xs border-b border-white/5 pb-1">
                <Cpu className="w-3 h-3" />
                <span className="font-bold">[{log.agent_name}]</span>
                <span className="ml-auto opacity-50">{new Date(log.timestamp || Date.now()).toLocaleTimeString()}</span>
              </div>
              <div className="text-slate-300 flex flex-col gap-1">
                {log.logs.map((l: string, i: number) => (
                   <TypewriterLine key={i} text={l} />
                ))}
              </div>
              {log.output && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ delay: 0.5 }}
                  className="mt-3 text-xs p-2 bg-black/40 rounded border border-white/10 overflow-x-auto text-slate-400 group relative"
                >
                  <pre>{JSON.stringify(log.output, null, 2)}</pre>
                </motion.div>
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
