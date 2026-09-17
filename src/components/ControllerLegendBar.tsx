import React from 'react';
import { ThemeMode } from '../types';
import { getThemeStyles } from '../themeStyles';

interface ControllerLegendBarProps {
  onActionA: () => void;
  onActionB: () => void;
  onActionX: () => void;
  onActionY: () => void;
  onSelect: () => void;
  onStart: () => void;
  onExit?: () => void;
  labelA?: string;
  labelB?: string;
  labelX?: string;
  labelY?: string;
  theme: ThemeMode;
}

export const ControllerLegendBar: React.FC<ControllerLegendBarProps> = ({
  onActionA,
  onActionB,
  onActionX,
  onActionY,
  onSelect,
  onStart,
  onExit,
  labelA = 'Select/Action',
  labelB = 'Back',
  labelX = 'Sync Saves',
  labelY = 'Favorite',
  theme,
}) => {
  const t = getThemeStyles(theme);

  return (
    <footer
      id="controller-legend-bar"
      className={`h-7 w-full border-t ${t.footerBorder} ${t.footerBg} px-2 flex items-center justify-between text-[9px] font-mono select-none z-30 shrink-0 transition-colors`}
    >
      {/* Left Face Buttons (A, B, X, Y) */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* A Button */}
        <button
          onClick={onActionA}
          className="flex items-center gap-1 active:scale-95 transition-transform"
          title="Press [A] or Enter"
        >
          <span
            className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7.5px] font-bold ${
              theme === 'amber'
                ? 'border border-[#ffb000] bg-[#ffb000] text-[#281800]'
                : theme === 'paper'
                ? 'bg-[#2b6cb0] text-white'
                : 'bg-cyan-400 text-black font-extrabold neon-focus-glow'
            }`}
          >
            A
          </span>
          <span className="font-semibold">{labelA}</span>
        </button>

        {/* B Button */}
        <button
          onClick={onActionB}
          className="flex items-center gap-1 active:scale-95 transition-transform"
          title="Press [B] or Esc"
        >
          <span className="w-3.5 h-3.5 rounded-full bg-red-950/70 border border-red-500 text-red-300 flex items-center justify-center text-[7.5px] font-bold">
            B
          </span>
          <span className={t.textMuted}>{labelB}</span>
        </button>

        {/* X Button */}
        <button
          onClick={onActionX}
          className="flex items-center gap-1 active:scale-95 transition-transform"
          title="Press [X]"
        >
          <span className="w-3.5 h-3.5 rounded-full bg-cyan-950/70 border border-cyan-400 text-cyan-300 flex items-center justify-center text-[7.5px] font-bold">
            X
          </span>
          <span className={t.textMuted}>{labelX}</span>
        </button>

        {/* Y Button */}
        <button
          onClick={onActionY}
          className="flex items-center gap-1 active:scale-95 transition-transform"
          title="Press [Y]"
        >
          <span className="w-3.5 h-3.5 rounded-full bg-amber-950/70 border border-amber-400 text-amber-300 flex items-center justify-center text-[7.5px] font-bold">
            Y
          </span>
          <span className={t.textMuted}>{labelY}</span>
        </button>
      </div>

      {/* Right Control Buttons (SELECT, START) */}
      <div className="flex items-center gap-2">
        <button
          onClick={onSelect}
          className="flex items-center gap-1 hover:text-white transition-colors"
          title="Press [SELECT] or [F]"
        >
          <span className="px-1 py-[1px] bg-black/40 border border-current/30 rounded text-[7.5px] font-bold">
            SELECT
          </span>
          <span className={`text-[8px] ${t.textMuted} hidden sm:inline`}>Filter</span>
        </button>

        <button
          onClick={onStart}
          className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors"
          title="Press [START] or [S]"
        >
          <span className="px-1 py-[1px] bg-cyan-950 border border-cyan-400 text-cyan-300 rounded text-[7.5px] font-bold">
            START
          </span>
          <span className="text-[8px] font-bold uppercase hidden sm:inline">Settings</span>
        </button>

        {onExit && (
          <button
            onClick={onExit}
            className="flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors ml-0.5 pl-1.5 border-l border-current/20 active:scale-95"
            title="Exit RomM Client [Q / SELECT+START]"
          >
            <span className="px-1 py-[1px] bg-red-950/80 border border-red-500/70 text-red-300 rounded text-[7.5px] font-bold">
              EXIT
            </span>
            <span className="text-[8px] font-bold uppercase text-red-300 hidden sm:inline">Quit</span>
          </button>
        )}
      </div>
    </footer>
  );
};
