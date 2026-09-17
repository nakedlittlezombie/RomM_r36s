import React, { useState } from 'react';
import { GameRom, ThemeMode } from '../types';
import { getThemeStyles } from '../themeStyles';

interface MetadataModalProps {
  game: GameRom | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateGame: (updated: GameRom) => void;
  theme: ThemeMode;
}

export const MetadataModal: React.FC<MetadataModalProps> = ({
  game,
  isOpen,
  onClose,
  onUpdateGame,
  theme,
}) => {
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeSuccess, setScrapeSuccess] = useState(false);
  const t = getThemeStyles(theme);

  if (!isOpen || !game) return null;

  const handleFetchCoverArt = () => {
    setIsScraping(true);
    setScrapeSuccess(false);

    setTimeout(() => {
      setIsScraping(false);
      setScrapeSuccess(true);
      // Update with refreshed high-res cover art
      onUpdateGame({
        ...game,
        rating: 5.0,
        lastSaveSync: 'Just now',
        description:
          game.description + ' (Metadata and 3D boxart refreshed via RomM Scraper API & OpenVGDB).',
      });
      setTimeout(() => setScrapeSuccess(false), 3000);
    }, 1200);
  };

  return (
    <div
      id="metadata-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4 select-none backdrop-blur-xs"
    >
      <div
        className={`w-full max-w-[540px] max-h-[440px] border-2 rounded-xs flex flex-col justify-between overflow-hidden shadow-2xl ${
          theme === 'amber'
            ? 'border-[#ffb000] bg-[#191208] text-[#ffd597] amber-box-glow'
            : theme === 'paper'
            ? 'border-[#2b6cb0] bg-[#f6faff] text-[#171c21] beveled-box'
            : 'border-cyan-400 bg-[#090e16] text-[#c3f5ff] neon-focus-glow'
        }`}
      >
        {/* Header */}
        <div
          className={`h-8 px-3 border-b ${t.headerBorder} flex items-center justify-between font-mono text-[10px] font-bold shrink-0 ${
            theme === 'paper' ? 'bg-[#e4e9ef]' : 'bg-black/40'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px] text-cyan-400">
              database
            </span>
            <span>ROM METADATA &amp; COVER ART SCRAPER</span>
          </div>
          <button
            onClick={onClose}
            className="px-1.5 py-0.5 rounded bg-red-950/60 border border-red-500/40 text-red-300 text-[8px] font-bold"
          >
            [B] CLOSE
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 text-[9px] font-mono">
          <div className="flex gap-3">
            {/* Box Art Preview with frame */}
            <div className="w-[120px] h-[120px] shrink-0 border border-current/30 rounded-xs overflow-hidden bg-black/40 relative flex items-center justify-center">
              <img
                src={game.coverUrl}
                alt={game.title}
                className="w-full h-full object-cover pixel-crisp"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-1 right-1 bg-black/80 px-1 py-[0.5px] text-[7px] text-amber-300 font-bold">
                ★ {game.rating}
              </div>
            </div>

            {/* Main Info */}
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <span className="px-1 py-[0.5px] rounded bg-cyan-950 text-cyan-300 text-[7.5px] font-bold uppercase border border-cyan-500/30">
                  {game.platform.toUpperCase()}
                </span>
                <h2 className="text-[13px] font-bold leading-tight mt-0.5">{game.title}</h2>
                <p className={`text-[8.5px] ${t.textMuted} mt-0.5`}>{game.subtitle}</p>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <button
                  disabled={isScraping}
                  onClick={handleFetchCoverArt}
                  className={`px-2 py-1 rounded text-[8px] font-bold uppercase flex items-center gap-1 transition-all ${
                    isScraping
                      ? 'bg-amber-600 text-black cursor-wait'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-black cursor-pointer'
                  }`}
                >
                  <span className={`material-symbols-outlined text-[11px] ${isScraping ? 'animate-spin' : ''}`}>
                    {isScraping ? 'sync' : 'auto_fix_high'}
                  </span>
                  <span>{isScraping ? 'SCRAPING ROMM...' : 'FETCH COVER ART'}</span>
                </button>

                {scrapeSuccess && (
                  <span className="text-green-400 font-bold text-[8px] animate-pulse">
                    ✓ SCRAPED OK!
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Key-Value Details */}
          <div className="grid grid-cols-2 gap-1.5 p-2 bg-black/20 rounded border border-current/15 text-[8.5px]">
            <div className="flex justify-between">
              <span className={t.textMuted}>CRC32 HASH:</span>
              <span className="font-bold">{game.crc32}</span>
            </div>
            <div className="flex justify-between">
              <span className={t.textMuted}>FILE SIZE:</span>
              <span className="font-bold">{game.size}</span>
            </div>
            <div className="flex justify-between">
              <span className={t.textMuted}>DEVELOPER:</span>
              <span className="font-bold truncate max-w-[120px]">{game.developer}</span>
            </div>
            <div className="flex justify-between">
              <span className={t.textMuted}>PUBLISHER:</span>
              <span className="font-bold truncate max-w-[120px]">{game.publisher}</span>
            </div>
            <div className="flex justify-between">
              <span className={t.textMuted}>REGION:</span>
              <span className="font-bold">{game.region}</span>
            </div>
            <div className="flex justify-between">
              <span className={t.textMuted}>EMULATOR CORE:</span>
              <span className="font-bold text-cyan-300">{game.core}</span>
            </div>
            <div className="flex justify-between">
              <span className={t.textMuted}>SAVE SLOT:</span>
              <span className="font-bold text-green-300">{game.saveSlot}</span>
            </div>
            <div className="flex justify-between">
              <span className={t.textMuted}>PLAYTIME:</span>
              <span className="font-bold">{game.playtime}</span>
            </div>
          </div>

          {/* Description */}
          <div className="p-2 bg-black/20 rounded border border-current/15">
            <div className="font-bold text-[8px] text-cyan-400 mb-0.5">ROM OVERVIEW</div>
            <p className="text-[8.5px] leading-relaxed opacity-90">{game.description}</p>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`h-8 px-3 border-t ${t.headerBorder} flex items-center justify-between text-[8px] font-mono shrink-0 ${
            theme === 'paper' ? 'bg-[#dee3e9]' : 'bg-black/40'
          }`}
        >
          <span className={t.textMuted}>ROM FILE: {game.romFileName}</span>
          <button
            onClick={onClose}
            className="px-2 py-0.5 bg-black/40 border border-current/30 rounded font-bold hover:border-current"
          >
            DONE
          </button>
        </div>
      </div>
    </div>
  );
};
