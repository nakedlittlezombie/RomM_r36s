import React, { useRef, useEffect } from 'react';
import { GameRom, ThemeMode, StorageMount } from '../types';
import { getThemeStyles } from '../themeStyles';

interface LibraryViewProps {
  games: GameRom[];
  selectedGame: GameRom | null;
  selectedIndex: number;
  onSelectGame: (game: GameRom, index: number) => void;
  onDownloadGame: (game: GameRom) => void;
  onSyncSave: (game: GameRom) => void;
  onToggleFavorite: (game: GameRom) => void;
  onOpenMetadata: (game: GameRom) => void;
  theme: ThemeMode;
  storageMount: StorageMount;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  games,
  selectedGame,
  selectedIndex,
  onSelectGame,
  onDownloadGame,
  onSyncSave,
  onToggleFavorite,
  onOpenMetadata,
  theme,
  storageMount,
}) => {
  const t = getThemeStyles(theme);
  const listContainerRef = useRef<HTMLDivElement>(null);

  // Auto scroll into view when selectedIndex changes
  useEffect(() => {
    if (!listContainerRef.current) return;
    const activeEl = listContainerRef.current.querySelector('[data-selected="true"]');
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  // If theme is amber, use the vintage phosphor CRT Mario boxart hotlink
  // If cyan, use the vibrant colorful Yoshi boxart hotlink
  // If paper, use the 16-bit paper grey Yoshi boxart hotlink
  const getCoverArt = (game: GameRom) => {
    if (game.id === 'snes-smw2') {
      if (theme === 'amber') {
        return 'https://lh3.googleusercontent.com/aida-public/AB6AXuBehd10xY_I80_6k83UOxzHV-gvMW_gz_ZOxnJTvX6tjVmNDsn8ZvLMUV5dvkRNch02GaXOJEIVZrGVXJauVSDpf5VIE9ue_EWiC7NgNlcfUBfA8MxkWjTJ4SwSCDXk2tDg86JkrJfAF9xFavOH4I3J0moPC_f2iZLqWw4uLOcf35WqytdxDQ8cO0_uQ_B63mANB4Dz6LdbT38CB35bVTmlIxOvH5RZRUNs-95X1OwPR8u6Me8RK_wk';
      }
      if (theme === 'paper') {
        return 'https://lh3.googleusercontent.com/aida-public/AB6AXuBaH4LZrIsuhp2heK8t6dCMFQs6iIyx85ECYgEjMlbvvyrAfpocSM_tNBW_Q77h3qRLhKpNhT9L97nMhwOe1Ol4K9q6PSXjLQ0-zIo-OyeKWK-zNxPpNAmL_cWMX8J61JbYiOpKahgnGuLkUlvpJbj8VLSDkPry_7Gf2mK_GrESLNq66lJsLuu9h0MTMst-smnyLILiep7IFv5VgB9uVJ9I0RrjRVQNzq8cSs5uxwGlxpEVk1sR97gs';
      }
      return 'https://lh3.googleusercontent.com/aida-public/AB6AXuCx4rNG2741jVq5MlH9RjSIU1jWXJR8YTIcPga3rGUf7R8kJ3L5jDJYhwC2y6Y1RYIUzY0gSDw1MQ4D9IHFhkOrkC5rherM3DMxW7mMR4_3wXWr1_VuzvWavKzktsRnMi2mpM8E8vZTVRfNsKmeSX0JOqXNZhp78-N5jkirO8x89rV0_JgIgwYpyFt-ZJ47GFbMS4krltGKkiqJ7M8ovZ3BTO6riRxai1Rm4QevSR5_ljZWNj8lKK-S';
    }
    return game.coverUrl;
  };

  return (
    <div id="library-view" className="w-full flex-1 grid grid-cols-12 overflow-hidden select-none">
      {/* LEFT COLUMN: Directory & ROM Roster (~58% -> col-span-7) */}
      <div
        className={`col-span-7 border-r ${t.cardBorder} flex flex-col justify-between overflow-hidden ${
          theme === 'paper' ? 'bg-[#f6faff]' : theme === 'amber' ? 'bg-[#130d05]' : 'bg-[#0f141c]'
        }`}
      >
        {/* Terminal Header */}
        <div
          className={`h-6 px-2 flex items-center justify-between border-b ${t.headerBorder} text-[9px] font-mono shrink-0 ${
            theme === 'paper' ? 'bg-[#e4e9ef]' : theme === 'amber' ? 'bg-[#211a10]' : 'bg-[#171c24]'
          }`}
        >
          <span className={`font-bold ${t.textPrimary} flex items-center gap-1`}>
            <span className={theme === 'amber' ? 'text-[#ffb000]' : 'text-cyan-400'}>&gt;</span>
            /roms/{selectedGame?.platform || 'snes'}/
          </span>
          <span className={t.textMuted}>
            {games.length} ITEMS • D-PAD: [↑/↓]
          </span>
        </div>

        {/* Scrollable Game Rows */}
        <div
          ref={listContainerRef}
          className="flex-1 overflow-y-auto overflow-x-hidden divide-y divide-current/10 p-1 space-y-1"
        >
          {games.length === 0 ? (
            <div className={`p-4 text-center text-[11px] ${t.textMuted} font-mono`}>
              No games found matching filter criteria.
            </div>
          ) : (
            games.map((game, idx) => {
              const isSelected = selectedGame?.id === game.id;

              // Downloading row representation
              if (game.status === 'downloading') {
                return (
                  <div
                    key={game.id}
                    data-selected={isSelected}
                    onClick={() => onSelectGame(game, idx)}
                    className={`p-1.5 rounded transition-all cursor-pointer ${
                      isSelected
                        ? t.activeRowClass
                        : `${t.cardBg} border ${t.cardBorder} ${t.normalRowClass}`
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <span className="material-symbols-outlined text-[13px] text-amber-400 animate-spin">
                          downloading
                        </span>
                        <div className="truncate">
                          <div className="text-[11px] font-bold truncate leading-tight">
                            {game.title}
                          </div>
                          <div className={`text-[8.5px] font-mono ${t.textMuted} leading-none mt-0.5`}>
                            {game.releaseYear} • {game.developer}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end shrink-0 ml-1">
                        <span className="text-[9px] font-bold font-mono text-amber-400">
                          {game.downloadProgress || 68}%
                        </span>
                        <span className={`text-[7.5px] font-mono ${t.textMuted}`}>
                          {game.downloadSpeed || '1.2MB/s'}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-black/40 h-1.5 mt-1 border border-current/20 rounded-xs overflow-hidden">
                      <div
                        className="bg-amber-400 h-full transition-all duration-300"
                        style={{ width: `${game.downloadProgress || 68}%` }}
                      ></div>
                    </div>
                  </div>
                );
              }

              // Standard Game Row (Installed / Cloud)
              return (
                <div
                  key={game.id}
                  data-selected={isSelected}
                  onClick={() => onSelectGame(game, idx)}
                  className={`px-2 py-1.5 rounded transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? t.activeRowClass
                      : `${t.cardBg} border border-transparent ${t.normalRowClass}`
                  }`}
                >
                  <div className="flex items-center gap-1.5 overflow-hidden min-w-0 pr-1">
                    {/* Focus indicator */}
                    {isSelected && (
                      <span
                        className={`text-[12px] font-bold leading-none ${
                          theme === 'amber' ? 'text-[#ffb000] cursor-blink' : 'text-cyan-400'
                        }`}
                      >
                        {theme === 'amber' ? '█' : '▶'}
                      </span>
                    )}

                    {/* Star favorite */}
                    {game.isFavorite && (
                      <span className="material-symbols-outlined text-[12px] text-amber-400 shrink-0">
                        star
                      </span>
                    )}

                    {/* Title and details */}
                    <div className="truncate">
                      <div
                        className={`text-[11px] font-bold truncate leading-tight ${
                          isSelected && theme === 'amber' ? 'amber-glow' : ''
                        }`}
                      >
                        {game.title}
                      </div>
                      <div className={`text-[8.5px] font-mono ${t.textMuted} leading-none mt-0.5 truncate`}>
                        {game.releaseYear} · {game.developer}
                      </div>
                    </div>
                  </div>

                  {/* Right Tags (Status & Size) */}
                  <div className="flex items-center gap-1 shrink-0">
                    <span className={`text-[9px] font-mono ${isSelected ? 'font-bold' : t.textMuted}`}>
                      {game.size}
                    </span>

                    {game.status === 'installed' ? (
                      <span
                        className={`px-1 py-[1px] rounded text-[7.5px] font-bold uppercase tracking-wider ${
                          theme === 'amber'
                            ? 'border border-[#ffd597] text-[#ffd597]'
                            : theme === 'paper'
                            ? 'bg-[#dee3e9] text-[#171c21] border border-[#b0b9c3]'
                            : 'bg-[#00ff88]/15 text-[#00ff88] border border-[#00ff88]/40'
                        }`}
                      >
                        {theme === 'amber' ? 'SD' : 'SD CARD'}
                      </span>
                    ) : (
                      <span
                        className={`px-1 py-[1px] rounded text-[7.5px] font-bold uppercase tracking-wider ${
                          theme === 'amber'
                            ? 'text-[#805800]'
                            : theme === 'paper'
                            ? 'bg-[#d5e0f7] text-[#2b6cb0]'
                            : 'bg-white/10 text-[#849396] border border-white/20'
                        }`}
                      >
                        [CLOUD]
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Index Indicator */}
        <div
          className={`h-5 px-2 flex items-center justify-between border-t ${t.headerBorder} text-[8px] font-mono ${t.textMuted} shrink-0 ${
            theme === 'paper' ? 'bg-[#dee3e9]' : theme === 'amber' ? 'bg-[#191208]' : 'bg-[#090e16]'
          }`}
        >
          <span>
            INDEX: {String(selectedIndex + 1).padStart(3, '0')}/{String(games.length).padStart(3, '0')}
          </span>
          <span>D-PAD: NAVIGATE</span>
          <span>SORT: ALPHA [A-Z]</span>
        </div>
      </div>

      {/* RIGHT COLUMN: Detail Pane & Box Art Preview (~42% -> col-span-5) */}
      <div
        className={`col-span-5 flex flex-col justify-between p-2 overflow-hidden ${
          theme === 'paper' ? 'bg-[#eff4fa]' : theme === 'amber' ? 'bg-[#130d05]' : 'bg-[#171c24]'
        }`}
      >
        {selectedGame ? (
          <div className="flex flex-col gap-1 overflow-hidden">
            {/* Box Art Container with Authentic Frame */}
            <div
              className={`w-full aspect-[4/3] max-h-[140px] border-2 relative overflow-hidden flex items-center justify-center p-1 rounded-xs ${
                theme === 'amber'
                  ? 'border-[#ffb000] bg-[#1a1208] amber-box-glow'
                  : theme === 'paper'
                  ? 'border-[#b0b9c3] bg-white beveled-box'
                  : 'border-[#00e5ff] bg-[#090e16] neon-focus-glow'
              }`}
            >
              <img
                src={getCoverArt(selectedGame)}
                alt={selectedGame.title}
                className={`w-full h-full object-cover pixel-crisp ${
                  theme === 'amber'
                    ? 'grayscale contrast-125 brightness-95 sepia-[0.8] hue-rotate-[-10deg]'
                    : ''
                }`}
                referrerPolicy="no-referrer"
              />

              {/* Floating Badges */}
              <div className="absolute top-1 left-1 bg-black/80 text-white px-1 py-[1px] border border-white/20 text-[7px] font-mono uppercase font-bold">
                CRC32: {selectedGame.crc32}
              </div>

              <div
                className={`absolute bottom-1 right-1 px-1 py-[1px] text-[7.5px] font-bold uppercase rounded-xs ${
                  theme === 'amber'
                    ? 'bg-[#ffb000] text-[#281800]'
                    : theme === 'paper'
                    ? 'bg-[#2b6cb0] text-white'
                    : 'bg-[#7c4dff] text-white'
                }`}
              >
                {selectedGame.releaseYear} {selectedGame.publisher}
              </div>

              <div className="absolute top-1 right-1 bg-black/75 text-amber-300 px-1 py-[1px] text-[7.5px] font-mono font-bold flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[9px] text-amber-400">star</span>
                {selectedGame.rating}
              </div>
            </div>

            {/* Title & Subtitle */}
            <div className="mt-0.5">
              <h1
                className={`text-[13px] font-bold leading-tight truncate ${
                  theme === 'amber' ? 'text-[#ffd597] amber-glow' : t.textPrimary
                }`}
              >
                {selectedGame.title}
              </h1>
              <p className={`text-[9px] font-mono ${t.textMuted} truncate leading-tight mt-0.5`}>
                {selectedGame.subtitle}
              </p>
            </div>

            {/* Specs Table */}
            <div
              className={`p-1.5 border rounded-xs space-y-0.5 text-[8.5px] font-mono ${
                theme === 'paper'
                  ? 'bg-white border-[#b0b9c3] text-[#171c21] recessed-tray'
                  : theme === 'amber'
                  ? 'bg-[#191208] border-[#524533] text-[#ffd597]'
                  : 'bg-[#0f141c] border-[#3b494c] text-[#dee2ee]'
              }`}
            >
              <div className="flex justify-between">
                <span className={t.textMuted}>SYSTEM:</span>
                <span className="font-bold">
                  [{selectedGame.platform.toUpperCase()} • {selectedGame.core}]
                </span>
              </div>
              <div className="flex justify-between">
                <span className={t.textMuted}>STATE:</span>
                <span className="font-bold text-[#00ff88]">
                  {selectedGame.status === 'installed'
                    ? 'TF2 & CLOUD IN SYNC'
                    : 'REMOTE CLOUD READY'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={t.textMuted}>SAVE SYNC:</span>
                <span className="font-mono">
                  {selectedGame.lastSaveSync} ({selectedGame.saveSlot})
                </span>
              </div>
              <div className="flex justify-between">
                <span className={t.textMuted}>PLAYTIME:</span>
                <span className="font-mono">{selectedGame.playtime}</span>
              </div>
            </div>

            {/* Description Preview */}
            <p className={`text-[8.5px] leading-tight line-clamp-2 ${t.textMuted} px-0.5`}>
              {selectedGame.description}
            </p>
          </div>
        ) : (
          <div className={`p-4 text-center text-[10px] ${t.textMuted}`}>
            Select a game to inspect ROM details.
          </div>
        )}

        {/* Contextual Hardware Command Buttons */}
        {selectedGame && (
          <div className="flex flex-col gap-1 mt-1 shrink-0">
            {/* Primary Action Button */}
            <button
              onClick={() => onDownloadGame(selectedGame)}
              className={`w-full py-1.5 px-2 flex items-center justify-center gap-1.5 font-bold text-[10px] uppercase tracking-wider rounded-xs transition-all active:scale-[0.98] ${
                theme === 'amber'
                  ? 'bg-[#ffb000] text-[#281800] border border-[#ffb000] amber-box-glow hover:brightness-110'
                  : theme === 'paper'
                  ? 'bg-[#2b6cb0] text-white border border-[#2b6cb0] beveled-box hover:brightness-105'
                  : 'bg-[#00e5ff] text-[#00363d] border border-[#00e5ff] neon-focus-glow hover:brightness-110'
              }`}
              title={
                selectedGame.status === 'installed'
                  ? `Re-download ROM file to ${storageMount} for built-in emulators`
                  : `Download ROM from RomM Server to ${storageMount}`
              }
            >
              <span className="w-3.5 h-3.5 rounded-full border border-current flex items-center justify-center text-[8px] font-black">
                A
              </span>
              <span>
                {selectedGame.status === 'installed'
                  ? `RE-DOWNLOAD TO ${storageMount}`
                  : `DOWNLOAD TO ${storageMount}`}
              </span>
              <span className="material-symbols-outlined text-[12px]">
                {selectedGame.status === 'installed' ? 'cloud_download' : 'download'}
              </span>
            </button>
            <div className={`text-[7px] text-center font-mono ${t.textMuted} truncate -mt-0.5 mb-0.5`}>
              Target: <strong className="text-cyan-300">{storageMount}/{selectedGame.platform}/</strong> • {storageMount === '/roms2' ? 'Secondary SD' : 'Internal SD'}
            </div>

            {/* Dual Secondary Actions */}
            <div className="grid grid-cols-2 gap-1">
              <button
                onClick={() => onSyncSave(selectedGame)}
                className={`py-1 px-1 flex items-center justify-center gap-1 text-[8px] font-bold uppercase rounded-xs border transition-colors ${
                  theme === 'paper'
                    ? 'bg-white border-[#b0b9c3] text-[#171c21] hover:border-[#2b6cb0]'
                    : theme === 'amber'
                    ? 'bg-[#191208] border-[#524533] text-[#ffd597] hover:border-[#ffb000]'
                    : 'bg-[#252a33] border-[#3b494c] text-[#c3f5ff] hover:border-[#00e5ff]'
                }`}
                title="Sync Save State to RomM Cloud [X]"
              >
                <span className="w-3 h-3 rounded-full border border-current flex items-center justify-center text-[7px] font-bold">
                  X
                </span>
                <span>SYNC SAVE</span>
              </button>

              <button
                onClick={() => onOpenMetadata(selectedGame)}
                className={`py-1 px-1 flex items-center justify-center gap-1 text-[8px] font-bold uppercase rounded-xs border transition-colors ${
                  theme === 'paper'
                    ? 'bg-white border-[#b0b9c3] text-[#171c21] hover:border-[#2b6cb0]'
                    : theme === 'amber'
                    ? 'bg-[#191208] border-[#524533] text-[#ffd597] hover:border-[#ffb000]'
                    : 'bg-[#252a33] border-[#3b494c] text-[#c3f5ff] hover:border-[#00e5ff]'
                }`}
                title="Inspect Metadata & Scrape Art [Y]"
              >
                <span className="w-3 h-3 rounded-full border border-current flex items-center justify-center text-[7px] font-bold">
                  Y
                </span>
                <span>METADATA</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
