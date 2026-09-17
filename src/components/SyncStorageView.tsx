import React, { useState } from 'react';
import { DownloadTask, CloudSaveEvent, ThemeMode, ServerConfig } from '../types';
import { getThemeStyles } from '../themeStyles';

interface SyncStorageViewProps {
  tasks: DownloadTask[];
  events: CloudSaveEvent[];
  config: ServerConfig;
  onUpdateConfig: (config: ServerConfig) => void;
  onPauseTask: (taskId: string) => void;
  onResumeTask: (taskId: string) => void;
  onCancelTask: (taskId: string) => void;
  onClearDone: () => void;
  onTriggerSaveSync: () => void;
  onBack: () => void;
  theme: ThemeMode;
}

export const SyncStorageView: React.FC<SyncStorageViewProps> = ({
  tasks,
  events,
  config,
  onUpdateConfig,
  onPauseTask,
  onResumeTask,
  onCancelTask,
  onClearDone,
  onTriggerSaveSync,
  onBack,
  theme,
}) => {
  const t = getThemeStyles(theme);
  const [activeSubTab, setActiveSubTab] = useState<'queue' | 'cloud' | 'cleaner'>('queue');
  const [selectedTaskId, setSelectedTaskId] = useState<string>(tasks[0]?.id || '');

  return (
    <div id="sync-storage-view" className="w-full flex-1 flex flex-col overflow-hidden select-none">
      {/* 1. Screen Sub-header */}
      <div
        className={`h-9 px-2 flex items-center justify-between border-b ${t.headerBorder} shrink-0 ${
          theme === 'paper' ? 'bg-[#e4e9ef]' : theme === 'amber' ? 'bg-[#191208]' : 'bg-[#171c24]'
        }`}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="flex items-center gap-1 bg-black/20 hover:bg-black/30 border border-current/30 px-1.5 py-[2px] rounded text-[8px] font-bold"
          >
            <span className="w-3 h-3 rounded-full bg-red-600 text-white flex items-center justify-center text-[7px] font-black">
              B
            </span>
            <span>BACK</span>
          </button>

          <div className="flex items-center gap-1 font-bold text-[11px] uppercase tracking-wider font-mono">
            <span className="material-symbols-outlined text-[13px] text-cyan-400">
              sync_saved_locally
            </span>
            <span className={t.textPrimary}>ROMM SYNC &amp; STORAGE</span>
          </div>
        </div>

        {/* Sub tabs */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveSubTab('queue')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold ${
              activeSubTab === 'queue'
                ? `${t.accentBg} ${t.accentText}`
                : `${t.textMuted} hover:${t.textPrimary}`
            }`}
          >
            <span>Queue ({tasks.filter((x) => x.status !== 'done').length})</span>
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
          </button>

          <button
            onClick={() => setActiveSubTab('cloud')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold ${
              activeSubTab === 'cloud'
                ? `${t.accentBg} ${t.accentText}`
                : `${t.textMuted} hover:${t.textPrimary}`
            }`}
          >
            <span>Cloud Saves</span>
          </button>

          <button
            onClick={() => setActiveSubTab('cleaner')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold ${
              activeSubTab === 'cleaner'
                ? `${t.accentBg} ${t.accentText}`
                : `${t.textMuted} hover:${t.textPrimary}`
            }`}
          >
            <span>TF2 Cleaner</span>
          </button>
        </div>
      </div>

      {/* 2. Main Content Area */}
      <main className="flex-1 flex flex-col p-1.5 gap-1.5 overflow-hidden">
        {/* Row 1: Storage Breakdown & Server Telemetry Banner */}
        <section
          className={`border ${t.cardBorder} p-2 rounded-xs flex flex-col gap-1 shrink-0 ${
            theme === 'paper' ? 'bg-white beveled-box' : t.cardBg
          }`}
        >
          {/* Capacity Header & Labels with Mount Switcher */}
          <div className="flex justify-between items-center text-[9px] font-mono">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[12px] text-cyan-400">
                hard_drive
              </span>
              <span className={`font-bold ${t.textPrimary}`}>
                {config.storageMount === '/roms2' ? 'TF2 SECONDARY SD' : 'TF1 INTERNAL SD'}
              </span>
              <span className={t.textMuted}>|</span>
              <span className={t.textMuted}>
                {config.storageMount === '/roms2'
                  ? '63.8 GB USED / 64.2 GB FREE'
                  : '17.2 GB USED / 14.8 GB FREE'}
              </span>

              {/* Quick Mount Buttons */}
              <div className="flex items-center gap-1 ml-2 bg-black/40 p-0.5 rounded border border-current/20">
                <button
                  onClick={() => onUpdateConfig({ ...config, storageMount: '/roms', tf2SyncPath: '/roms/tf2/romm_sync/' })}
                  className={`px-1.5 py-[1px] rounded text-[8px] font-bold transition-all ${
                    config.storageMount === '/roms'
                      ? 'bg-cyan-400 text-black shadow-xs font-black'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  title="Target TF1 internal storage (/roms)"
                >
                  /roms (TF1)
                </button>
                <button
                  onClick={() => onUpdateConfig({ ...config, storageMount: '/roms2', tf2SyncPath: '/roms2/tf2/romm_sync/' })}
                  className={`px-1.5 py-[1px] rounded text-[8px] font-bold transition-all ${
                    config.storageMount === '/roms2'
                      ? 'bg-cyan-400 text-black shadow-xs font-black'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  title="Target TF2 secondary game card (/roms2)"
                >
                  /roms2 (TF2)
                </button>
              </div>
            </div>

            {/* Server Sync Telemetry Badge */}
            <div className="flex items-center gap-1 text-[8.5px] bg-black/25 px-1.5 py-[2px] rounded border border-current/20">
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></span>
              <span className={t.textPrimary}>
                RomM: <strong className="text-cyan-300">1.2 TB (4,812 ROMs)</strong>
              </span>
            </div>
          </div>

          {/* Segmented Storage Bar */}
          <div className="w-full h-3 bg-black/40 border border-current/20 rounded-xs p-[1px] flex gap-[1px] overflow-hidden">
            {/* ROMs (Cyan) */}
            <div
              className="h-full bg-cyan-400"
              style={{ width: '38%' }}
              title="Installed ROMs: 48.6 GB"
            ></div>
            {/* Saves/BIOS (Purple) */}
            <div
              className="h-full bg-purple-500"
              style={{ width: '4%' }}
              title="Save States & BIOS: 4.2 GB"
            ></div>
            {/* ArkOS System (Gray) */}
            <div
              className="h-full bg-gray-500"
              style={{ width: '9%' }}
              title="ArkOS dArkOS System: 11.0 GB"
            ></div>
            {/* Free Space */}
            <div
              className="h-full bg-white/10 flex-1 relative flex items-center justify-end pr-1 text-[7.5px] font-mono text-cyan-200"
              title="Free MicroSD Space: 64.2 GB"
            >
              64.2 GB FREE
            </div>
          </div>

          {/* Legend Chips & Local Metric */}
          <div className="flex items-center justify-between text-[8px] font-mono pt-0.5">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-xs bg-cyan-400"></span>
                <span>ROMs (48.6 GB)</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-xs bg-purple-500"></span>
                <span>Saves/BIOS (4.2 GB)</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-xs bg-gray-500"></span>
                <span>dArkOS (11.0 GB)</span>
              </span>
            </div>

            <div className="font-bold text-cyan-400 flex items-center gap-1">
              <span className="material-symbols-outlined text-[10px]">sports_esports</span>
              <span>Local Games: 312</span>
            </div>
          </div>
        </section>

        {/* Row 2: 2-Column Split (Transfer Manager & Cloud Saves Panel) */}
        <div className="flex-1 grid grid-cols-12 gap-1.5 overflow-hidden">
          {/* Column 1: Active Downloads & Queue (7 cols) */}
          <section
            className={`col-span-8 border ${t.cardBorder} p-1.5 flex flex-col justify-between overflow-hidden rounded-xs ${
              theme === 'paper' ? 'bg-white beveled-box' : t.cardBg
            }`}
          >
            <div className="flex items-center justify-between pb-1 border-b border-current/20">
              <div className="flex items-center gap-1 text-[9.5px] font-bold font-mono uppercase">
                <span className="material-symbols-outlined text-[13px] text-cyan-400">
                  download
                </span>
                Transfer Manager ({tasks.filter((x) => x.status !== 'done').length} Active)
              </div>
              <button
                onClick={onClearDone}
                className="text-[8px] font-mono text-cyan-400 hover:underline"
              >
                CLEAR COMPLETED
              </button>
            </div>

            {/* Queue List Container */}
            <div className="flex-1 overflow-y-auto space-y-1 py-1">
              {tasks.map((task) => {
                const isSelected = selectedTaskId === task.id;

                if (task.status === 'downloading') {
                  return (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTaskId(task.id)}
                      className={`p-1.5 border rounded-xs cursor-pointer transition-all ${
                        isSelected
                          ? t.activeRowClass
                          : 'bg-black/20 border-cyan-500/40 hover:border-cyan-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 overflow-hidden min-w-0">
                          <span className="px-1 py-[0.5px] bg-cyan-900/60 text-cyan-300 text-[7.5px] font-bold rounded uppercase shrink-0">
                            {task.platform}
                          </span>
                          <span className="text-[11px] font-bold truncate">{task.title}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 text-[9px] font-bold text-cyan-400">
                          <span className="material-symbols-outlined text-[11px] animate-spin">
                            sync
                          </span>
                          <span>{task.progress}%</span>
                        </div>
                      </div>

                      {/* Speed & Stats */}
                      <div className="flex items-center justify-between text-[8px] font-mono opacity-80 mt-0.5">
                        <span className="font-bold text-cyan-300">
                          {task.speed} <span className="font-normal opacity-75">via Wi-Fi 5GHz</span>
                        </span>
                        <span>{task.size} • ETA: {task.eta}</span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-1.5 bg-black/40 border border-current/20 rounded-xs overflow-hidden mt-1">
                        <div
                          className="h-full bg-cyan-400 pulse-bar transition-all duration-300"
                          style={{ width: `${task.progress}%` }}
                        ></div>
                      </div>

                      {/* Controller Buttons In-Card */}
                      <div className="flex justify-end items-center gap-2 pt-1 mt-1 border-t border-current/15 text-[8px] font-mono">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onPauseTask(task.id);
                          }}
                          className="flex items-center gap-1 hover:text-amber-300"
                        >
                          <span className="w-3 h-3 rounded-full bg-black/40 border border-current flex items-center justify-center text-[7px] font-bold">
                            X
                          </span>
                          <span>Pause</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onCancelTask(task.id);
                          }}
                          className="flex items-center gap-1 text-red-400 hover:text-red-300"
                        >
                          <span className="w-3 h-3 rounded-full bg-black/40 border border-current flex items-center justify-center text-[7px] font-bold">
                            Y
                          </span>
                          <span>Cancel</span>
                        </button>
                      </div>
                    </div>
                  );
                }

                if (task.status === 'done') {
                  return (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTaskId(task.id)}
                      className="p-1.5 rounded-xs border border-current/20 bg-black/10 flex items-center justify-between opacity-80"
                    >
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <span className="px-1 py-[0.5px] bg-green-950/60 text-green-300 text-[7.5px] font-bold rounded uppercase">
                          {task.platform}
                        </span>
                        <div className="truncate">
                          <div className="text-[10px] font-medium truncate line-through opacity-70">
                            {task.title}
                          </div>
                          <div className="text-[7.5px] font-mono text-green-400">
                            Installed to /roms/{task.platform} • {task.size}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-[8px] font-bold text-green-400 font-mono">
                        <span className="material-symbols-outlined text-[12px]">check_circle</span>
                        <span>DONE</span>
                      </div>
                    </div>
                  );
                }

                // Queued or Paused
                return (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    className="p-1.5 rounded-xs border border-current/20 bg-black/15 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <span className="px-1 py-[0.5px] bg-black/40 text-current text-[7.5px] font-bold rounded uppercase">
                        {task.platform}
                      </span>
                      <div className="truncate">
                        <div className="text-[10px] font-bold truncate">{task.title}</div>
                        <div className="text-[7.5px] font-mono opacity-70">{task.size} • ROM File Payload</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-[1px] bg-black/30 border border-current/30 text-[8px] font-mono rounded">
                        {task.eta}
                      </span>
                      {task.status === 'paused' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onResumeTask(task.id);
                          }}
                          className="px-1 py-[1px] bg-cyan-600 text-white rounded text-[7.5px] font-bold"
                        >
                          RESUME
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Column 2: Cloud Saves State Synchronization (4 cols) */}
          <section
            className={`col-span-4 border ${t.cardBorder} p-1.5 flex flex-col justify-between rounded-xs ${
              theme === 'paper' ? 'bg-white beveled-box' : t.cardBg
            }`}
          >
            <div className="flex flex-col gap-1.5 overflow-hidden">
              <div className="flex items-center justify-between border-b border-current/20 pb-1">
                <div className="flex items-center gap-1 text-[9.5px] font-bold font-mono uppercase">
                  <span className="material-symbols-outlined text-[13px] text-purple-400">
                    cloud_sync
                  </span>
                  <span>Cloud Saves</span>
                </div>
                <button
                  onClick={onTriggerSaveSync}
                  className="px-1.5 py-[1px] bg-cyan-500 hover:bg-cyan-400 text-black text-[7.5px] font-bold rounded"
                  title="Force Synchronize Saves Now"
                >
                  SYNC NOW
                </button>
              </div>

              {/* Auto Sync Toggle Status */}
              <div
                className={`p-1.5 border rounded-xs flex flex-col gap-0.5 ${
                  theme === 'paper' ? 'bg-[#dee3e9] border-[#b0b9c3]' : 'bg-black/25 border-current/20'
                }`}
              >
                <div className="flex justify-between items-center text-[8.5px] font-mono">
                  <span className="font-bold">AUTO CLOUD SYNC</span>
                  <button
                    onClick={() =>
                      onUpdateConfig({ ...config, autoSyncSaves: !config.autoSyncSaves })
                    }
                    className={`px-1 py-[0.5px] rounded text-[7.5px] font-bold border ${
                      config.autoSyncSaves
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-400'
                        : 'bg-red-950 text-red-300 border-red-500'
                    }`}
                  >
                    {config.autoSyncSaves ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>
                <p className={`text-[7.5px] leading-tight ${t.textMuted}`}>
                  Triggered on RetroArch game exit &amp; initial dArkOS boot.
                </p>
              </div>

              {/* Recent Sync Record */}
              <div
                className={`p-1.5 border rounded-xs flex flex-col gap-1 ${
                  theme === 'paper' ? 'bg-[#dee3e9] border-[#b0b9c3]' : 'bg-black/20 border-current/20'
                }`}
              >
                <div className="flex items-center justify-between text-[8px] font-mono">
                  <span className="font-bold text-cyan-300">RECENT SYNC EVENT</span>
                  <span className={t.textMuted}>{events[0]?.timeAgo || '12m ago'}</span>
                </div>
                <div className="text-[10px] font-bold truncate">
                  {events[0]?.gameTitle || 'Super Metroid (Slot 1)'}
                </div>
                <div className="flex items-center gap-1 text-[7.5px] font-mono text-cyan-400">
                  <span className="material-symbols-outlined text-[9px]">sync_alt</span>
                  <span className="truncate">{events[0]?.details || 'RomM Cloud <=> SD2/snes'}</span>
                </div>
              </div>

              {/* Conflict Resolution Selector */}
              <div className="border border-current/20 p-1.5 rounded-xs flex flex-col gap-1">
                <span className={`text-[7.5px] font-mono ${t.textMuted}`}>CONFLICT RESOLUTION:</span>
                <select
                  value={config.conflictResolution}
                  onChange={(e) =>
                    onUpdateConfig({
                      ...config,
                      conflictResolution: e.target.value as any,
                    })
                  }
                  className={`w-full text-[8.5px] font-mono p-1 rounded-xs border border-current/30 bg-black/40 ${t.textPrimary} outline-none`}
                >
                  <option value="Keep Newer Save">Keep Newer Save (Timestamp)</option>
                  <option value="Server Authoritative">RomM Cloud Authoritative</option>
                  <option value="Local Authoritative">R36S MicroSD Authoritative</option>
                </select>
              </div>
            </div>

            {/* Cloud Storage Metric */}
            <div className="pt-1 border-t border-current/20 flex items-center justify-between text-[7.5px] font-mono opacity-80">
              <span>RomM Cloud Vault:</span>
              <span className="font-bold">42 Saves (148 MB)</span>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};
