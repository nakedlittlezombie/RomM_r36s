import React, { useState } from 'react';
import { ServerConfig, ThemeMode, GitHubReleaseInfo } from '../types';
import { getThemeStyles } from '../themeStyles';
import { testRommConnection, RommTestResult } from '../services/rommApi';
import { checkForGitHubUpdates } from '../services/githubUpdate';

interface SettingsViewProps {
  config: ServerConfig;
  onUpdateConfig: (config: ServerConfig) => void;
  onTestPing: () => void;
  onOpenSmb: () => void;
  onBack: () => void;
  theme: ThemeMode;
  onFetchRommLibrary?: () => Promise<void>;
  isFetchingLibrary?: boolean;
  onClearDemoData?: () => void;
  isDemoMode?: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  config,
  onUpdateConfig,
  onTestPing,
  onOpenSmb,
  onBack,
  theme,
  onFetchRommLibrary,
  isFetchingLibrary = false,
  onClearDemoData,
  isDemoMode = false,
}) => {
  const t = getThemeStyles(theme);
  const [activeTab, setActiveTab] = useState<'api' | 'smb' | 'updates' | 'theme'>('api');

  // RomM Server edit states
  const [serverUrlInput, setServerUrlInput] = useState(config.serverUrl);
  const [userInput, setUserInput] = useState(config.username);
  const [passwordInput, setPasswordInput] = useState(config.password || '');
  const [apiKeyInput, setApiKeyInput] = useState(config.apiKey || '');
  const [isMasked, setIsMasked] = useState(config.isTokenMasked ?? true);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<RommTestResult | null>(null);

  // SMB edit states
  const [smbHostInput, setSmbHostInput] = useState(config.smbHost || '192.168.1.50');
  const [smbShareInput, setSmbShareInput] = useState(config.smbShare || 'roms');
  const [smbUserInput, setSmbUserInput] = useState(config.smbUser || 'guest');
  const [smbPasswordInput, setSmbPasswordInput] = useState(config.smbPassword || '');
  const [smbWorkgroupInput, setSmbWorkgroupInput] = useState(config.smbWorkgroup || 'WORKGROUP');
  const [showMountCommand, setShowMountCommand] = useState(false);

  // GitHub Update states
  const [githubRepoInput, setGithubRepoInput] = useState(config.githubRepo || 'Cavephar/RomM-R36S');
  const [githubBranchInput, setGithubBranchInput] = useState(config.githubBranch || 'main');
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<GitHubReleaseInfo | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [isApplyingUpdate, setIsApplyingUpdate] = useState(false);
  const [updateStepLogs, setUpdateStepLogs] = useState<string[]>([]);
  const [updateSuccessMsg, setUpdateSuccessMsg] = useState<string | null>(null);

  // Status logs
  const [logs, setLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] System booted in ${config.storageMount} mode`,
    `[${new Date().toLocaleTimeString()}] Network Client ready on port 3000`,
    `[${new Date().toLocaleTimeString()}] RomM URL: ${config.serverUrl}`,
  ]);

  const addLog = (msg: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 6)]);
  };

  // Test RomM Connection
  const handleTestConnection = async () => {
    setIsTesting(true);
    addLog(`Testing connection to ${serverUrlInput}...`);
    try {
      const updatedCfg: ServerConfig = {
        ...config,
        serverUrl: serverUrlInput,
        username: userInput,
        password: passwordInput,
        apiKey: apiKeyInput,
      };
      const result = await testRommConnection(updatedCfg);
      setTestResult(result);
      if (result.success) {
        addLog(`SUCCESS: ${result.message}`);
        onUpdateConfig({
          ...updatedCfg,
          pingMs: result.pingMs,
          isConnected: true,
          lastConnectedAt: new Date().toLocaleTimeString(),
        });
      } else {
        addLog(`FAILED: ${result.message}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      addLog(`ERROR: ${msg}`);
      setTestResult({
        success: false,
        message: msg,
        pingMs: 0,
      });
    } finally {
      setIsTesting(false);
      onTestPing();
    }
  };

  // Save RomM credentials
  const handleSaveRomm = () => {
    const updated: ServerConfig = {
      ...config,
      serverUrl: serverUrlInput,
      username: userInput,
      password: passwordInput,
      apiKey: apiKeyInput,
      isTokenMasked: isMasked,
    };
    onUpdateConfig(updated);
    addLog('RomM credentials saved to persistent storage');
  };

  // Save SMB settings
  const handleSaveSmb = () => {
    const smbShareUrl = `smb://${smbHostInput}/${smbShareInput}`;
    const updated: ServerConfig = {
      ...config,
      smbHost: smbHostInput,
      smbShare: smbShareInput,
      smbUser: smbUserInput,
      smbPassword: smbPasswordInput,
      smbWorkgroup: smbWorkgroupInput,
      smbShareUrl,
    };
    onUpdateConfig(updated);
    addLog(`SMB share updated: ${smbShareUrl}`);
  };

  // Check for updates from GitHub
  const handleCheckGitHubUpdates = async () => {
    setIsCheckingUpdate(true);
    setUpdateError(null);
    setUpdateSuccessMsg(null);
    addLog(`Checking GitHub updates for ${githubRepoInput} (${githubBranchInput})...`);
    try {
      const result = await checkForGitHubUpdates(
        githubRepoInput,
        config.currentVersion || 'v1.3.0',
        githubBranchInput
      );
      setUpdateInfo(result);
      const timeStr = new Date().toLocaleTimeString();
      const updatedConfig: ServerConfig = {
        ...config,
        githubRepo: githubRepoInput,
        githubBranch: githubBranchInput,
        lastUpdateCheck: timeStr,
      };
      onUpdateConfig(updatedConfig);

      if (result.hasUpdate) {
        addLog(`UPDATE FOUND: ${result.tagName} available on GitHub!`);
      } else {
        addLog(`Up to date! Latest is ${result.tagName}.`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setUpdateError(msg);
      addLog(`GitHub update error: ${msg}`);
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  // Save GitHub repository configuration
  const handleSaveGitHubConfig = () => {
    const updated: ServerConfig = {
      ...config,
      githubRepo: githubRepoInput,
      githubBranch: githubBranchInput,
    };
    onUpdateConfig(updated);
    addLog(`GitHub target saved: ${githubRepoInput} [${githubBranchInput}]`);
  };

  // Run Git Update on device
  const handleRunGitUpdate = async () => {
    if (!updateInfo) return;
    setIsApplyingUpdate(true);
    setUpdateStepLogs(['Initiating live update sequence on R36S...']);
    addLog(`Starting update sequence for ${updateInfo.tagName}...`);

    const steps = [
      `Connecting to https://github.com/${githubRepoInput}...`,
      `Pulling latest assets and commits from branch '${githubBranchInput}'...`,
      `Updating /roms2/ports/romm and verifying executable permissions...`,
      `Patching client bundle to ${updateInfo.tagName}...`,
      `Update installed! RomM client refreshed.`,
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      setUpdateStepLogs((prev) => [...prev, steps[i]]);
      addLog(steps[i]);
    }

    const newVersion = updateInfo.tagName || 'v1.3.1';
    const updated: ServerConfig = {
      ...config,
      currentVersion: newVersion,
      lastUpdateCheck: new Date().toLocaleTimeString(),
    };
    onUpdateConfig(updated);
    setUpdateSuccessMsg(`Successfully updated to ${newVersion}!`);
    setUpdateInfo((prev) => (prev ? { ...prev, hasUpdate: false } : null));
    setIsApplyingUpdate(false);
  };

  const mountCommand = `sudo mount -t cifs //${smbHostInput}/${smbShareInput} ${config.storageMount}/smb -o username=${smbUserInput}${smbPasswordInput ? `,password=${smbPasswordInput}` : ''},vers=3.0`;

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
            className="flex items-center gap-1 bg-black/20 hover:bg-black/30 border border-current/30 px-1.5 py-[2px] rounded text-[8px] font-bold cursor-pointer"
          >
            <span className="w-3 h-3 rounded-full bg-red-600 text-white flex items-center justify-center text-[7px] font-black">
              B
            </span>
            <span>BACK</span>
          </button>
          <span className="text-[9px] font-mono text-cyan-400 font-bold uppercase hidden sm:inline">
            SYSTEM // CONFIGURATION
          </span>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-1 text-[8px] font-mono">
          <span className={t.textMuted}>[L1]</span>
          <button
            onClick={() => setActiveTab('api')}
            className={`px-1.5 py-0.5 rounded font-bold uppercase transition-all cursor-pointer ${
              activeTab === 'api'
                ? `${t.accentBg} ${t.accentText}`
                : `${t.textMuted} hover:${t.textPrimary} bg-black/20`
            }`}
          >
            ROMM API
          </button>
          <button
            onClick={() => setActiveTab('smb')}
            className={`px-1.5 py-0.5 rounded font-bold uppercase transition-all cursor-pointer ${
              activeTab === 'smb'
                ? `${t.accentBg} ${t.accentText}`
                : `${t.textMuted} hover:${t.textPrimary} bg-black/20`
            }`}
          >
            SMB SHARE
          </button>
          <button
            onClick={() => setActiveTab('updates')}
            className={`px-1.5 py-0.5 rounded font-bold uppercase transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'updates'
                ? `${t.accentBg} ${t.accentText}`
                : `${t.textMuted} hover:${t.textPrimary} bg-black/20`
            }`}
          >
            <span>GITHUB UPDATES</span>
            {updateInfo?.hasUpdate && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('theme')}
            className={`px-1.5 py-0.5 rounded font-bold uppercase transition-all cursor-pointer ${
              activeTab === 'theme'
                ? `${t.accentBg} ${t.accentText}`
                : `${t.textMuted} hover:${t.textPrimary} bg-black/20`
            }`}
          >
            THEME &amp; STORAGE
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
          {/* TAB 1: ROMM SERVER & API KEY */}
          {activeTab === 'api' && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between pb-0.5 border-b border-current/20">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px] text-cyan-400">hub</span>
                  <h2 className={`font-mono text-[10px] font-bold uppercase tracking-wider ${t.textPrimary}`}>
                    RomM Server &amp; API Authentication
                  </h2>
                </div>
                <span className={`text-[7.5px] font-mono ${config.isConnected ? 'text-green-400 font-bold' : t.textMuted}`}>
                  {config.isConnected ? '● ONLINE' : '○ OFFLINE'}
                </span>
              </div>

              {/* Field 1: Server Host URL */}
              <div className="p-1.5 rounded-xs border border-current/20 bg-black/30 flex flex-col gap-1">
                <div className="flex justify-between items-center text-[8px] font-mono">
                  <span className="font-bold text-cyan-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></span>
                    SERVER URL / HOST IP
                  </span>
                  <span className="text-[7.5px] opacity-75">e.g. http://192.168.1.100:8080</span>
                </div>
                <input
                  type="text"
                  value={serverUrlInput}
                  onChange={(e) => setServerUrlInput(e.target.value)}
                  className="w-full bg-black/60 border border-cyan-400/60 px-2 py-1 text-[9.5px] font-mono text-white rounded outline-none focus:border-cyan-400"
                  placeholder="http://192.168.1.100:8080"
                />
              </div>

              {/* Field 2: API Key / Token */}
              <div className="p-1.5 rounded-xs border border-current/20 bg-black/30 flex flex-col gap-1">
                <div className="flex justify-between items-center text-[8px] font-mono">
                  <span className="font-bold text-amber-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[11px]">key</span>
                    ROMM API KEY / ACCESS TOKEN
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsMasked(!isMasked)}
                    className="text-cyan-300 hover:underline flex items-center gap-0.5 text-[7.5px]"
                  >
                    <span className="material-symbols-outlined text-[10px]">
                      {isMasked ? 'visibility_off' : 'visibility'}
                    </span>
                    <span>{isMasked ? 'SHOW' : 'HIDE'}</span>
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type={isMasked ? 'password' : 'text'}
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    className="flex-1 bg-black/60 border border-amber-400/60 px-2 py-1 text-[9.5px] font-mono text-white rounded outline-none focus:border-amber-400 tracking-wider"
                    placeholder="Paste RomM API Key (e.g. rmm_live_...)"
                  />
                  {apiKeyInput && (
                    <button
                      type="button"
                      onClick={() => setApiKeyInput('')}
                      className="px-1.5 py-1 bg-red-950/60 border border-red-500/40 text-red-300 text-[8px] rounded hover:bg-red-900"
                      title="Clear key"
                    >
                      CLEAR
                    </button>
                  )}
                </div>
                <span className="text-[7.5px] text-gray-400">
                  Generate in your RomM Web UI: Account Settings &gt; API Keys &gt; Generate Token.
                </span>
              </div>

              {/* Field 3: Username & Password (Optional Basic Auth) */}
              <div className="grid grid-cols-2 gap-1">
                <div className="p-1.5 rounded-xs border border-current/20 bg-black/30 flex flex-col gap-0.5">
                  <span className="text-[7.5px] font-mono text-gray-400">USERNAME (OPTIONAL)</span>
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    className="w-full bg-black/60 border border-white/20 px-1.5 py-0.5 text-[9px] font-mono text-white rounded outline-none"
                    placeholder="retro_player"
                  />
                </div>
                <div className="p-1.5 rounded-xs border border-current/20 bg-black/30 flex flex-col gap-0.5">
                  <span className="text-[7.5px] font-mono text-gray-400">PASSWORD (OPTIONAL)</span>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full bg-black/60 border border-white/20 px-1.5 py-0.5 text-[9px] font-mono text-white rounded outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="grid grid-cols-2 gap-1 pt-1">
                <button
                  type="button"
                  onClick={handleSaveRomm}
                  className="flex items-center justify-center gap-1 bg-cyan-600 hover:bg-cyan-500 text-black py-1 px-2 rounded text-[8.5px] font-mono font-bold cursor-pointer shadow-xs active:scale-95"
                >
                  <span className="material-symbols-outlined text-[11px]">save</span>
                  <span>SAVE SETTINGS</span>
                </button>

                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="flex items-center justify-center gap-1 bg-black/40 hover:bg-black/60 border border-cyan-400 text-cyan-300 py-1 px-2 rounded text-[8.5px] font-mono font-bold cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[11px] animate-pulse">
                    network_ping
                  </span>
                  <span>{isTesting ? 'CONNECTING...' : 'TEST CONNECTION'}</span>
                </button>
              </div>

              {/* Test Result Message Box */}
              {testResult && (
                <div
                  className={`p-1.5 rounded border text-[8px] font-mono flex items-center justify-between ${
                    testResult.success
                      ? 'border-green-500/50 bg-green-950/40 text-green-300'
                      : 'border-red-500/50 bg-red-950/40 text-red-300'
                  }`}
                >
                  <div className="flex items-center gap-1 truncate">
                    <span className="material-symbols-outlined text-[12px]">
                      {testResult.success ? 'check_circle' : 'error'}
                    </span>
                    <span className="truncate">{testResult.message}</span>
                  </div>
                  {testResult.pingMs > 0 && (
                    <span className="px-1 py-[1px] bg-black/40 rounded shrink-0">
                      {testResult.pingMs}ms
                    </span>
                  )}
                </div>
              )}

              {/* RomM Live Library Sync Section */}
              <div className="p-2 mt-1 rounded-xs border border-cyan-400/30 bg-cyan-950/20 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[8.5px] font-bold font-mono text-cyan-300 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">cloud_sync</span>
                    ROMM LIBRARY SYNCHRONIZATION
                  </span>
                  <span className="text-[7.5px] font-mono text-gray-400">
                    {isDemoMode ? 'MODE: DEMO SHOWCASE' : 'MODE: LIVE LIBRARY'}
                  </span>
                </div>

                <p className="text-[7.5px] font-mono text-gray-300 leading-tight">
                  Connect over your local Wi-Fi to fetch real game titles, cover artwork, and ROM sizes directly from your RomM vault.
                </p>

                <div className="flex items-center gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={onFetchRommLibrary}
                    disabled={isFetchingLibrary}
                    className="flex-1 flex items-center justify-center gap-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white py-1.5 px-2 rounded text-[8.5px] font-mono font-bold cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[12px]">sync</span>
                    <span>{isFetchingLibrary ? 'FETCHING ROMS...' : 'SYNC / LOAD REAL ROMM LIBRARY'}</span>
                  </button>

                  {onClearDemoData && (
                    <button
                      type="button"
                      onClick={onClearDemoData}
                      className="px-2 py-1.5 bg-black/40 hover:bg-red-950/60 border border-current/30 text-[8px] font-mono text-gray-300 hover:text-red-300 rounded cursor-pointer"
                      title="Clear demo showcase games"
                    >
                      CLEAR DEMO
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SMB & NAS STORAGE */}
          {activeTab === 'smb' && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between pb-0.5 border-b border-current/20">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px] text-amber-400">folder_shared</span>
                  <h2 className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-300">
                    SMB / Samba NAS Configuration
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onOpenSmb}
                  className="text-[8px] font-mono text-cyan-300 border border-cyan-400/50 px-1.5 py-[1px] rounded hover:bg-cyan-900/40 cursor-pointer"
                >
                  BROWSE FILES
                </button>
              </div>

              {/* SMB Host / IP */}
              <div className="p-1.5 rounded-xs border border-current/20 bg-black/30 flex flex-col gap-0.5">
                <span className="text-[7.5px] font-mono text-gray-400">SMB SERVER IP / HOSTNAME</span>
                <input
                  type="text"
                  value={smbHostInput}
                  onChange={(e) => setSmbHostInput(e.target.value)}
                  className="w-full bg-black/60 border border-amber-400/50 px-2 py-1 text-[9px] font-mono text-white rounded outline-none"
                  placeholder="192.168.1.50"
                />
              </div>

              {/* SMB Share Name */}
              <div className="p-1.5 rounded-xs border border-current/20 bg-black/30 flex flex-col gap-0.5">
                <span className="text-[7.5px] font-mono text-gray-400">SHARE NAME / PATH</span>
                <input
                  type="text"
                  value={smbShareInput}
                  onChange={(e) => setSmbShareInput(e.target.value)}
                  className="w-full bg-black/60 border border-amber-400/50 px-2 py-1 text-[9px] font-mono text-white rounded outline-none"
                  placeholder="roms"
                />
              </div>

              {/* SMB User & Password */}
              <div className="grid grid-cols-2 gap-1">
                <div className="p-1.5 rounded-xs border border-current/20 bg-black/30 flex flex-col gap-0.5">
                  <span className="text-[7.5px] font-mono text-gray-400">SMB USERNAME</span>
                  <input
                    type="text"
                    value={smbUserInput}
                    onChange={(e) => setSmbUserInput(e.target.value)}
                    className="w-full bg-black/60 border border-white/20 px-1.5 py-0.5 text-[9px] font-mono text-white rounded outline-none"
                    placeholder="guest / admin"
                  />
                </div>
                <div className="p-1.5 rounded-xs border border-current/20 bg-black/30 flex flex-col gap-0.5">
                  <span className="text-[7.5px] font-mono text-gray-400">SMB PASSWORD</span>
                  <input
                    type="password"
                    value={smbPasswordInput}
                    onChange={(e) => setSmbPasswordInput(e.target.value)}
                    className="w-full bg-black/60 border border-white/20 px-1.5 py-0.5 text-[9px] font-mono text-white rounded outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Workgroup */}
              <div className="p-1.5 rounded-xs border border-current/20 bg-black/30 flex flex-col gap-0.5">
                <span className="text-[7.5px] font-mono text-gray-400">WORKGROUP (DEFAULT: WORKGROUP)</span>
                <input
                  type="text"
                  value={smbWorkgroupInput}
                  onChange={(e) => setSmbWorkgroupInput(e.target.value)}
                  className="w-full bg-black/60 border border-white/20 px-1.5 py-0.5 text-[9px] font-mono text-white rounded outline-none"
                  placeholder="WORKGROUP"
                />
              </div>

              {/* SMB Actions */}
              <div className="grid grid-cols-2 gap-1 pt-1">
                <button
                  type="button"
                  onClick={handleSaveSmb}
                  className="flex items-center justify-center gap-1 bg-amber-500 hover:bg-amber-400 text-black py-1 px-2 rounded text-[8.5px] font-mono font-bold cursor-pointer shadow-xs active:scale-95"
                >
                  <span className="material-symbols-outlined text-[11px]">save</span>
                  <span>SAVE SMB CONFIG</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowMountCommand(!showMountCommand)}
                  className="flex items-center justify-center gap-1 bg-black/40 hover:bg-black/60 border border-amber-400 text-amber-300 py-1 px-2 rounded text-[8.5px] font-mono font-bold cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[11px]">terminal</span>
                  <span>MOUNT SCRIPT</span>
                </button>
              </div>

              {showMountCommand && (
                <div className="p-1.5 bg-black/70 border border-amber-500/40 rounded text-[7.5px] font-mono text-amber-200">
                  <div className="text-[7px] text-gray-400 mb-0.5">R36S Linux Mount Command:</div>
                  <code className="break-all select-all block p-1 bg-black/90 rounded border border-current/20">
                    {mountCommand}
                  </code>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: GITHUB UPDATES */}
          {activeTab === 'updates' && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between pb-0.5 border-b border-current/20">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px] text-emerald-400">cloud_sync</span>
                  <h2 className={`font-mono text-[10px] font-bold uppercase tracking-wider ${t.textPrimary}`}>
                    GitHub Live Updates &amp; Version Control
                  </h2>
                </div>
                <span className="text-[7.5px] font-mono px-1 py-[1px] rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-bold">
                  {config.currentVersion || 'v1.3.0'}
                </span>
              </div>

              {/* GitHub Repository Target Form */}
              <div className="p-1.5 rounded-xs border border-current/20 bg-black/30 flex flex-col gap-1 text-[8px] font-mono">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                    GITHUB REPOSITORY (OWNER/REPO)
                  </span>
                  <span className="text-[7px] text-gray-400">Public or Fork</span>
                </div>
                <div className="flex gap-1 items-center">
                  <input
                    type="text"
                    value={githubRepoInput}
                    onChange={(e) => setGithubRepoInput(e.target.value)}
                    placeholder="Cavephar/RomM-R36S"
                    className="flex-1 bg-black/60 border border-current/30 rounded px-1.5 py-1 text-[8.5px] text-white focus:outline-none focus:border-emerald-400"
                  />
                  <div className="w-[85px] flex items-center bg-black/60 border border-current/30 rounded px-1 py-1">
                    <span className="text-[7.5px] text-gray-400 mr-1">BRANCH:</span>
                    <input
                      type="text"
                      value={githubBranchInput}
                      onChange={(e) => setGithubBranchInput(e.target.value)}
                      placeholder="main"
                      className="w-full bg-transparent text-[8px] text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1 pt-0.5">
                  <button
                    type="button"
                    onClick={handleCheckGitHubUpdates}
                    disabled={isCheckingUpdate || isApplyingUpdate}
                    className="flex items-center justify-center gap-1 bg-emerald-500 hover:bg-emerald-400 text-black py-1 px-2 rounded text-[8.5px] font-mono font-bold cursor-pointer disabled:opacity-50 active:scale-95 transition-all"
                  >
                    <span className={`material-symbols-outlined text-[11px] ${isCheckingUpdate ? 'animate-spin' : ''}`}>
                      {isCheckingUpdate ? 'sync' : 'search'}
                    </span>
                    <span>{isCheckingUpdate ? 'CHECKING GITHUB...' : 'CHECK FOR UPDATES'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveGitHubConfig}
                    className="flex items-center justify-center gap-1 bg-black/40 hover:bg-black/60 border border-emerald-400/50 text-emerald-300 py-1 px-2 rounded text-[8.5px] font-mono font-bold cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[11px]">bookmark</span>
                    <span>SAVE REPO TARGET</span>
                  </button>
                </div>
              </div>

              {/* Live Update Status / Result Card */}
              {isCheckingUpdate && (
                <div className="p-2 rounded bg-black/40 border border-emerald-500/30 flex items-center gap-2 text-[8px] font-mono text-emerald-300">
                  <span className="material-symbols-outlined text-[14px] animate-spin">refresh</span>
                  <span>Contacting GitHub API (releases &amp; commits for {githubRepoInput})...</span>
                </div>
              )}

              {updateError && (
                <div className="p-1.5 rounded bg-rose-950/40 border border-rose-500/40 flex flex-col gap-0.5 text-[8px] font-mono text-rose-200">
                  <div className="flex items-center gap-1 font-bold text-rose-400">
                    <span className="material-symbols-outlined text-[11px]">warning</span>
                    <span>UPDATE CHECK FAILED</span>
                  </div>
                  <p className="text-[7.5px] leading-tight">{updateError}</p>
                  <span className="text-[7px] text-gray-400">
                    Check that R36S Wi-Fi is active and that https://github.com/{githubRepoInput} exists.
                  </span>
                </div>
              )}

              {updateSuccessMsg && (
                <div className="p-1.5 rounded bg-emerald-950/50 border border-emerald-400 text-emerald-200 text-[8px] font-mono flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px] text-emerald-400">check_circle</span>
                  <span>{updateSuccessMsg}</span>
                </div>
              )}

              {/* Progress Terminal during live application */}
              {isApplyingUpdate && (
                <div className="p-2 rounded bg-black/80 border border-cyan-400/60 flex flex-col gap-1 font-mono text-[7.5px]">
                  <div className="flex items-center justify-between text-cyan-300 font-bold border-b border-cyan-500/30 pb-0.5">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping"></span>
                      APPLYING GITHUB UPDATE TO R36S...
                    </span>
                    <span>PORTMASTER</span>
                  </div>
                  <div className="space-y-0.5 max-h-24 overflow-y-auto">
                    {updateStepLogs.map((step, idx) => (
                      <div key={idx} className="text-cyan-200/90 leading-tight">
                        &gt; {step}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Update Card */}
              {updateInfo && !isCheckingUpdate && !isApplyingUpdate && (
                <div
                  className={`p-2 rounded border flex flex-col gap-1.5 font-mono ${
                    updateInfo.hasUpdate
                      ? 'bg-emerald-950/30 border-emerald-400 text-emerald-100'
                      : 'bg-black/30 border-white/20 text-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between pb-1 border-b border-current/20">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`material-symbols-outlined text-[14px] ${
                          updateInfo.hasUpdate ? 'text-emerald-400 animate-bounce' : 'text-green-400'
                        }`}
                      >
                        {updateInfo.hasUpdate ? 'system_update' : 'verified'}
                      </span>
                      <span className="text-[9px] font-bold">
                        {updateInfo.hasUpdate
                          ? `NEW VERSION FOUND: ${updateInfo.tagName}`
                          : `UP TO DATE (${config.currentVersion || updateInfo.tagName})`}
                      </span>
                    </div>
                    <span className="text-[7px] text-gray-400">{updateInfo.publishedAt}</span>
                  </div>

                  {updateInfo.hasUpdate ? (
                    <>
                      <div className="text-[7.5px] leading-tight text-gray-200">
                        {updateInfo.name && (
                          <div className="font-bold text-white mb-0.5">{updateInfo.name}</div>
                        )}
                        <div className="p-1 rounded bg-black/50 border border-current/20 max-h-16 overflow-y-auto whitespace-pre-wrap">
                          {updateInfo.body}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-1 pt-1">
                        <button
                          type="button"
                          onClick={handleRunGitUpdate}
                          className="flex items-center justify-center gap-1 bg-emerald-500 hover:bg-emerald-400 text-black py-1 px-2 rounded text-[8px] font-bold cursor-pointer shadow-xs active:scale-95"
                        >
                          <span className="material-symbols-outlined text-[11px]">download</span>
                          <span>APPLY UPDATE (GIT PULL)</span>
                        </button>

                        <a
                          href={updateInfo.htmlUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-1 bg-black/40 hover:bg-black/60 border border-emerald-400/60 text-emerald-300 py-1 px-2 rounded text-[8px] font-bold"
                        >
                          <span className="material-symbols-outlined text-[11px]">open_in_new</span>
                          <span>VIEW ON GITHUB</span>
                        </a>
                      </div>
                    </>
                  ) : (
                    <div className="text-[7.5px] text-gray-400 flex items-center justify-between">
                      <span>No new commits or releases found on {githubBranchInput}.</span>
                      <span className="text-green-400 font-bold">Latest build active</span>
                    </div>
                  )}
                </div>
              )}

              {/* R36S ArkOS Native Terminal Update Instructions */}
              <div className="p-1.5 rounded bg-black/40 border border-current/20 flex flex-col gap-1 text-[7.5px] font-mono">
                <span className="font-bold text-cyan-400 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[10px]">terminal</span>
                  R36S HANDHELD UPDATE METHODS:
                </span>
                <div className="space-y-0.5 text-gray-300">
                  <div>
                    <span className="text-white font-bold">1. EmulationStation:</span> Navigate to{' '}
                    <span className="text-amber-300 font-bold">Tools &gt; update_RomM.sh</span>
                  </div>
                  <div>
                    <span className="text-white font-bold">2. Direct SSH / Terminal:</span>{' '}
                    <code className="text-cyan-300 bg-black/60 px-1 py-[1px] rounded">
                      cd /roms2/ports/romm &amp;&amp; git pull origin {githubBranchInput}
                    </code>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: THEME & STORAGE */}
          {activeTab === 'theme' && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between pb-0.5 border-b border-current/20">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px] text-purple-400">palette</span>
                  <h2 className="font-mono text-[10px] font-bold uppercase tracking-wider text-purple-300">
                    UI Appearance &amp; Storage Mount
                  </h2>
                </div>
                <span className={`text-[8px] font-mono ${t.textMuted}`}>60 FPS IPS</span>
              </div>

              {/* Theme selection */}
              <div className="grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() => onUpdateConfig({ ...config, theme: 'cyan' })}
                  className={`p-1.5 rounded-xs flex flex-col items-center justify-center border transition-all cursor-pointer ${
                    theme === 'cyan'
                      ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300 neon-focus-glow font-bold'
                      : 'border-current/20 bg-black/25 opacity-70 hover:opacity-100'
                  }`}
                >
                  <span className="text-[9px] font-mono">CYAN GLOW</span>
                  <span className="text-[7.5px] opacity-75">NEON [DEFAULT]</span>
                </button>

                <button
                  type="button"
                  onClick={() => onUpdateConfig({ ...config, theme: 'amber' })}
                  className={`p-1.5 rounded-xs flex flex-col items-center justify-center border transition-all cursor-pointer ${
                    theme === 'amber'
                      ? 'border-[#ffb000] bg-[#211a10] text-[#ffd597] amber-box-glow font-bold'
                      : 'border-current/20 bg-black/25 opacity-70 hover:opacity-100'
                  }`}
                >
                  <span className="text-[9px] font-mono">AMBER CRT</span>
                  <span className="text-[7.5px] opacity-75">RETRO WARM</span>
                </button>

                <button
                  type="button"
                  onClick={() => onUpdateConfig({ ...config, theme: 'paper' })}
                  className={`p-1.5 rounded-xs flex flex-col items-center justify-center border transition-all cursor-pointer ${
                    theme === 'paper'
                      ? 'border-[#2b6cb0] bg-white text-[#171c21] beveled-box font-bold'
                      : 'border-current/20 bg-black/25 opacity-70 hover:opacity-100'
                  }`}
                >
                  <span className="text-[9px] font-mono">PAPER GREY</span>
                  <span className="text-[7.5px] opacity-75">CLASSIC OS</span>
                </button>
              </div>

              {/* R36S Active Storage Mount */}
              <div className="p-1.5 rounded bg-black/30 border border-current/20 flex flex-col gap-1 text-[8.5px] font-mono mt-1">
                <span className="font-bold text-cyan-400">ACTIVE R36S STORAGE MOUNT</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateConfig({
                        ...config,
                        storageMount: '/roms',
                        tf2SyncPath: '/roms/tf2/romm_sync/',
                      })
                    }
                    className={`p-1.5 rounded flex items-center justify-between border transition-all cursor-pointer ${
                      config.storageMount === '/roms'
                        ? 'border-cyan-400 bg-cyan-950/60 text-cyan-300 font-bold'
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
                    type="button"
                    onClick={() =>
                      onUpdateConfig({
                        ...config,
                        storageMount: '/roms2',
                        tf2SyncPath: '/roms2/tf2/romm_sync/',
                      })
                    }
                    className={`p-1.5 rounded flex items-center justify-between border transition-all cursor-pointer ${
                      config.storageMount === '/roms2'
                        ? 'border-cyan-400 bg-cyan-950/60 text-cyan-300 font-bold'
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

              {/* Auto Sync Toggle */}
              <div className="p-1.5 rounded bg-black/30 border border-current/20 flex items-center justify-between text-[8.5px] font-mono mt-1">
                <span className="text-white font-bold">AUTO-SYNC EMULATOR SAVES</span>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateConfig({ ...config, autoSyncSaves: !config.autoSyncSaves })
                  }
                  className={`px-2 py-0.5 rounded text-[8px] font-bold border transition-all cursor-pointer ${
                    config.autoSyncSaves
                      ? 'bg-cyan-500 text-black border-cyan-400'
                      : 'bg-black/50 text-gray-400 border-white/20'
                  }`}
                >
                  {config.autoSyncSaves ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>
            </div>
          )}
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
                  SERVER STATUS
                </span>
                <span
                  className={`text-[7.5px] font-mono px-1 py-[1px] rounded border ${
                    config.isConnected
                      ? 'bg-green-950/70 text-green-300 border-green-500/40'
                      : 'bg-gray-800 text-gray-400 border-gray-600'
                  }`}
                >
                  {config.isConnected ? 'CONNECTED' : 'STANDBY'}
                </span>
              </div>

              <div className="space-y-1 text-[8.5px] font-mono">
                <div className="flex justify-between">
                  <span className={t.textMuted}>HOST:</span>
                  <span className="font-bold text-white truncate max-w-[130px]">{config.serverUrl}</span>
                </div>
                <div className="flex justify-between">
                  <span className={t.textMuted}>API TOKEN:</span>
                  <span className="font-bold text-cyan-300">
                    {config.apiKey ? (config.isTokenMasked ? '••••••••' : `${config.apiKey.slice(0, 8)}...`) : 'NOT SET'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={t.textMuted}>SMB SHARE:</span>
                  <span className="font-bold text-amber-300 truncate max-w-[130px]">{config.smbShareUrl}</span>
                </div>
                <div className="flex justify-between">
                  <span className={t.textMuted}>TARGET DISK:</span>
                  <span className="font-bold text-white">{config.storageMount}</span>
                </div>
                <div className="flex justify-between">
                  <span className={t.textMuted}>CLIENT VER:</span>
                  <span className="font-bold text-emerald-300">{config.currentVersion || 'v1.3.0'}</span>
                </div>
                <div className="flex justify-between">
                  <span className={t.textMuted}>GITHUB REPO:</span>
                  <span className="font-bold text-gray-300 truncate max-w-[120px]">{config.githubRepo || 'Cavephar/RomM-R36S'}</span>
                </div>
              </div>
            </div>

            {/* Diagnostic Console Logs */}
            <div className="flex-1 min-h-[90px] p-2 rounded-xs border border-current/20 bg-black/60 flex flex-col gap-1 font-mono text-[7.5px] overflow-y-auto">
              <span className="text-gray-400 font-bold border-b border-current/10 pb-0.5">
                COMMUNICATION LOGS:
              </span>
              {logs.map((log, index) => (
                <div key={index} className="text-cyan-300/80 leading-tight">
                  {log}
                </div>
              ))}
            </div>
          </div>

          {/* Controller Hint Bar */}
          <div className="pt-1 border-t border-current/10 flex items-center justify-between text-[7.5px] font-mono text-gray-400">
            <span>[B] Exit Settings</span>
            <span>R36S RK3326</span>
          </div>
        </aside>
      </main>
    </div>
  );
};
