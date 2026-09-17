import React from 'react';
import { ThemeMode, StorageMount } from '../types';
import { getThemeStyles } from '../themeStyles';

interface ExitModalProps {
  isOpen: boolean;
  storageMount: StorageMount;
  onConfirmExit: () => void;
  onCancel: () => void;
  theme: ThemeMode;
}

export const ExitModal: React.FC<ExitModalProps> = ({
  isOpen,
  storageMount,
  onConfirmExit,
  onCancel,
  theme,
}) => {
  const t = getThemeStyles(theme);

  if (!isOpen) return null;

  return (
    <div
      id="exit-confirm-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 select-none backdrop-blur-xs"
    >
      <div
        className={`w-full max-w-[380px] border-2 rounded-xs flex flex-col justify-between overflow-hidden shadow-2xl p-3 ${
          theme === 'amber'
            ? 'border-[#ffb000] bg-[#1a1208] text-[#ffd597] amber-box-glow'
            : theme === 'paper'
            ? 'border-[#2b6cb0] bg-[#f6faff] text-[#171c21] beveled-box'
            : 'border-red-500 bg-[#0c1017] text-[#c3f5ff] neon-focus-glow'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-current/20">
          <div className="flex items-center gap-1.5 text-red-400 font-mono font-bold text-[11px] uppercase">
            <span className="material-symbols-outlined text-[15px]">power_settings_new</span>
            <span>EXIT APPLICATION</span>
          </div>
          <span className="text-[8px] font-mono opacity-70">R36S // dArkOS</span>
        </div>

        {/* Body Text */}
        <div className="py-3 font-mono text-[9.5px] space-y-2">
          <p className="font-semibold text-white">
            Quit RomM &amp; SMB Client and return to the main EmulationStation frontend?
          </p>
          <div className="p-2 rounded bg-black/30 border border-current/15 text-[8.5px] space-y-1">
            <div className="flex justify-between">
              <span className={t.textMuted}>Target Mount:</span>
              <span className="font-bold text-cyan-300">
                {storageMount} ({storageMount === '/roms2' ? 'TF2 Secondary SD' : 'TF1 Internal'})
              </span>
            </div>
            <div className="flex justify-between">
              <span className={t.textMuted}>Saves Synced:</span>
              <span className="text-green-400 font-bold">All Save States Flushed OK</span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-current/20 font-mono text-[9px]">
          <button
            onClick={onCancel}
            className="px-2.5 py-1 rounded bg-black/40 border border-current/30 font-bold hover:border-current flex items-center gap-1"
          >
            <span className="w-3.5 h-3.5 rounded-full bg-slate-700 text-white flex items-center justify-center text-[7px] font-bold">
              B
            </span>
            <span>CANCEL</span>
          </button>

          <button
            onClick={onConfirmExit}
            className="px-3 py-1 rounded bg-red-600 hover:bg-red-500 text-white font-bold tracking-wider flex items-center gap-1 shadow-md active:scale-95 transition-all"
          >
            <span className="w-3.5 h-3.5 rounded-full bg-black/40 text-white flex items-center justify-center text-[7px] font-bold">
              A
            </span>
            <span>QUIT TO OS</span>
          </button>
        </div>
      </div>
    </div>
  );
};
