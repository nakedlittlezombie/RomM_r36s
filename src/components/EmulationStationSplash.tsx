import React from 'react';
import { StorageMount, ThemeMode } from '../types';

interface EmulationStationSplashProps {
  storageMount: StorageMount;
  onRelaunch: () => void;
  theme: ThemeMode;
}

export const EmulationStationSplash: React.FC<EmulationStationSplashProps> = ({
  storageMount,
  onRelaunch,
  theme,
}) => {
  return (
    <div
      id="emulationstation-splash"
      className="w-full h-full bg-[#070a0e] text-[#c3f5ff] flex flex-col justify-between p-4 font-mono select-none"
    >
      {/* Top EmulationStation Bar */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2 text-[10px]">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-cyan-400">
            sports_esports
          </span>
          <span className="font-bold tracking-widest uppercase text-cyan-300">
            EMULATIONSTATION // dArkOS
          </span>
        </div>
        <div className="flex items-center gap-2 text-[8.5px] opacity-70">
          <span>R36S HANDHELD</span>
          <span>•</span>
          <span>Active Mount: {storageMount}</span>
        </div>
      </div>

      {/* Main Center Stage */}
      <div className="flex-1 flex flex-col items-center justify-center text-center my-4 space-y-3">
        <div className="w-16 h-16 rounded-full border-2 border-cyan-400/40 bg-cyan-950/20 flex items-center justify-center text-cyan-300 shadow-lg shadow-cyan-500/10 animate-pulse">
          <span className="material-symbols-outlined text-[32px]">check_circle</span>
        </div>

        <div className="space-y-1 max-w-[340px]">
          <h1 className="text-[14px] font-bold tracking-wide text-white">
            ROMM CLIENT TERMINATED
          </h1>
          <p className="text-[9px] text-gray-400 leading-relaxed">
            All ROM downloads and save states are safely flushed to{' '}
            <strong className="text-cyan-300">{storageMount}</strong>. Ready to play games via
            dArkOS built-in RetroArch emulators.
          </p>
        </div>

        <div className="p-2.5 rounded bg-black/40 border border-cyan-500/20 text-[8.5px] text-left max-w-[280px] w-full space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-400">Mount Point:</span>
            <span className="font-bold text-cyan-300">{storageMount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Target Card:</span>
            <span className="font-bold text-white">
              {storageMount === '/roms2' ? 'TF2 Secondary SD Card' : 'TF1 Internal SD Card'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Console Status:</span>
            <span className="font-bold text-green-400">STANDBY / ES IDLE</span>
          </div>
        </div>

        {/* Action Button to Re-launch */}
        <button
          onClick={onRelaunch}
          className="mt-2 px-4 py-2 rounded bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold text-[10px] tracking-wider uppercase flex items-center gap-1.5 shadow-lg shadow-cyan-400/20 active:scale-95 transition-all cursor-pointer"
        >
          <span className="w-4 h-4 rounded-full bg-black text-cyan-400 flex items-center justify-center text-[8px] font-black">
            A
          </span>
          <span>LAUNCH ROMM &amp; SMB CLIENT</span>
        </button>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-[8px] border-t border-cyan-500/20 pt-2 opacity-60">
        <span>PRESS [A] OR CLICK TO RETURN TO CLIENT</span>
        <span>ARKOS V2.04 • 640x480</span>
      </div>
    </div>
  );
};
