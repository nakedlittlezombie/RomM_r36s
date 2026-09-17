/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  GameRom,
  PlatformId,
  ActiveScreen,
  ServerConfig,
  DownloadTask,
  CloudSaveEvent,
  SmbFileItem,
  StorageMount,
} from './types';
import {
  INITIAL_GAMES,
  INITIAL_SERVER_CONFIG,
  INITIAL_DOWNLOADS,
  INITIAL_SAVE_EVENTS,
} from './mockData';
import { loadSavedConfig, saveConfig, loadSavedGames, saveGames } from './storage';
import { fetchRommLibrary } from './services/rommApi';
import { getThemeStyles } from './themeStyles';
import { TopStatusBar } from './components/TopStatusBar';
import { PlatformBar } from './components/PlatformBar';
import { LibraryView } from './components/LibraryView';
import { SyncStorageView } from './components/SyncStorageView';
import { SettingsView } from './components/SettingsView';
import { SmbBrowserModal } from './components/SmbBrowserModal';
import { MetadataModal } from './components/MetadataModal';
import { ControllerLegendBar } from './components/ControllerLegendBar';
import { VirtualGamepad } from './components/VirtualGamepad';
import { ExitModal } from './components/ExitModal';
import { EmulationStationSplash } from './components/EmulationStationSplash';

