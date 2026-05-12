import type { Move } from "chess.js";
import { cn } from "../lib/utils";

interface UIProps {
  narrative: string | null;
  currentStep: number;
  history: Move[];
  onSkip: (idx: number) => void;
}

export function UIOverlay({ narrative, currentStep, history, onSkip }: UIProps) {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-end p-8 z-10 font-sans">

      {/* Narrative — top center, plain text */}
      {narrative && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-full max-w-2xl text-center animate-in fade-in duration-700 pointer-events-none">
          <p
            className="text-xl text-white/70 font-light leading-relaxed tracking-wide"
            style={{ textShadow: "0 1px 12px rgba(0,0,0,0.9)" }}
          >
            {narrative}
          </p>
        </div>
      )}

      {/* Bottom row: timeline + move log */}
      <div className="flex justify-between items-end gap-8">

        {/* Timeline scrubber */}
        <div className="flex-1 flex gap-1 h-1.5 items-end">
          {history.map((_, i) => (
            <div
              key={i}
              className={cn(
                "flex-1 transition-all duration-500 cursor-pointer pointer-events-auto rounded-full",
                i <= currentStep
                  ? "h-3 bg-phantasm-accent-light opacity-100"
                  : "h-1.5 bg-white/10 opacity-40 hover:opacity-80 hover:h-2"
              )}
              onClick={() => onSkip(i)}
            />
          ))}
        </div>

        {/* Move log — plain text grid */}
        <div className="w-56 pointer-events-auto max-h-52 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-3 gap-x-3 gap-y-0.5">
            {history.map((move, i) => (
              <button
                key={i}
                onClick={() => onSkip(i)}
                className={cn(
                  "text-[10px] font-mono py-1 text-left transition-all duration-200",
                  i === currentStep
                    ? "text-phantasm-accent-light font-bold"
                    : "text-white/25 hover:text-white/60"
                )}
                style={i === currentStep ? { textShadow: "0 0 8px rgba(99,102,241,0.8)" } : undefined}
              >
                {move.san}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
