import React, { useState, useEffect } from 'react';
import { ServerConfig, ActiveScreen, StorageMount } from '../types';
import { getThemeStyles } from '../themeStyles';

interface TopStatusBarProps {
  config: ServerConfig;
  activeScreen: ActiveScreen;
  onNavigate: (screen: ActiveScreen) => void;
  showChassis: boolean;
  onToggleChassis: () => void;
  showGamepad: boolean;
  onToggleGamepad: () => void;
  onExit: () => void;
  onToggleStorageMount: () => void;
}

export const TopStatusBar: React.FC<TopStatusBarProps> = ({
  config,
  activeScreen,
  onNavigate,
  showChassis,
  onToggleChassis,
  showGamepad,
  onToggleGamepad,
  onExit,
  onToggleStorageMount,
}) => {
  const [time, setTime] = useState<string>('21:42');
  const t = getThemeStyles(config.theme);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      setTime(`${h}:${m}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const hostDisplay = config.serverUrl.replace(/^https?:\/\//, '').split(':')[0] || 'romm.home.arpa';

  return (
    <header
      id="top-status-bar"
      className={`h-7 w-full border-b ${t.headerBorder} ${t.headerBg} flex items-center justify-between px-2 text-[10px] font-mono shrink-0 select-none z-30 transition-colors`}
    >
      {/* Left: Host Info & Connection Status */}
      <div className="flex items-center gap-1.5 overflow-hidden">
        <span className="material-symbols-outlined text-[13px] text-cyan-400 opacity-90 leading-none">
          dns
        </span>

        {config.theme === 'amber' ? (
          <span className="font-bold text-[#ffd597] tracking-wider uppercase truncate">
            ROMM // MAIN-SYS
          </span>
        ) : config.theme === 'paper' ? (
          <span className="font-bold text-[#171c21] tracking-wider uppercase truncate">
            ROMM.LAN
          </span>
        ) : (
          <div className="flex items-center gap-1 truncate">
            <span className="font-bold text-[#00e5ff] tracking-wider uppercase">romm.lan</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse"></span>
          </div>
        )}

        <span className={`text-[9px] ${t.textMuted} truncate hidden sm:inline`}>
          [{hostDisplay} • {config.pingMs}ms]
        </span>

        {config.theme !== 'amber' && (
          <span className="bg-[#00ff88]/15 text-[#00ff88] border border-[#00ff88]/30 px-1 py-[1px] rounded text-[8px] font-bold">
            {config.pingMs}ms
          </span>
        )}
      </div>

      {/* Center: Navigation Shortcuts */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onNavigate('library')}
          className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all ${
            activeScreen === 'library'
              ? `${t.accentBg} ${t.accentText}`
              : `${t.textMuted} hover:${t.textPrimary}`
          }`}
          title="Library (B)"
        >
          LIBRARY
        </button>
        <button
          onClick={() => onNavigate('sync')}
          className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all flex items-center gap-1 ${
            activeScreen === 'sync'
              ? `${t.accentBg} ${t.accentText}`
              : `${t.textMuted} hover:${t.textPrimary}`
          }`}
          title="Transfer & Sync"
        >
          SYNC/STORAGE
          <span className="w-1.5 h-1.5 rounded-full bg-[#00e5ff] animate-pulse"></span>
        </button>
        <button
          onClick={() => onNavigate('settings')}
          className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all ${
            activeScreen === 'settings'
              ? `${t.accentBg} ${t.accentText}`
              : `${t.textMuted} hover:${t.textPrimary}`
          }`}
          title="Settings (START)"
        >
          CONFIG
        </button>
      </div>

      {/* Right: Storage Meter, Wi-Fi, Battery, Clock, Bezel toggle, Exit */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Interactive Storage Mount Selector Button */}
        <button
          onClick={onToggleStorageMount}
          className="flex items-center gap-1 border border-cyan-400/40 hover:border-cyan-400 px-1 py-[1px] rounded bg-black/30 text-[8.5px] cursor-pointer active:scale-95 transition-all"
          title={`Active Storage Mount: ${config.storageMount} (${
            config.storageMount === '/roms2' ? 'TF2 Secondary SD' : 'TF1 Internal SD'
          }). Click to toggle.`}
        >
          <span className="material-symbols-outlined text-[11px] text-cyan-400">
            {config.storageMount === '/roms2' ? 'sd_card' : 'hard_drive'}
          </span>
          <span className="font-bold text-cyan-300">{config.storageMount}</span>
          <span className="text-[7.5px] font-mono bg-cyan-950 text-cyan-200 px-1 py-[0.5px] rounded">
            {config.storageMount === '/roms2' ? 'TF2' : 'TF1'}
          </span>
        </button>

        {/* Wi-Fi & RSSI */}
        <div className="flex items-center gap-0.5" title="Wi-Fi 5G - Connected">
          <span className="material-symbols-outlined text-[13px] text-cyan-400">wifi</span>
          <span className="text-[9px] hidden md:inline">5G</span>
        </div>

        {/* Battery with charging segment */}
        <div className="flex items-center gap-0.5" title="Battery 82% Charging">
          <span className="material-symbols-outlined text-[13px] text-[#00ff88]">
            battery_charging_full
          </span>
          <span className="text-[9px] font-bold text-[#00ff88]">82%</span>
        </div>

        {/* Clock */}
        <span className={`text-[10px] font-bold ${t.textPrimary} border-l border-current/20 pl-1.5 hidden sm:inline`}>
          {time}
        </span>

        {/* Console / Frame Controls */}
        <div className="flex items-center gap-1 ml-0.5 pl-1 border-l border-current/20">
          <button
            onClick={onToggleChassis}
            title={showChassis ? 'Switch to Fullscreen View' : 'Switch to R36S 4:3 640x480 Chassis'}
            className="px-1 py-[1px] border border-current/30 rounded text-[8px] opacity-75 hover:opacity-100"
          >
            {showChassis ? '4:3' : 'FILL'}
          </button>
          <button
            onClick={onToggleGamepad}
            title={showGamepad ? 'Hide On-Screen Gamepad' : 'Show R36S D-Pad & Buttons'}
            className={`px-1 py-[1px] border rounded text-[8px] ${
              showGamepad
                ? 'border-cyan-400 text-cyan-400 font-bold bg-cyan-950/40'
                : 'border-current/30 opacity-75 hover:opacity-100'
            }`}
          >
            PAD
          </button>

          {/* EXIT APP BUTTON */}
          <button
            onClick={onExit}
            title="Exit RomM Client to EmulationStation"
            className="px-1.5 py-[1px] bg-red-950/80 hover:bg-red-900 active:scale-95 border border-red-500 text-red-200 hover:text-white rounded text-[8px] font-extrabold tracking-wider flex items-center gap-0.5 transition-all cursor-pointer ml-1"
          >
            <span className="material-symbols-outlined text-[10px] text-red-400">power_settings_new</span>
            <span>EXIT</span>
          </button>
        </div>
      </div>
    </header>
  );
};
