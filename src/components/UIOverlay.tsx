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

      {/* Narrative — key-move tactical announcement */}
      {narrative && (
        <div
          key={narrative}
          className="narrative-banner absolute top-[13vh] left-0 right-0 text-center pointer-events-none"
        >
          <p className="narrative-text">
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
