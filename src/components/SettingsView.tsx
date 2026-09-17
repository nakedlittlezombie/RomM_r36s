import React, { useState } from 'react';
import { ServerConfig, ThemeMode } from '../types';
import { getThemeStyles } from '../themeStyles';

interface SettingsViewProps {
  config: ServerConfig;
  onUpdateConfig: (config: ServerConfig) => void;
  onTestPing: () => void;
  onOpenSmb: () => void;
  onBack: () => void;
  theme: ThemeMode;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  config,
  onUpdateConfig,
  onTestPing,
  onOpenSmb,
  onBack,
  theme,
}) => {
  const t = getThemeStyles(theme);
  const [activeTab, setActiveTab] = useState<'api' | 'smb' | 'theme'>('api');
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [serverUrlInput, setServerUrlInput] = useState(config.serverUrl);
  const [userInput, setUserInput] = useState(config.username);
  const [logs, setLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] GET /api/heartbeat -> 200 OK`,
    `[${new Date().toLocaleTimeString()}] Token validated. User: ${config.username}`,
    `[${new Date().toLocaleTimeString()}] SMB share mounted at /mnt/romm_smb`,
    `[${new Date().toLocaleTimeString()}] Save Sync Daemon: Ready (TF2 Slot)`,
  ]);

  const handlePing = () => {
    onTestPing();
    const newLog = `[${new Date().toLocaleTimeString()}] PING test ${config.serverUrl} -> ${config.pingMs}ms latency`;
    setLogs((prev) => [newLog, ...prev.slice(0, 5)]);
  };

  const handleSaveUrl = () => {
    onUpdateConfig({ ...config, serverUrl: serverUrlInput });
    setIsEditingUrl(false);
  };

  const handleSaveUser = () => {
    onUpdateConfig({ ...config, username: userInput });
    setIsEditingUser(false);
  };

  return (
    <div id="settings-view" className="w-full flex-1 flex flex-col overflow-hidden select-none">
      {/* 1. Header with L1/R1 Settings Tabs */}
      <div
        className={`h-8 px-2 flex items-center justify-between border-b ${t.headerBorder} shrink-0 ${
          theme === 'paper' ? 'bg-[#e4e9ef]' : theme === 'amber' ? 'bg-[#191208]' : 'bg-[#171c24]'
        }`}
      >
        <div className="flex items-center gap-1.5">
          <button
            onClick={onBack}
            className="flex items-center gap-1 bg-black/20 hover:bg-black/30 border border-current/30 px-1.5 py-[2px] rounded text-[8px] font-bold"
          >
            <span className="w-3 h-3 rounded-full bg-red-600 text-white flex items-center justify-center text-[7px] font-black">
              B
            </span>
            <span>BACK</span>
          </button>
          <span className="text-[9px] font-mono text-cyan-400 font-bold uppercase hidden sm:inline">
            SYSTEM // SETTINGS
          </span>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-1 text-[8.5px] font-mono">
          <span className={t.textMuted}>[L1]</span>
          <button
            onClick={() => setActiveTab('api')}
            className={`px-1.5 py-0.5 rounded font-bold uppercase transition-all ${
              activeTab === 'api'
                ? `${t.accentBg} ${t.accentText}`
                : `${t.textMuted} hover:${t.textPrimary}`
            }`}
          >
            ROMM API
          </button>
          <button
            onClick={() => setActiveTab('smb')}
            className={`px-1.5 py-0.5 rounded font-bold uppercase transition-all ${
              activeTab === 'smb'
                ? `${t.accentBg} ${t.accentText}`
                : `${t.textMuted} hover:${t.textPrimary}`
            }`}
          >
            SMB / NAS
          </button>
          <button
            onClick={() => setActiveTab('theme')}
            className={`px-1.5 py-0.5 rounded font-bold uppercase transition-all ${
              activeTab === 'theme'
                ? `${t.accentBg} ${t.accentText}`
                : `${t.textMuted} hover:${t.textPrimary}`
            }`}
          >
            THEME / HUD
          </button>
          <span className={t.textMuted}>[R1]</span>
        </div>
      </div>

      {/* 2. Main 2-Column Grid Canvas */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Config Form (~58% width) */}
        <section
          className={`w-[58%] border-r ${t.cardBorder} p-2 flex flex-col gap-2 overflow-y-auto ${
            theme === 'paper' ? 'bg-[#f6faff]' : t.panelBg
          }`}
        >
          {/* SECTION 1: RomM Server Node */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between pb-0.5 border-b border-current/20">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px] text-cyan-400">hub</span>
                <h2 className={`font-mono text-[10px] font-bold uppercase tracking-wider ${t.textPrimary}`}>
                  RomM Server Node
                </h2>
              </div>
              <span className={`text-[8px] font-mono ${t.textMuted}`}>dArkOS v2.04</span>
            </div>

            {/* Field 1: Server URL */}
            <div
              className={`p-1.5 border rounded-xs transition-all ${
                theme === 'amber'
                  ? 'border-[#ffb000] bg-[#211a10] amber-box-glow'
                  : theme === 'paper'
                  ? 'border-[#2b6cb0] bg-white beveled-box'
                  : 'border-cyan-400 bg-[#171c24] neon-focus-glow'
              }`}
            >
              <div className="flex justify-between items-center text-[8px] font-mono mb-1">
                <span className="font-bold text-cyan-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></span>
                  SERVER HOST / URL
                </span>
                <button
                  onClick={() => setIsEditingUrl(!isEditingUrl)}
                  className="text-cyan-300 font-bold hover:underline"
                >
                  [{isEditingUrl ? 'SAVE' : 'PRESS A TO EDIT'}]
                </button>
              </div>

              {isEditingUrl ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={serverUrlInput}
                    onChange={(e) => setServerUrlInput(e.target.value)}
                    className="flex-1 bg-black/60 border border-cyan-400 px-1.5 py-0.5 text-[9px] font-mono text-white rounded outline-none"
                    placeholder="http://192.168.1.100:8080"
                  />
                  <button
                    onClick={handleSaveUrl}
                    className="px-2 py-0.5 bg-cyan-400 text-black text-[8px] font-bold rounded"
                  >
                    OK
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-black/40 px-2 py-1 rounded border border-current/20 text-[9px] font-mono">
                  <span className="text-white truncate">{config.serverUrl}</span>
                  <span className="material-symbols-outlined text-[12px] text-cyan-400">edit</span>
                </div>
              )}
            </div>

            {/* Field 2: Authentication User */}
            <div
              className={`p-1.5 border border-current/25 rounded-xs ${
                theme === 'paper' ? 'bg-white' : 'bg-black/20'
              }`}
            >
              <div className="flex justify-between items-center text-[8px] font-mono mb-1">
                <span className={t.textMuted}>AUTHENTICATION USER</span>
                <span className="text-[7.5px] opacity-75">USER_ID: 01</span>
              </div>
              {isEditingUser ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    className="flex-1 bg-black/60 border border-current px-1.5 py-0.5 text-[9px] font-mono text-white rounded outline-none"
                  />
                  <button
                    onClick={handleSaveUser}
                    className="px-2 py-0.5 bg-cyan-400 text-black text-[8px] font-bold rounded"
                  >
                    OK
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => setIsEditingUser(true)}
                  className="flex items-center justify-between bg-black/30 px-2 py-1 rounded border border-current/20 text-[9px] font-mono cursor-pointer"
                >
                  <span className="text-white font-bold">{config.username}</span>
                  <span className="material-symbols-outlined text-[12px] text-cyan-400">
                    person
                  </span>
                </div>
              )}
            </div>

            {/* Field 3: API Key with Show/Hide */}
            <div
              className={`p-1.5 border border-current/25 rounded-xs ${
                theme === 'paper' ? 'bg-white' : 'bg-black/20'
              }`}
            >
              <div className="flex justify-between items-center text-[8px] font-mono mb-1">
                <span className={t.textMuted}>API KEY / TOKEN</span>
                <button
                  onClick={() =>
                    onUpdateConfig({ ...config, isTokenMasked: !config.isTokenMasked })
                  }
                  className="text-cyan-400 hover:underline flex items-center gap-0.5"
                >
                  <span className="material-symbols-outlined text-[10px]">
                    {config.isTokenMasked ? 'visibility_off' : 'visibility'}
                  </span>
                  <span>{config.isTokenMasked ? '[Y] UNMASK' : '[Y] MASK'}</span>
                </button>
              </div>
              <div className="flex items-center justify-between bg-black/30 px-2 py-1 rounded border border-current/20 text-[9px] font-mono">
                <span className="tracking-widest truncate">
                  {config.isTokenMasked
                    ? '••••••••••••••••••••••••'
                    : config.apiKey}
                </span>
                <span className="text-[7.5px] font-mono text-cyan-400">VALID</span>
              </div>
            </div>

            {/* Field 4: Ping & Auto Sync Buttons */}
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={handlePing}
                className="flex items-center justify-between bg-black/30 hover:bg-black/50 border border-current/30 px-2 py-1 rounded text-[8.5px] font-mono font-bold transition-all active:scale-95"
              >
                <div className="flex items-center gap-1 text-cyan-300">
                  <span className="material-symbols-outlined text-[12px]">network_ping</span>
                  <span>[X] PING ROMM</span>
                </div>
                <span className="bg-black/50 px-1 py-[1px] rounded text-[8px] text-cyan-400 border border-current/20">
                  {config.pingMs}ms
                </span>
              </button>

              <button
                onClick={() =>
                  onUpdateConfig({ ...config, autoSyncSaves: !config.autoSyncSaves })
                }
                className="flex items-center justify-between bg-black/30 hover:bg-black/50 border border-current/30 px-2 py-1 rounded text-[8.5px] font-mono font-bold transition-all"
              >
                <span className="text-white text-[8px]">AUTO-SYNC SAVES</span>
                <div className="flex items-center gap-1 bg-black/50 px-1.5 py-[1px] rounded border border-cyan-400 text-cyan-400 text-[8px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                  <span>{config.autoSyncSaves ? 'ON' : 'OFF'}</span>
                </div>
              </button>
            </div>
          </div>

          {/* SECTION 2: SMB & Storage Share */}
          <div className="flex flex-col gap-1 pt-1 border-t border-current/20">
            <div className="flex items-center justify-between pb-0.5">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px] text-amber-400">
                  folder_shared
                </span>
                <h2 className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-300">
                  SMB &amp; Storage Share
                </h2>
              </div>
              <button
                onClick={onOpenSmb}
                className="text-[8px] font-mono text-cyan-300 border border-cyan-400/40 px-1.5 py-[1px] rounded hover:bg-cyan-900/30"
              >
                BROWSE FILES
              </button>
            </div>

            {/* Active Storage Mount Selection */}
            <div className="p-1.5 rounded bg-black/30 border border-current/20 flex flex-col gap-1 text-[8.5px] font-mono">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-400">ACTIVE INTERNAL STORAGE MOUNT</span>
                <span className="text-[7.5px] text-gray-400">R36S Dual-SD Mounts</span>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() =>
                    onUpdateConfig({
                      ...config,
                      storageMount: '/roms',
                      tf2SyncPath: '/roms/tf2/romm_sync/',
                    })
                  }
                  className={`p-1.5 rounded flex items-center justify-between border transition-all ${
                    config.storageMount === '/roms'
                      ? 'border-cyan-400 bg-cyan-950/60 text-cyan-300 font-bold shadow-xs'
                      : 'border-white/20 bg-black/40 text-gray-400 hover:border-white/40'
                  }`}
                >
                  <div className="flex flex-col text-left">
                    <span className="text-[9px] font-bold">/roms</span>
                    <span className="text-[7px] opacity-75">TF1 Primary (OS Card)</span>
                  </div>
                  {config.storageMount === '/roms' && (
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                  )}
                </button>

                <button
                  onClick={() =>
                    onUpdateConfig({
                      ...config,
                      storageMount: '/roms2',
                      tf2SyncPath: '/roms2/tf2/romm_sync/',
                    })
                  }
                  className={`p-1.5 rounded flex items-center justify-between border transition-all ${
                    config.storageMount === '/roms2'
                      ? 'border-cyan-400 bg-cyan-950/60 text-cyan-300 font-bold shadow-xs'
                      : 'border-white/20 bg-black/40 text-gray-400 hover:border-white/40'
                  }`}
                >
                  <div className="flex flex-col text-left">
                    <span className="text-[9px] font-bold">/roms2</span>
                    <span className="text-[7px] opacity-75">TF2 Secondary (Games Card)</span>
                  </div>
                  {config.storageMount === '/roms2' && (
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1 text-[8px] font-mono">
              <div className="p-1 rounded bg-black/30 border border-current/20 flex flex-col">
                <span className={t.textMuted}>SMB SHARE ADDRESS</span>
                <span className="font-bold truncate text-white">{config.smbShareUrl}</span>
              </div>
              <div className="p-1 rounded bg-black/30 border border-current/20 flex flex-col">
                <span className={t.textMuted}>ACTIVE ROM DIRECTORY</span>
                <span className="font-bold truncate text-cyan-300">
                  {config.storageMount}/[platform]/
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 3: UI Appearance & HUD */}
          <div className="flex flex-col gap-1 pt-1 border-t border-current/20">
            <div className="flex items-center justify-between pb-0.5">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px] text-purple-400">
                  palette
                </span>
                <h2 className="font-mono text-[10px] font-bold uppercase tracking-wider text-purple-300">
                  UI Appearance &amp; HUD
                </h2>
              </div>
              <span className={`text-[8px] font-mono ${t.textMuted}`}>60 FPS IPS</span>
            </div>

            <div className="grid grid-cols-3 gap-1">
              {/* Cyan */}
              <button
                onClick={() => onUpdateConfig({ ...config, theme: 'cyan' })}
                className={`p-1.5 rounded-xs flex flex-col items-center justify-center border transition-all ${
                  theme === 'cyan'
                    ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300 neon-focus-glow font-bold'
                    : 'border-current/20 bg-black/25 opacity-70 hover:opacity-100'
                }`}
              >
                <span className="text-[9px] font-mono">CYAN GLOW</span>
                <span className="text-[7.5px] opacity-75">NEON [DEFAULT]</span>
              </button>

              {/* Amber */}
              <button
                onClick={() => onUpdateConfig({ ...config, theme: 'amber' })}
                className={`p-1.5 rounded-xs flex flex-col items-center justify-center border transition-all ${
                  theme === 'amber'
                    ? 'border-[#ffb000] bg-[#211a10] text-[#ffd597] amber-box-glow font-bold'
                    : 'border-current/20 bg-black/25 opacity-70 hover:opacity-100'
                }`}
              >
                <span className="text-[9px] font-mono">AMBER CRT</span>
                <span className="text-[7.5px] opacity-75">RETRO WARM</span>
              </button>

              {/* Paper */}
              <button
                onClick={() => onUpdateConfig({ ...config, theme: 'paper' })}
                className={`p-1.5 rounded-xs flex flex-col items-center justify-center border transition-all ${
                  theme === 'paper'
                    ? 'border-[#2b6cb0] bg-white text-[#171c21] beveled-box font-bold'
                    : 'border-current/20 bg-black/25 opacity-70 hover:opacity-100'
                }`}
              >
                <span className="text-[9px] font-mono">PAPER GREY</span>
                <span className="text-[7.5px] opacity-75">CLASSIC OS</span>
              </button>
            </div>
          </div>
        </section>

        {/* Right Side: Server Metrics & Console (~42% width) */}
        <aside
          className={`w-[42%] p-2 flex flex-col justify-between overflow-hidden ${
            theme === 'paper' ? 'bg-[#eff4fa]' : 'bg-[#090e16]'
          }`}
        >
          <div className="flex flex-col gap-1.5 overflow-hidden">
            {/* Live Server Stats Bento */}
            <div
              className={`p-2 border rounded-xs flex flex-col gap-1 ${
                theme === 'paper' ? 'bg-white beveled-box' : t.cardBg
              }`}
            >
              <div className="flex items-center justify-between pb-1 border-b border-current/20">
                <span className="text-[8.5px] font-bold font-mono uppercase text-cyan-300">
                  ROMM SERVER METRICS
                </span>
                <span className="text-[7.5px] font-mono px-1 py-[1px] bg-green-950/70 text-green-300 rounded border border-green-500/40">
                  HTTP 200 OK
                </span>
              </div>

              <div className="space-y-1 text-[8.5px] font-mono">
                <div className="flex justify-between">
                  <span className={t.textMuted}>SERVER NAME:</span>
                  <span className="font-bold text-white">RomM-Main-Vault</span>
                </div>
                <div className="flex justify-between">
                  <span className={t.textMuted}>INDEXED PLATFORMS:</span>
                  <span className="font-bold text-cyan-400">14 SYSTEMS</span>
                </div>
                <div className="flex justify-between">
                  <span className={t.textMuted}>REMOTE ROMS:</span>
                  <span className="font-bold text-white">3,428 TITLES</span>
                </div>
                <div className="flex justify-between">
                  <span className={t.textMuted}>CLOUD SAVE STATES:</span>
                  <span className="font-bold text-amber-400">214 SYNCED</span>
                </div>
              </div>

              {/* Storage Capacity Gauge */}
              <div className="mt-1 pt-1 border-t border-current/15">
                <div className="flex justify-between text-[7.5px] font-mono mb-0.5">
                  <span className={t.textMuted}>REMOTE STORAGE (1.8TB)</span>
                  <span className="font-bold text-cyan-300">64% FULL</span>
                </div>
                <div className="w-full h-1.5 bg-black/50 border border-current/20 rounded-xs overflow-hidden flex">
                  <div className="w-[64%] h-full bg-cyan-400"></div>
                </div>
              </div>
            </div>

            {/* Daemon Console Output */}
            <div
              className={`p-2 border rounded-xs flex flex-col gap-1 font-mono text-[8px] ${
                theme === 'paper' ? 'bg-[#dee3e9] border-[#b0b9c3]' : 'bg-black/60 border-current/20'
              }`}
            >
              <div className="flex items-center gap-1 text-cyan-400 font-bold uppercase tracking-wider pb-0.5 border-b border-current/20">
                <span className="material-symbols-outlined text-[10px]">terminal</span>
                <span>DAEMON CONSOLE OUTPUT</span>
              </div>
              <div className="space-y-0.5 text-cyan-100/90 leading-tight overflow-hidden">
                {logs.map((log, i) => (
                  <p key={i} className="truncate">
                    {log}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="border border-current/20 p-1.5 rounded-xs text-[8px] font-mono bg-black/20 mt-1">
            <div className="text-cyan-400 font-bold mb-1">R36S / dArkOS SHORTCUTS</div>
            <div className="grid grid-cols-2 gap-1 opacity-80">
              <span>L1/R1: Tabs</span>
              <span>D-Pad: Select</span>
              <span>[X]: Ping Test</span>
              <span>[START]: Save</span>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
};
