/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Play, SkipBack, SkipForward, Pause, Info, History } from "lucide-react";
import { cn } from "../lib/utils";

interface UIProps {
  matchInfo: any;
  currentStep: number;
  totalSteps: number;
  narrative: string | null;
  onNext: () => void;
  onPrev: () => void;
  onSkip: (idx: number) => void;
  isPlaying: boolean;
  setIsPlaying: (p: boolean) => void;
  history: any[];
}

export function UIOverlay({ 
  matchInfo, 
  currentStep, 
  totalSteps, 
  narrative, 
  onNext, 
  onPrev, 
  onSkip,
  isPlaying,
  setIsPlaying,
  history
}: UIProps) {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-end p-10 z-10 font-sans">
      
      {/* Battle Intelligence Overlay from Spec */}
      {narrative && (
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-full max-w-2xl pointer-events-none">
          <div className="bg-phantasm-card/80 backdrop-blur-2xl border-l-[6px] border-phantasm-accent p-8 rounded-r-3xl shadow-2xl transform animate-in fade-in slide-in-from-top-12 duration-1000 relative overflow-hidden">
            {/* Background Scanline Pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[repeating-linear-gradient(transparent,transparent_2px,rgba(255,255,255,1)_3px,rgba(255,255,255,1)_3px)] bg-[length:100%_4px]" />
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-phantasm-accent animate-pulse-cyan" />
                <span className="text-[11px] font-mono text-phantasm-accent-light uppercase tracking-[0.4em] font-bold">Battle Intelligence Analysis</span>
              </div>
              <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest">
                Vector_ID: {Math.random().toString(36).substr(2, 6).toUpperCase()}
              </div>
            </div>
            <p className="text-2xl text-white font-light leading-relaxed tracking-wide font-sans">
              {narrative}
            </p>
          </div>
        </div>
      )}

      {/* Bottom Interface Group */}
      <div className="flex justify-between items-end gap-12">
        
        {/* Left: Execution Controls */}
        <div className="flex-1 max-w-xl pointer-events-auto space-y-8">
          <div className="bg-phantasm-card/40 backdrop-blur-xl border border-white/5 p-6 rounded-3xl flex items-center justify-between shadow-2xl relative overflow-hidden group">
            <div className="flex gap-6 relative z-10">
              <button 
                onClick={onPrev}
                className="p-5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all group/btn active:scale-95"
              >
                <SkipBack size={20} className="group-hover/btn:text-phantasm-accent-light transition-colors" />
              </button>
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-10 py-5 bg-phantasm-accent text-white font-bold hover:bg-phantasm-accent-light rounded-2xl transition-all hover:scale-[1.02] active:scale-95 shadow-[0_4px_30px_-5px_rgba(99,102,241,0.5)] flex items-center gap-4 border border-white/10"
              >
                {isPlaying ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" />}
                <span className="uppercase tracking-[0.2em] text-[11px]">{isPlaying ? "Pause Stream" : "Run Sequence"}</span>
              </button>
              <button 
                onClick={onNext}
                className="p-5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all group/btn active:scale-95"
              >
                <SkipForward size={20} className="group-hover/btn:text-phantasm-accent-light transition-colors" />
              </button>
            </div>

            <div className="text-right relative z-10 pr-4 border-r-2 border-phantasm-accent/20">
              <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em] mb-1 font-bold">Temporal Step</p>
              <p className="text-3xl font-mono tabular-nums text-white tracking-tighter">
                {String(currentStep + 1).padStart(2, '0')} <span className="text-phantasm-accent-light opacity-50">/ {totalSteps}</span>
              </p>
            </div>
            
            {/* Ambient Background Glow inside the panel */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-phantasm-accent/5 blur-3xl -translate-y-1/2 translate-x-1/2" />
          </div>

          {/* Precision Timeline Mapper */}
          <div className="w-full flex gap-1.5 h-1.5 items-end px-4">
            {history.map((_, i) => (
              <div 
                key={i} 
                className={cn(
                  "flex-1 transition-all duration-700 cursor-pointer pointer-events-auto rounded-full bg-white/5",
                  i <= currentStep ? "h-3 bg-phantasm-accent-light opacity-100" : "h-1.5 opacity-20 hover:opacity-100 hover:h-2"
                )}
                onClick={() => onSkip(i)}
              />
            ))}
          </div>
        </div>

        {/* Right: Tactical Move Repository */}
        <div className="w-96 pointer-events-auto">
          <div className="bg-phantasm-card/80 backdrop-blur-2xl border border-white/5 rounded-3xl p-8 shadow-2xl max-h-[350px] flex flex-col relative overflow-hidden group">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-phantasm-accent/10 rounded-lg">
                  <History size={16} className="text-phantasm-accent-light" />
                </div>
                <span className="text-[12px] uppercase font-bold tracking-[0.3em] text-white/70">Tactical Log</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)] animate-pulse" />
                <span className="text-[9px] font-mono text-green-500 uppercase">Live_Update</span>
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-3 overflow-y-auto pr-3 custom-scrollbar">
              {history.map((move, i) => (
                <button
                  key={i}
                  onClick={() => onSkip(i)}
                  className={cn(
                    "text-[11px] font-mono py-2.5 rounded-xl border transition-all duration-300",
                    i === currentStep 
                      ? "bg-phantasm-accent/30 border-phantasm-accent text-white font-bold shadow-lg shadow-phantasm-accent/20" 
                      : "text-slate-500 border-white/5 hover:border-white/20 hover:text-white hover:bg-white/5"
                  )}
                >
                  {move.san}
                </button>
              ))}
            </div>
            
            {/* Vignette effect for scroll areas */}
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-phantasm-card to-transparent pointer-events-none" />
          </div>
        </div>

      </div>
    </div>
  );
}
