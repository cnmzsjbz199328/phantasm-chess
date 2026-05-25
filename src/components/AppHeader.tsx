import { Shield, Play, Pause, SkipBack, SkipForward, VolumeX, Volume, Volume1, Volume2, Maximize2, Minimize2 } from 'lucide-react';
import { THEMES } from '../shared/themes';
import { ChessTitle } from './ChessTitle';
import { cn } from '../lib/utils';
import type { AppPhase } from '../shared/AppPhase';
import { COMMENTARY_LEVELS, BG_LEVELS } from '../shared/audioLevels';

const VOLUME_ICONS = [VolumeX, Volume, Volume1, Volume2] as const;

interface AppHeaderProps {
  appPhase: AppPhase;
  currentStep: number;
  totalSteps: number;
  themeIdx: number;
  onThemeChange: (idx: number) => void;
  isPlaying: boolean;
  controlsLocked: boolean;
  playButtonDisabled: boolean;
  isFullscreen: boolean;
  headerVisible: boolean;
  showHeader: () => void;
  scheduleHideHeader: () => void;
  toggleFullscreen: () => void;
  commentaryLvlIdx: number;
  onCommentaryLvlChange: (idx: number) => void;
  bgLvlIdx: number;
  onBgLvlChange: (idx: number) => void;
  commentaryVol: number;
  bgVol: number;
  onPrevStep: () => void;
  onNextStep: () => void;
  onPlayPause: () => void;
}

/**
 * Full application header: logo, scene switcher, playback controls,
 * fullscreen toggle, and volume controls. Hides itself after 2 s in
 * fullscreen mode; reveals on mouse enter.
 */
