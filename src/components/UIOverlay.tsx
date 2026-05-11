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
      
      {/* Narrative Alert */}
      {narrative && (
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-full max-w-2xl pointer-events-none">
          <div className="bg-[#14151a]/80 backdrop-blur-xl border-l-4 border-phantasm-accent p-8 rounded-r-2xl shadow-2xl transform animate-in fade-in slide-in-from-top-10 duration-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-2 h-2 rounded-full bg-phantasm-accent animate-pulse" />
              <span className="text-[10px] font-mono text-phantasm-accent-light uppercase tracking-[0.3em] font-bold">Battle Intelligence Analysis</span>
            </div>
            <p className="text-xl text-white/90 font-light leading-relaxed italic tracking-wide">
              "{narrative}"
            </p>
          </div>
        </div>
      )}

      {/* Bottom Controls Section */}
      <div className="flex justify-between items-end gap-10">
        
        {/* Left: Main Controls */}
        <div className="flex-1 max-w-xl pointer-events-auto space-y-6">
          <div className="bg-[#14151a]/60 backdrop-blur-md border border-white/10 p-6 rounded-2xl flex items-center justify-between shadow-xl">
            <div className="flex gap-4">
              <button 
                onClick={onPrev}
                className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all group active:scale-95"
              >
                <SkipBack size={20} className="group-hover:text-phantasm-accent transition-colors" />
              </button>
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-8 py-4 bg-phantasm-accent text-white font-bold hover:bg-phantasm-accent-light border border-white/10 rounded-full transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_-5px_rgba(99,102,241,0.6)] flex items-center gap-2"
              >
                {isPlaying ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" />}
                <span className="uppercase tracking-widest text-xs">{isPlaying ? "Pause Sequence" : "Initialize Playback"}</span>
              </button>
              <button 
                onClick={onNext}
                className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all group active:scale-95"
              >
                <SkipForward size={20} className="group-hover:text-phantasm-accent transition-colors" />
              </button>
            </div>

            <div className="text-right">
              <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-1">Time Variance</p>
              <p className="text-2xl font-mono tabular-nums text-phantasm-accent-light">
                {String(Math.floor((currentStep + 1) / 60)).padStart(2, '0')}:{String((currentStep + 1) % 60).padStart(2, '0')}
              </p>
            </div>
          </div>

          {/* Timeline Bar */}
          <div className="w-full flex gap-1 h-1.5 items-end px-2">
            {history.map((_, i) => (
              <div 
                key={i} 
                className={cn(
                  "flex-1 h-full transition-all duration-500 rounded-full cursor-pointer pointer-events-auto",
                  i <= currentStep ? "bg-phantasm-accent shadow-[0_0_10px_rgba(99,102,241,0.5)]" : "bg-white/5 hover:bg-white/20"
                )}
                onClick={() => onSkip(i)}
              />
            ))}
          </div>
        </div>

        {/* Right: Tactical Log */}
        <div className="w-80 pointer-events-auto">
          <div className="bg-[#14151a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl max-h-[300px] flex flex-col">
            <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
              <div className="flex items-center gap-2 text-slate-400">
                <History size={14} />
                <span className="text-[10px] uppercase font-bold tracking-widest">Tactical Log</span>
              </div>
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
            </div>
            <div className="grid grid-cols-4 gap-2 overflow-y-auto pr-2 custom-scrollbar">
              {history.map((move, i) => (
                <button
                  key={i}
                  onClick={() => onSkip(i)}
                  className={cn(
                    "text-[10px] font-mono py-2 rounded border border-transparent transition-all",
                    i === currentStep 
                      ? "bg-phantasm-accent/20 border-phantasm-accent text-phantasm-accent-light font-bold" 
                      : "text-slate-500 hover:text-slate-200 hover:bg-white/5"
                  )}
                >
                  {move.san}
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
