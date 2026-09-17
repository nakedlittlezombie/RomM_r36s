import React from 'react';
import { PlatformId, ThemeMode, StorageMount } from '../types';
import { getThemeStyles } from '../themeStyles';

interface PlatformBarProps {
  currentPlatform: PlatformId;
  onSelectPlatform: (platform: PlatformId) => void;
  onPrevPlatform: () => void;
  onNextPlatform: () => void;
  filterMode: 'all' | 'installed' | 'cloud' | 'favorites';
  onToggleFilter: () => void;
  gameCounts: Record<PlatformId, { total: number; local: number; cloud: number }>;
  theme: ThemeMode;
  onOpenSmb: () => void;
  storageMount: StorageMount;
  onToggleStorageMount: () => void;
}

const PLATFORMS: { id: PlatformId; name: string; icon: string }[] = [
  { id: 'snes', name: 'SNES', icon: 'sports_esports' },
  { id: 'gba', name: 'GBA', icon: 'videogame_asset' },
  { id: 'ps1', name: 'PS1', icon: 'album' },
  { id: 'n64', name: 'N64', icon: 'sports_esports' },
  { id: 'genesis', name: 'GENESIS', icon: 'gamepad' },
  { id: 'arcade', name: 'ARCADE', icon: 'stadia_controller' },
];