export function AppHeader({
  appPhase, currentStep, totalSteps,
  themeIdx, onThemeChange,
  isPlaying, controlsLocked, playButtonDisabled,
  isFullscreen, headerVisible, showHeader, scheduleHideHeader, toggleFullscreen,
  commentaryLvlIdx, onCommentaryLvlChange,
  bgLvlIdx, onBgLvlChange,
  commentaryVol, bgVol,
  onPrevStep, onNextStep, onPlayPause,
}: AppHeaderProps) {
  return (
    <header
      className={cn(
        'shrink-0 border-b border-white/5 bg-phantasm-bg/80 backdrop-blur-xl z-20 transition-[opacity,transform] duration-300',
        isFullscreen && 'absolute top-0 left-0 right-0 z-30',
        isFullscreen && !headerVisible && 'opacity-0 -translate-y-full pointer-events-none',
      )}
      onMouseEnter={isFullscreen ? showHeader : undefined}
      onMouseLeave={isFullscreen ? scheduleHideHeader : undefined}
    >
      {/* Primary row */}
      <div className="flex items-center justify-between px-3 sm:px-8 h-12 sm:h-14">
        <div className="flex items-center gap-2 sm:gap-3">
          <Shield className="text-phantasm-accent-light shrink-0" size={18} />
          <ChessTitle appPhase={appPhase} currentStep={currentStep} totalSteps={totalSteps} />

          {/* Scene switcher */}
          <div className="flex items-center gap-1 sm:gap-1.5 sm:ml-4 sm:pl-4 sm:border-l sm:border-white/10">
            {THEMES.map((t, i) => (
              <button
                key={t.id}
                onClick={() => onThemeChange(i)}
                title={t.nameCN}
                className={cn(
                  'group flex h-7 sm:h-8 items-center gap-1.5 sm:gap-2 rounded-md border px-1.5 sm:px-2 text-xs transition-all duration-300',
                  i === themeIdx
                    ? 'border-white/15 bg-white/10 text-white'
                    : 'border-transparent bg-transparent text-white/45 hover:bg-white/5 hover:text-white/80',
                )}
              >
                <span
                  className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full shadow-[0_0_12px_currentColor] shrink-0"
                  style={{ backgroundColor: t.dot, color: t.dot }}
                />
                <span className={cn('hidden max-w-24 truncate', i === themeIdx ? 'md:inline' : 'lg:inline')}>
                  {t.nameEN}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3">
          <button
            onClick={onPrevStep}
            disabled={controlsLocked}
            className={cn(
              'p-1.5 sm:p-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg transition-all active:scale-95',
              controlsLocked && 'cursor-not-allowed opacity-45 hover:bg-white/5 active:scale-100',
            )}
          >
            <SkipBack size={15} className="text-slate-300" />
          </button>
          <button
            onClick={onPlayPause}
            disabled={playButtonDisabled}
            className={cn(
              'px-3 sm:px-4 py-1.5 sm:py-2 bg-phantasm-accent hover:bg-phantasm-accent-light rounded-lg transition-all active:scale-95 border border-white/10',
              playButtonDisabled && 'cursor-not-allowed opacity-60 hover:bg-phantasm-accent active:scale-100',
            )}
          >
            {isPlaying ? <Pause size={15} fill="white" /> : <Play size={15} fill="white" />}
          </button>
          <button
            onClick={onNextStep}
            disabled={controlsLocked}
            className={cn(
              'p-1.5 sm:p-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg transition-all active:scale-95',
              controlsLocked && 'cursor-not-allowed opacity-45 hover:bg-white/5 active:scale-100',
            )}
          >
            <SkipForward size={15} className="text-slate-300" />
          </button>

          {/* Fullscreen toggle */}
          <div className="flex items-center pl-1.5 sm:pl-3 border-l border-white/10">
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              className="p-1.5 sm:p-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg transition-all active:scale-95"
            >
              {isFullscreen
                ? <Minimize2 size={15} className="text-slate-300" />
                : <Maximize2 size={15} className="text-slate-300" />}
            </button>
          </div>

          {/* Volume controls — desktop only */}
          <div className="hidden sm:flex items-center gap-1.5 pl-3 border-l border-white/10">
            <button
              onClick={() => onCommentaryLvlChange((commentaryLvlIdx + 1) % COMMENTARY_LEVELS.length)}
              title={`Commentary volume ${Math.round(commentaryVol * 100)}%`}
              className="flex items-center gap-1 px-2 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg transition-all active:scale-95"
            >
              {(() => { const Icon = VOLUME_ICONS[commentaryLvlIdx]; return <Icon size={14} className="text-slate-300" />; })()}
              <span className="text-[10px] text-slate-400 leading-none">COM</span>
            </button>
            <button
              onClick={() => onBgLvlChange((bgLvlIdx + 1) % BG_LEVELS.length)}
              title={`BGM volume ${Math.round(bgVol * 100)}%`}
              className="flex items-center gap-1 px-2 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg transition-all active:scale-95"
            >
              {(() => { const Icon = VOLUME_ICONS[bgLvlIdx]; return <Icon size={14} className="text-slate-300" />; })()}
              <span className="text-[10px] text-slate-400 leading-none">BGM</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile volume strip */}
      <div className="sm:hidden flex items-center justify-end gap-2 px-3 pb-2">
        <button
          onClick={() => onCommentaryLvlChange((commentaryLvlIdx + 1) % COMMENTARY_LEVELS.length)}
          title={`Commentary volume ${Math.round(commentaryVol * 100)}%`}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg transition-all active:scale-95 text-[10px] text-slate-400"
        >
          {(() => { const Icon = VOLUME_ICONS[commentaryLvlIdx]; return <Icon size={12} className="text-slate-300" />; })()}
          Commentary
        </button>
        <button
          onClick={() => onBgLvlChange((bgLvlIdx + 1) % BG_LEVELS.length)}
          title={`BGM volume ${Math.round(bgVol * 100)}%`}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg transition-all active:scale-95 text-[10px] text-slate-400"
        >
          {(() => { const Icon = VOLUME_ICONS[bgLvlIdx]; return <Icon size={12} className="text-slate-300" />; })()}
          BGM
        </button>
      </div>
    </header>
  );
}
