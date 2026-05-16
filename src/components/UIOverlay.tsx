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
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-end px-3 sm:px-8 pb-4 sm:pb-6 z-10 font-sans">

      {/* Narrative — barely-there ambient inscription */}
      {narrative && (
        <div className="absolute top-4 sm:top-6 left-1/2 -translate-x-1/2 w-full max-w-sm sm:max-w-lg px-4 sm:px-0 text-center pointer-events-none">
          <p className="text-[10px] text-white/20 font-light tracking-[0.4em] uppercase leading-loose">
            {narrative}
          </p>
        </div>
      )}

      {/* Timeline scrubber */}
      <div className="flex gap-px h-4 items-end pb-px">
        {history.map((_, i) => (
          <div
            key={i}
            className={cn(
              "flex-1 transition-all duration-400 cursor-pointer pointer-events-auto rounded-full",
              i <= currentStep
                ? "h-2.5 bg-phantasm-accent-light/50"
                : "h-1 bg-white/10 hover:bg-white/25 hover:h-1.5"
            )}
            onClick={() => onSkip(i)}
          />
        ))}
      </div>

    </div>
  );
}
