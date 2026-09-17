import React from 'react';
import { ThemeMode } from '../types';

interface VirtualGamepadProps {
  onUp: () => void;
  onDown: () => void;
  onLeft: () => void;
  onRight: () => void;
  onA: () => void;
  onB: () => void;
  onX: () => void;
  onY: () => void;
  onL1: () => void;
  onR1: () => void;
  onSelect: () => void;
  onStart: () => void;
  theme: ThemeMode;
}

export const VirtualGamepad: React.FC<VirtualGamepadProps> = ({
  onUp,
  onDown,
  onLeft,
  onRight,
  onA,
  onB,
  onX,
  onY,
  onL1,
  onR1,
  onSelect,
  onStart,
}) => {
  return (
    <div
      id="virtual-gamepad"
      className="w-full max-w-[640px] bg-[#10141b] border-t-2 border-[#2b3544] p-2 flex justify-between items-center text-white select-none z-40"
    >
      {/* L1 Bumper + D-Pad */}
      <div className="flex flex-col items-center gap-1.5">
        <button
          onClick={onL1}
          className="w-20 h-6 bg-[#212836] hover:bg-[#2e3748] active:bg-[#161c27] border border-[#3f4d63] rounded-t-lg text-[9px] font-mono font-bold tracking-wider text-cyan-300"
        >
          L1 SHOULDER
        </button>

        {/* D-Pad Cross */}
        <div className="relative w-24 h-24 bg-[#181f2b] rounded-full p-1 border border-[#2b3544] flex items-center justify-center shadow-inner">
          {/* Up */}
          <button
            onClick={onUp}
            className="absolute top-1.5 w-7 h-8 bg-[#252e3d] hover:bg-[#344055] active:bg-[#1a212c] rounded-t border-t border-x border-[#46566e] flex items-center justify-center text-[10px]"
          >
            ▲
          </button>
          {/* Down */}
          <button
            onClick={onDown}
            className="absolute bottom-1.5 w-7 h-8 bg-[#252e3d] hover:bg-[#344055] active:bg-[#1a212c] rounded-b border-b border-x border-[#46566e] flex items-center justify-center text-[10px]"
          >
            ▼
          </button>
          {/* Left */}
          <button
            onClick={onLeft}
            className="absolute left-1.5 w-8 h-7 bg-[#252e3d] hover:bg-[#344055] active:bg-[#1a212c] rounded-l border-l border-y border-[#46566e] flex items-center justify-center text-[10px]"
          >
            ◀
          </button>
          {/* Right */}
          <button
            onClick={onRight}
            className="absolute right-1.5 w-8 h-7 bg-[#252e3d] hover:bg-[#344055] active:bg-[#1a212c] rounded-r border-r border-y border-[#46566e] flex items-center justify-center text-[10px]"
          >
            ▶
          </button>
          {/* Center Hub */}
          <div className="w-5 h-5 bg-[#1b222d] rounded-full border border-[#384558]"></div>
        </div>
      </div>

      {/* Center Console: SELECT & START */}
      <div className="flex flex-col items-center justify-center gap-2">
        <div className="text-[8px] font-mono text-gray-400 tracking-widest font-bold">
          R36S // dArkOS
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center gap-0.5">
            <button
              onClick={onSelect}
              className="w-10 h-3.5 bg-[#252e3d] active:bg-[#1a212c] rounded-full border border-[#46566e] shadow-xs"
            ></button>
            <span className="text-[7.5px] font-mono text-gray-400 font-bold">SELECT</span>
          </div>

          <div className="flex flex-col items-center gap-0.5">
            <button
              onClick={onStart}
              className="w-10 h-3.5 bg-[#252e3d] active:bg-[#1a212c] rounded-full border border-[#46566e] shadow-xs"
            ></button>
            <span className="text-[7.5px] font-mono text-cyan-400 font-bold">START</span>
          </div>
        </div>
      </div>

      {/* R1 Bumper + ABXY Face Diamond */}
      <div className="flex flex-col items-center gap-1.5">
        <button
          onClick={onR1}
          className="w-20 h-6 bg-[#212836] hover:bg-[#2e3748] active:bg-[#161c27] border border-[#3f4d63] rounded-t-lg text-[9px] font-mono font-bold tracking-wider text-cyan-300"
        >
          R1 SHOULDER
        </button>

        {/* ABXY Diamond */}
        <div className="relative w-24 h-24 bg-[#181f2b] rounded-full p-1 border border-[#2b3544] flex items-center justify-center shadow-inner">
          {/* X Button (Top) */}
          <button
            onClick={onX}
            className="absolute top-1.5 w-7 h-7 bg-[#00283d] hover:bg-[#003d5c] active:scale-95 rounded-full border border-cyan-400 text-cyan-300 text-[10px] font-bold flex items-center justify-center shadow-sm"
          >
            X
          </button>
          {/* B Button (Bottom) */}
          <button
            onClick={onB}
            className="absolute bottom-1.5 w-7 h-7 bg-[#3d0f14] hover:bg-[#57141c] active:scale-95 rounded-full border border-red-500 text-red-300 text-[10px] font-bold flex items-center justify-center shadow-sm"
          >
            B
          </button>
          {/* Y Button (Left) */}
          <button
            onClick={onY}
            className="absolute left-1.5 w-7 h-7 bg-[#3d3200] hover:bg-[#574700] active:scale-95 rounded-full border border-amber-400 text-amber-300 text-[10px] font-bold flex items-center justify-center shadow-sm"
          >
            Y
          </button>
          {/* A Button (Right) */}
          <button
            onClick={onA}
            className="absolute right-1.5 w-7 h-7 bg-cyan-400 hover:bg-cyan-300 active:scale-95 rounded-full border border-cyan-300 text-black text-[10px] font-black flex items-center justify-center shadow-sm"
          >
            A
          </button>
        </div>
      </div>
    </div>
  );
};