export default function App() {
  const [games, setGames] = useState<GameRom[]>(loadSavedGames);
  const [currentPlatform, setCurrentPlatform] = useState<PlatformId>('snes');
  const [filterMode, setFilterMode] = useState<'all' | 'installed' | 'cloud' | 'favorites'>('all');
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('library');
  const [config, setConfig] = useState<ServerConfig>(loadSavedConfig);
  const [downloadTasks, setDownloadTasks] = useState<DownloadTask[]>(INITIAL_DOWNLOADS);
  const [saveEvents, setSaveEvents] = useState<CloudSaveEvent[]>(INITIAL_SAVE_EVENTS);
  const [isFetchingLibrary, setIsFetchingLibrary] = useState(false);

  // Modals, views & exit state
  const [isSmbOpen, setIsSmbOpen] = useState(false);
  const [isMetadataOpen, setIsMetadataOpen] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [isExited, setIsExited] = useState(false);
  const [showChassis, setShowChassis] = useState(true);
  const [showGamepad, setShowGamepad] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Selected game within current filtered list
  const [selectedGameId, setSelectedGameId] = useState<string>('snes-smw2');

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 3000);
  };

  // Sync config changes to localStorage
  const handleUpdateConfig = (newCfg: ServerConfig) => {
    setConfig(newCfg);
    saveConfig(newCfg);
  };

  // Fetch real library from RomM
  const handleFetchRommLibrary = async () => {
    setIsFetchingLibrary(true);
    showToast('Connecting to RomM & querying library...');
    try {
      const result = await fetchRommLibrary(config);
      if (result.games.length > 0) {
        setGames(result.games);
        saveGames(result.games);
        const updatedCfg = { ...config, isConnected: true, isDemoMode: false };
        setConfig(updatedCfg);
        saveConfig(updatedCfg);
        showToast(`Synced ${result.games.length} ROMs from RomM server!`);
        if (result.games[0]) {
          setSelectedGameId(result.games[0].id);
          setCurrentPlatform(result.games[0].platform);
        }
      } else {
        showToast('Connected to RomM! 0 ROMs found on server.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`Fetch failed: ${msg}`);
    } finally {
      setIsFetchingLibrary(false);
    }
  };

  // Clear demo data
  const handleClearDemoData = () => {
    setGames([]);
    saveGames([]);
    const updatedCfg = { ...config, isDemoMode: false };
    setConfig(updatedCfg);
    saveConfig(updatedCfg);
    showToast('Demo games cleared. Configure your RomM server.');
  };

  // Filter games based on current platform & filterMode
  const filteredGames = useMemo(() => {
    return games.filter((g) => {
      if (g.platform !== currentPlatform) return false;
      if (filterMode === 'installed') return g.status === 'installed';
      if (filterMode === 'cloud') return g.status === 'cloud';
      if (filterMode === 'favorites') return g.isFavorite;
      return true;
    });
  }, [games, currentPlatform, filterMode]);

  // Selected index & object
  const selectedIndex = useMemo(() => {
    const idx = filteredGames.findIndex((g) => g.id === selectedGameId);
    return idx >= 0 ? idx : 0;
  }, [filteredGames, selectedGameId]);

  const selectedGame = useMemo(() => {
    return filteredGames[selectedIndex] || filteredGames[0] || null;
  }, [filteredGames, selectedIndex]);

  // Dynamic game counts per platform calculated from actual games state
  const gameCounts = useMemo(() => {
    const counts: Record<PlatformId, { total: number; local: number; cloud: number }> = {
      snes: { total: 0, local: 0, cloud: 0 },
      gba: { total: 0, local: 0, cloud: 0 },
      ps1: { total: 0, local: 0, cloud: 0 },
      n64: { total: 0, local: 0, cloud: 0 },
      genesis: { total: 0, local: 0, cloud: 0 },
      arcade: { total: 0, local: 0, cloud: 0 },
    };
    games.forEach((g) => {
      if (counts[g.platform]) {
        counts[g.platform].total += 1;
        if (g.status === 'installed') {
          counts[g.platform].local += 1;
        } else {
          counts[g.platform].cloud += 1;
        }
      }
    });
    return counts;
  }, [games]);

  // Platform navigation
  const platformsList: PlatformId[] = ['snes', 'gba', 'ps1', 'n64', 'genesis', 'arcade'];
  const handlePrevPlatform = useCallback(() => {
    const idx = platformsList.indexOf(currentPlatform);
    const prevIdx = idx > 0 ? idx - 1 : platformsList.length - 1;
    setCurrentPlatform(platformsList[prevIdx]);
  }, [currentPlatform]);

  const handleNextPlatform = useCallback(() => {
    const idx = platformsList.indexOf(currentPlatform);
    const nextIdx = idx < platformsList.length - 1 ? idx + 1 : 0;
    setCurrentPlatform(platformsList[nextIdx]);
  }, [currentPlatform]);

  const handleToggleFilter = useCallback(() => {
    setFilterMode((curr) => {
      if (curr === 'all') return 'installed';
      if (curr === 'installed') return 'cloud';
      if (curr === 'cloud') return 'favorites';
      return 'all';
    });
  }, []);

  // Storage mount switcher between /roms and /roms2
  const handleToggleStorageMount = useCallback(() => {
    setConfig((prev) => {
      const nextMount: StorageMount = prev.storageMount === '/roms2' ? '/roms' : '/roms2';
      showToast(
        `Active storage switched: ${nextMount} (${
          nextMount === '/roms2' ? 'TF2 Secondary SD Card' : 'TF1 Internal SD Card'
        })`
      );
      return {
        ...prev,
        storageMount: nextMount,
        tf2SyncPath: `${nextMount}/tf2/romm_sync/`,
      };
    });
  }, []);

  // Actions
  const handleDownloadGame = useCallback(
    (game: GameRom) => {
      const isReDownload = game.status === 'installed';
      const mount = config.storageMount;
      showToast(
        isReDownload
          ? `Re-downloading ${game.title} to ${mount}/${game.platform}/...`
          : `Downloading ${game.title} to ${mount}/${game.platform}/ (from RomM)...`
      );
      // Update game status
      setGames((prev) =>
        prev.map((g) =>
          g.id === game.id ? { ...g, status: 'downloading', downloadProgress: 10 } : g
        )
      );

      // Add to download queue
      const newTask: DownloadTask = {
        id: `dl-${Date.now()}`,
        romId: game.id,
        title: game.title,
        platform: game.platform,
        size: game.size,
        currentBytes: 100000,
        totalBytes: game.sizeBytes,
        progress: 10,
        speed: '3.6 MB/s',
        eta: '45s',
        status: 'downloading',
      };
      setDownloadTasks((prev) => [newTask, ...prev]);

      // Simulate completion progress
      let currentProg = 10;
      const interval = setInterval(() => {
        currentProg += 20;
        if (currentProg >= 100) {
          clearInterval(interval);
          setGames((prev) =>
            prev.map((g) =>
              g.id === game.id
                ? {
                    ...g,
                    status: 'installed',
                    downloadProgress: 100,
                    lastSaveSync: 'Just now',
                  }
                : g
            )
          );
          setDownloadTasks((prev) =>
            prev.map((t) =>
              t.romId === game.id ? { ...t, progress: 100, status: 'done', speed: 'Done' } : t
            )
          );
          showToast(`✓ Completed download: ${game.title} saved to ${mount}/${game.platform}/!`);
        } else {
          setGames((prev) =>
            prev.map((g) =>
              g.id === game.id ? { ...g, downloadProgress: currentProg } : g
            )
          );
          setDownloadTasks((prev) =>
            prev.map((t) =>
              t.romId === game.id ? { ...t, progress: currentProg } : t
            )
          );
        }
      }, 700);
    },
    [config.storageMount]
  );

  const handleSyncSave = useCallback(
    (game: GameRom) => {
      showToast(`Synchronizing save state for ${game.title} with RomM Cloud...`);
      setGames((prev) =>
        prev.map((g) =>
          g.id === game.id
            ? { ...g, saveSyncStatus: 'synced', lastSaveSync: 'Just now' }
            : g
        )
      );

      const newEvent: CloudSaveEvent = {
        id: `ev-${Date.now()}`,
        gameTitle: `${game.title} (${game.saveSlot})`,
        platform: game.platform,
        slot: game.saveSlot,
        timeAgo: 'Just now',
        direction: 'bidirectional',
        crc32: `#${game.crc32.substring(0, 6)}`,
        status: 'synced',
        details: 'RomM Cloud <=> SD2/saves (Slot 01 OK)',
      };
      setSaveEvents((prev) => [newEvent, ...prev]);
      setTimeout(() => {
        showToast(`✓ Cloud Save in sync: ${game.title} (Slot 01)`);
      }, 800);
    },
    []
  );

  const handleToggleFavorite = useCallback(
    (game: GameRom) => {
      setGames((prev) =>
        prev.map((g) => (g.id === game.id ? { ...g, isFavorite: !g.isFavorite } : g))
      );
      showToast(
        game.isFavorite
          ? `Removed ${game.title} from favorites`
          : `Added ${game.title} to favorites ★`
      );
    },
    []
  );

  const handleImportSmbRom = useCallback((file: SmbFileItem) => {
    showToast(`Transferring ${file.name} from SMB to TF2...`);
    const newId = `imported-${Date.now()}`;
    const newGame: GameRom = {
      id: newId,
      title: file.name.replace(/\.[^/.]+$/, ''),
      subtitle: 'Imported via SMB Samba Share',
      platform: file.platform || 'snes',
      releaseYear: 1996,
      developer: 'Network Share',
      publisher: 'Samba Host',
      size: file.size || '2.0M',
      sizeBytes: 2097152,
      status: 'installed',
      rating: 4.8,
      isFavorite: false,
      crc32: 'A1B2C3D4',
      region: 'USA',
      core: 'Snes9x 2010',
      saveSyncStatus: 'synced',
      lastSaveSync: 'Just now',
      saveSlot: 'Slot #01',
      playtime: '0h 00m',
      description: `Imported directly from SMB path ${file.path}. Auto-scraped metadata and box cover loaded.`,
      coverUrl:
        'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
      romFileName: file.name,
      smbPath: file.path,
    };
    setGames((prev) => [newGame, ...prev]);
    setSelectedGameId(newId);
    showToast(`✓ ${file.name} installed to /roms/${newGame.platform}`);
  }, []);

  const handleTestPing = useCallback(() => {
    const lat = Math.floor(10 + Math.random() * 8);
    setConfig((curr) => ({ ...curr, pingMs: lat }));
    showToast(`RomM Server live ping: ${lat}ms (Host OK)`);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      // If exit confirmation is open
      if (isExitModalOpen) {
        if (e.key === 'Enter' || e.key === 'a' || e.key === 'A') {
          e.preventDefault();
          setIsExitModalOpen(false);
          setIsExited(true);
          showToast('RomM Client exited to EmulationStation');
          return;
        }
        if (e.key === 'Escape' || e.key === 'Backspace' || e.key === 'b' || e.key === 'B') {
          e.preventDefault();
          setIsExitModalOpen(false);
          return;
        }
      }

      // If in exited standby mode, press A to relaunch
      if (isExited) {
        if (e.key === 'Enter' || e.key === 'a' || e.key === 'A') {
          e.preventDefault();
          setIsExited(false);
          showToast('RomM Client resumed');
          return;
        }
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (selectedIndex < filteredGames.length - 1) {
          setSelectedGameId(filteredGames[selectedIndex + 1].id);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (selectedIndex > 0) {
          setSelectedGameId(filteredGames[selectedIndex - 1].id);
        }
      } else if (e.key === 'ArrowLeft' || e.key === '[' || e.key === 'PageUp') {
        e.preventDefault();
        handlePrevPlatform();
      } else if (e.key === 'ArrowRight' || e.key === ']' || e.key === 'PageDown') {
        e.preventDefault();
        handleNextPlatform();
      } else if (e.key === 'Enter' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        if (selectedGame && activeScreen === 'library') {
          handleDownloadGame(selectedGame);
        }
      } else if (e.key === 'Escape' || e.key === 'Backspace' || e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        if (isMetadataOpen) {
          setIsMetadataOpen(false);
        } else if (isSmbOpen) {
          setIsSmbOpen(false);
        } else if (activeScreen !== 'library') {
          setActiveScreen('library');
        }
      } else if (e.key === 'x' || e.key === 'X') {
        e.preventDefault();
        if (selectedGame && activeScreen === 'library') {
          handleSyncSave(selectedGame);
        } else if (activeScreen === 'settings') {
          handleTestPing();
        }
      } else if (e.key === 'y' || e.key === 'Y') {
        e.preventDefault();
        if (selectedGame && activeScreen === 'library') {
          handleToggleFavorite(selectedGame);
        } else if (activeScreen === 'settings') {
          setConfig((curr) => ({ ...curr, isTokenMasked: !curr.isTokenMasked }));
        }
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        setActiveScreen((curr) => (curr === 'settings' ? 'library' : 'settings'));
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        handleToggleFilter();
      } else if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault();
        setIsExitModalOpen(true);
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        handleToggleStorageMount();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedIndex,
    filteredGames,
    selectedGame,
    activeScreen,
    isMetadataOpen,
    isSmbOpen,
    isExitModalOpen,
    isExited,
    handlePrevPlatform,
    handleNextPlatform,
    handleDownloadGame,
    handleSyncSave,
    handleToggleFavorite,
    handleTestPing,
    handleToggleFilter,
    handleToggleStorageMount,
  ]);

  const t = getThemeStyles(config.theme);

  return (
    <div
      className={`min-h-screen ${t.rootBg} flex flex-col items-center justify-center p-0 md:p-3 transition-colors`}
    >
      {/* Toast Notification Banner */}
      {notification && (
        <div
          className={`fixed top-2 z-50 px-3 py-1.5 rounded border text-[10px] font-mono font-bold shadow-xl transition-all ${
            config.theme === 'amber'
              ? 'bg-[#191208] border-[#ffb000] text-[#ffd597] amber-box-glow'
              : config.theme === 'paper'
              ? 'bg-white border-[#2b6cb0] text-[#171c21] beveled-box'
              : 'bg-[#090e16] border-[#00e5ff] text-[#00e5ff] neon-focus-glow'
          }`}
        >
          {notification}
        </div>
      )}

      {/* R36S Handheld 4:3 640x480 Hardware Chassis Canvas */}
      <div
        className={`w-full ${
          showChassis ? 'max-w-[640px] h-[480px]' : 'max-w-[960px] min-h-[580px] h-[85vh]'
        } ${t.canvasBg} ${t.canvasBorder} ${
          t.scanlines ? 'crt-overlay' : ''
        } flex flex-col justify-between border-2 shadow-2xl relative overflow-hidden transition-all`}
      >
        {isExited ? (
          /* EmulationStation / dArkOS Exited Screen */
          <EmulationStationSplash
            storageMount={config.storageMount}
            onRelaunch={() => {
              setIsExited(false);
              showToast('RomM Client resumed');
            }}
            theme={config.theme}
          />
        ) : (
          <>
            {/* 1. Top OS Status Bar */}
            <TopStatusBar
              config={config}
              activeScreen={activeScreen}
              onNavigate={setActiveScreen}
              showChassis={showChassis}
              onToggleChassis={() => setShowChassis(!showChassis)}
              showGamepad={showGamepad}
              onToggleGamepad={() => setShowGamepad(!showGamepad)}
              onExit={() => setIsExitModalOpen(true)}
              onToggleStorageMount={handleToggleStorageMount}
            />

            {/* 2. Platform Selector Bar (visible in library view) */}
            {activeScreen === 'library' && (
              <PlatformBar
                currentPlatform={currentPlatform}
                onSelectPlatform={(plat) => {
                  setCurrentPlatform(plat);
                  const firstInPlat = games.find((g) => g.platform === plat);
                  if (firstInPlat) setSelectedGameId(firstInPlat.id);
                }}
                onPrevPlatform={handlePrevPlatform}
                onNextPlatform={handleNextPlatform}
                filterMode={filterMode}
                onToggleFilter={handleToggleFilter}
                gameCounts={gameCounts}
                theme={config.theme}
                onOpenSmb={() => setIsSmbOpen(true)}
                storageMount={config.storageMount}
                onToggleStorageMount={handleToggleStorageMount}
              />
            )}

            {/* 3. Screen View Switcher */}
            {activeScreen === 'library' && (
              <LibraryView
                games={filteredGames}
                selectedGame={selectedGame}
                selectedIndex={selectedIndex}
                onSelectGame={(g) => setSelectedGameId(g.id)}
                onDownloadGame={handleDownloadGame}
                onSyncSave={handleSyncSave}
                onToggleFavorite={handleToggleFavorite}
                onOpenMetadata={() => setIsMetadataOpen(true)}
                theme={config.theme}
                storageMount={config.storageMount}
              />
            )}

            {activeScreen === 'sync' && (
              <SyncStorageView
                tasks={downloadTasks}
                events={saveEvents}
                config={config}
                onUpdateConfig={setConfig}
                onPauseTask={(id) => {
                  setDownloadTasks((prev) =>
                    prev.map((t) => (t.id === id ? { ...t, status: 'paused', speed: 'Paused' } : t))
                  );
                  showToast('Download paused');
                }}
                onResumeTask={(id) => {
                  setDownloadTasks((prev) =>
                    prev.map((t) =>
                      t.id === id ? { ...t, status: 'downloading', speed: '4.2 MB/s' } : t
                    )
                  );
                  showToast('Download resumed');
                }}
                onCancelTask={(id) => {
                  setDownloadTasks((prev) => prev.filter((t) => t.id !== id));
                  showToast('Download cancelled');
                }}
                onClearDone={() => {
                  setDownloadTasks((prev) => prev.filter((t) => t.status !== 'done'));
                  showToast('Cleared completed download tasks');
                }}
                onTriggerSaveSync={() => {
                  if (selectedGame) handleSyncSave(selectedGame);
                }}
                onBack={() => setActiveScreen('library')}
                theme={config.theme}
              />
            )}

            {activeScreen === 'settings' && (
              <SettingsView
                config={config}
                onUpdateConfig={handleUpdateConfig}
                onTestPing={handleTestPing}
                onOpenSmb={() => setIsSmbOpen(true)}
                onBack={() => setActiveScreen('library')}
                theme={config.theme}
                onFetchRommLibrary={handleFetchRommLibrary}
                isFetchingLibrary={isFetchingLibrary}
                onClearDemoData={handleClearDemoData}
                isDemoMode={config.isDemoMode ?? true}
              />
            )}

            {/* 4. Bottom Controller Legend Bar */}
            <ControllerLegendBar
              onActionA={() => {
                if (activeScreen === 'library' && selectedGame) {
                  handleDownloadGame(selectedGame);
                }
              }}
              onActionB={() => {
                if (activeScreen !== 'library') {
                  setActiveScreen('library');
                }
              }}
              onActionX={() => {
                if (activeScreen === 'library' && selectedGame) {
                  handleSyncSave(selectedGame);
                } else if (activeScreen === 'settings') {
                  handleTestPing();
                }
              }}
              onActionY={() => {
                if (activeScreen === 'library' && selectedGame) {
                  handleToggleFavorite(selectedGame);
                } else if (activeScreen === 'settings') {
                  setConfig((curr) => ({ ...curr, isTokenMasked: !curr.isTokenMasked }));
                }
              }}
              onSelect={handleToggleFilter}
              onStart={() =>
                setActiveScreen((curr) => (curr === 'settings' ? 'library' : 'settings'))
              }
              onExit={() => setIsExitModalOpen(true)}
              labelA={
                activeScreen === 'library'
                  ? selectedGame?.status === 'installed'
                    ? 'Re-Download'
                    : 'Download'
                  : 'Select'
              }
              labelB={activeScreen === 'library' ? 'Back' : 'Library'}
              labelX={activeScreen === 'settings' ? 'Ping' : 'Sync Saves'}
              labelY={activeScreen === 'settings' ? 'Unmask' : 'Favorite'}
              theme={config.theme}
            />
          </>
        )}
      </div>

      {/* 5. Optional Virtual Gamepad Controller for Handheld Touch Simulation */}
      {showGamepad && !isExited && (
        <VirtualGamepad
          onUp={() => {
            if (selectedIndex > 0) setSelectedGameId(filteredGames[selectedIndex - 1].id);
          }}
          onDown={() => {
            if (selectedIndex < filteredGames.length - 1)
              setSelectedGameId(filteredGames[selectedIndex + 1].id);
          }}
          onLeft={handlePrevPlatform}
          onRight={handleNextPlatform}
          onA={() => {
            if (activeScreen === 'library' && selectedGame) handleDownloadGame(selectedGame);
          }}
          onB={() => {
            if (activeScreen !== 'library') setActiveScreen('library');
          }}
          onX={() => {
            if (activeScreen === 'library' && selectedGame) handleSyncSave(selectedGame);
            else if (activeScreen === 'settings') handleTestPing();
          }}
          onY={() => {
            if (activeScreen === 'library' && selectedGame) handleToggleFavorite(selectedGame);
            else if (activeScreen === 'settings')
              setConfig((curr) => ({ ...curr, isTokenMasked: !curr.isTokenMasked }));
          }}
          onL1={handlePrevPlatform}
          onR1={handleNextPlatform}
          onSelect={handleToggleFilter}
          onStart={() =>
            setActiveScreen((curr) => (curr === 'settings' ? 'library' : 'settings'))
          }
          theme={config.theme}
        />
      )}

      {/* 6. SMB Share Network Browser Modal */}
      <SmbBrowserModal
        isOpen={isSmbOpen}
        onClose={() => setIsSmbOpen(false)}
        onImportRom={handleImportSmbRom}
        theme={config.theme}
        config={config}
      />

      {/* 7. Game Metadata & Cover Scraper Modal */}
      <MetadataModal
        game={selectedGame}
        isOpen={isMetadataOpen}
        onClose={() => setIsMetadataOpen(false)}
        onUpdateGame={(updated) => {
          setGames((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
        }}
        theme={config.theme}
      />

      {/* 8. Exit Application Confirmation Modal */}
      <ExitModal
        isOpen={isExitModalOpen}
        storageMount={config.storageMount}
        onConfirmExit={() => {
          setIsExitModalOpen(false);
          setIsExited(true);
          showToast('RomM Client exited to EmulationStation');
        }}
        onCancel={() => setIsExitModalOpen(false)}
        theme={config.theme}
      />
    </div>
  );
}