export const PlatformBar: React.FC<PlatformBarProps> = ({
  currentPlatform,
  onSelectPlatform,
  onPrevPlatform,
  onNextPlatform,
  filterMode,
  onToggleFilter,
  gameCounts,
  theme,
  onOpenSmb,
  storageMount,
  onToggleStorageMount,
}) => {
  const t = getThemeStyles(theme);

  const getSystemFullName = (id: PlatformId) => {
    switch (id) {
      case 'snes':
        return 'Super Nintendo Entertainment System';
      case 'gba':
        return 'Game Boy Advance';
      case 'ps1':
        return 'Sony PlayStation (PSX)';
      case 'n64':
        return 'Nintendo 64';
      case 'genesis':
        return 'Sega Genesis / Mega Drive';
      case 'arcade':
        return 'Arcade / CPS & NeoGeo';
    }
  };

  const counts = gameCounts[currentPlatform] || { total: 0, local: 0, cloud: 0 };

  return (
    <div id="platform-bar" className="w-full shrink-0 select-none">
      {/* 1. L1/R1 Platform Selector Row */}
      <section
        className={`h-8 px-2 flex items-center justify-between border-b ${t.headerBorder} ${
          theme === 'paper' ? 'bg-[#e4e9ef]' : theme === 'amber' ? 'bg-[#191208]' : 'bg-[#171c24]'
        }`}
      >
        {/* L1 Bumper Prompt */}
        <button
          onClick={onPrevPlatform}
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border border-current/30 active:scale-95 transition-transform ${t.textMuted} hover:${t.textPrimary}`}
          title="Previous System [L1 / Left]"
        >
          <span>[L1]</span>
          <span className="text-[8px] opacity-75 hidden sm:inline">CORE</span>
        </button>

        {/* Platform Fast-Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {PLATFORMS.map((plat) => {
            const isActive = plat.id === currentPlatform;
            const count = gameCounts[plat.id]?.total || 0;

            if (theme === 'amber') {
              return (
                <button
                  key={plat.id}
                  onClick={() => onSelectPlatform(plat.id)}
                  className={`flex items-center gap-1 px-2 py-0.5 border text-[9px] font-bold uppercase transition-all ${
                    isActive
                      ? 'border-[#ffb000] bg-[#ffb000] text-[#281800] amber-box-glow'
                      : 'border-[#524533] text-[#9f8e78] bg-[#1a1208] hover:border-[#ffb000]/60'
                  }`}
                >
                  <span>{plat.name}</span>
                  <span
                    className={`text-[8px] px-1 py-[0.5px] font-normal ${
                      isActive ? 'bg-[#130d05] text-[#ffd597] font-bold' : 'text-[#805800]'
                    }`}
                  >
                    ({count})
                  </span>
                </button>
              );
            }

            if (theme === 'paper') {
              return (
                <button
                  key={plat.id}
                  onClick={() => onSelectPlatform(plat.id)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase transition-all ${
                    isActive
                      ? 'bg-[#2b3136] text-white border border-[#2b3136] beveled-box shadow-xs'
                      : 'bg-white text-[#545f72] border border-[#c1c7d2] hover:border-[#727782]'
                  }`}
                >
                  <span>{plat.name}</span>
                  <span
                    className={`text-[8px] px-1 rounded-xs ${
                      isActive ? 'bg-[#2b6cb0] text-white font-bold' : 'text-[#727782]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            }

            // Cyan Glow (Default)
            return (
              <button
                key={plat.id}
                onClick={() => onSelectPlatform(plat.id)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all ${
                  isActive
                    ? 'bg-[#252a33] text-white border-b-2 border-[#00e5ff] neon-focus-glow'
                    : 'text-[#849396] hover:bg-[#1b2028] hover:text-[#dee2ee]'
                }`}
              >
                <span className="material-symbols-outlined text-[12px] opacity-80">{plat.icon}</span>
                <span>{plat.name}</span>
                <span
                  className={`text-[8px] px-1 py-[0.5px] rounded-full font-bold ${
                    isActive ? 'bg-[#00e5ff] text-[#00363d]' : 'text-[#849396] bg-black/30'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* R1 Bumper Prompt */}
        <button
          onClick={onNextPlatform}
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border border-current/30 active:scale-95 transition-transform ${t.textMuted} hover:${t.textPrimary}`}
          title="Next System [R1 / Right]"
        >
          <span>[R1]</span>
        </button>
      </section>

      {/* 2. Platform Telemetry & Filter Bar Subheader */}
      <section
        className={`h-6 px-2 flex items-center justify-between border-b ${t.headerBorder} text-[9px] font-mono ${
          theme === 'paper' ? 'bg-[#dee3e9]' : theme === 'amber' ? 'bg-[#130d05]' : 'bg-[#090e16]/90'
        }`}
      >
        {/* Title and local vs cloud count */}
        <div className="flex items-center gap-1.5 truncate">
          <span className={`font-bold ${t.textPrimary} truncate`}>
            {getSystemFullName(currentPlatform)}
          </span>
          <span className={t.textMuted}>/</span>
          <span className={`${t.textSecondary} font-bold`}>{counts.total} Titles</span>
          <span className={`${t.textMuted} text-[8px] hidden md:inline`}>
            ({counts.local} Local · {counts.cloud} RomM Cloud)
          </span>
        </div>

        {/* Storage Mount, Filter Toggle & SMB Shortcut */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onToggleStorageMount}
            className="flex items-center gap-1 px-1.5 py-[1px] border border-cyan-400/40 hover:border-cyan-400 rounded text-[8px] font-bold text-cyan-300 hover:bg-cyan-900/30 transition-colors"
            title={`Active Target Mount: ${storageMount}. Click to toggle /roms vs /roms2`}
          >
            <span className="material-symbols-outlined text-[10px]">sd_card</span>
            <span>{storageMount}</span>
            <span className="text-[7px] font-mono px-0.5 rounded bg-black/40 text-cyan-200">
              {storageMount === '/roms2' ? 'TF2' : 'TF1'}
            </span>
          </button>

          <button
            onClick={onOpenSmb}
            className="flex items-center gap-1 px-1.5 py-[1px] border border-current/25 rounded text-[8px] hover:border-current transition-colors"
            title="Browse SMB Share directly"
          >
            <span className="material-symbols-outlined text-[10px]">folder_shared</span>
            <span className="hidden sm:inline">SMB SHARE</span>
          </button>

          <button
            onClick={onToggleFilter}
            className={`flex items-center gap-1 px-1.5 py-[1px] rounded border border-current/30 text-[8px] font-bold ${
              filterMode !== 'all' ? `${t.accentBg} ${t.accentText}` : 'hover:bg-white/10'
            }`}
            title="Press [SELECT] to cycle filter"
          >
            <span className="opacity-75">FILTER:</span>
            <span className="uppercase tracking-wider">[{filterMode}]</span>
          </button>
        </div>
      </section>
    </div>
  );
};
