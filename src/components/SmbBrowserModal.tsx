import React, { useState } from 'react';
import { SMB_FILE_SYSTEM } from '../mockData';
import { SmbFileItem, ThemeMode, ServerConfig } from '../types';
import { getThemeStyles } from '../themeStyles';

interface SmbBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportRom: (file: SmbFileItem) => void;
  theme: ThemeMode;
  config?: ServerConfig;
}

export const SmbBrowserModal: React.FC<SmbBrowserModalProps> = ({
  isOpen,
  onClose,
  onImportRom,
  theme,
  config,
}) => {
  const [currentPath, setCurrentPath] = useState<string>('/roms/snes');
  const [selectedFile, setSelectedFile] = useState<SmbFileItem | null>(null);
  const t = getThemeStyles(theme);

  if (!isOpen) return null;

  const currentItems = SMB_FILE_SYSTEM[currentPath] || [
    { name: '..', type: 'directory', path: '/roms' },
  ];

  const handleNavigate = (item: SmbFileItem) => {
    if (item.type === 'directory') {
      setCurrentPath(item.path);
      setSelectedFile(null);
    } else {
      setSelectedFile(item);
    }
  };

  const handleGoUp = () => {
    const parts = currentPath.split('/').filter(Boolean);
    if (parts.length <= 1) {
      setCurrentPath('/');
    } else {
      parts.pop();
      setCurrentPath('/' + parts.join('/'));
    }
    setSelectedFile(null);
  };

  return (
    <div
      id="smb-browser-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4 select-none backdrop-blur-xs"
    >
      <div
        className={`w-full max-w-[560px] h-[380px] border-2 rounded-xs flex flex-col justify-between overflow-hidden shadow-2xl ${
          theme === 'amber'
            ? 'border-[#ffb000] bg-[#191208] text-[#ffd597] amber-box-glow'
            : theme === 'paper'
            ? 'border-[#2b6cb0] bg-[#f6faff] text-[#171c21] beveled-box'
            : 'border-cyan-400 bg-[#090e16] text-[#c3f5ff] neon-focus-glow'
        }`}
      >
        {/* Modal Top Bar */}
        <div
          className={`h-8 px-3 border-b ${t.headerBorder} flex items-center justify-between font-mono text-[10px] font-bold shrink-0 ${
            theme === 'paper' ? 'bg-[#e4e9ef]' : 'bg-black/40'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px] text-amber-400">
              folder_shared
            </span>
            <span>SMB / NAS NETWORK BROWSER</span>
            <span className={`text-[8px] ${t.textMuted} font-normal hidden sm:inline`}>
              [Samba v3 • {config?.smbHost || '192.168.1.50'}]
            </span>
          </div>

          <button
            onClick={onClose}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-950/60 border border-red-500/40 text-red-300 text-[8px] font-bold hover:bg-red-900"
          >
            <span>[B] CLOSE</span>
          </button>
        </div>

        {/* Current Path & Back Button */}
        <div className="h-7 px-3 bg-black/20 border-b border-current/15 flex items-center justify-between text-[9px] font-mono shrink-0">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <span className="text-amber-400 font-bold">URI:</span>
            <span className="truncate font-bold">
              smb://{config?.smbHost || '192.168.1.50'}/{config?.smbShare || 'roms'}{currentPath}
            </span>
          </div>

          {currentPath !== '/' && (
            <button
              onClick={handleGoUp}
              className="flex items-center gap-1 px-1.5 py-[2px] bg-black/40 border border-current/30 rounded text-[8px] hover:border-current"
            >
              <span className="material-symbols-outlined text-[10px]">arrow_upward</span>
              <span>PARENT DIR</span>
            </button>
          )}
        </div>

        {/* File & Folder List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-[9.5px]">
          {currentItems.map((item, idx) => {
            const isSelected = selectedFile?.name === item.name;
            return (
              <div
                key={idx}
                onClick={() => handleNavigate(item)}
                className={`px-2 py-1.5 rounded-xs flex items-center justify-between cursor-pointer border transition-colors ${
                  isSelected
                    ? `${t.activeRowClass}`
                    : 'border-transparent hover:bg-white/5 hover:border-current/20'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="material-symbols-outlined text-[14px]">
                    {item.type === 'directory' ? 'folder' : 'sports_esports'}
                  </span>
                  <span className="truncate font-semibold">{item.name}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0 text-[8.5px] opacity-75">
                  {item.size && <span>{item.size}</span>}
                  <span className="uppercase font-bold">
                    {item.type === 'directory' ? '[DIR]' : '[ROM]'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected File Action Footer */}
        <div
          className={`p-2 border-t ${t.headerBorder} flex items-center justify-between text-[9px] font-mono shrink-0 ${
            theme === 'paper' ? 'bg-[#dee3e9]' : 'bg-black/40'
          }`}
        >
          <div className="truncate pr-2">
            {selectedFile ? (
              <span className="truncate">
                Selected: <strong className="text-white">{selectedFile.name}</strong> ({selectedFile.size})
              </span>
            ) : (
              <span className={t.textMuted}>Select a file to transfer or click folder to open</span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onClose}
              className="px-2 py-1 border border-current/30 rounded text-[8px] font-bold"
            >
              CANCEL
            </button>

            <button
              disabled={!selectedFile}
              onClick={() => {
                if (selectedFile) {
                  onImportRom(selectedFile);
                  onClose();
                }
              }}
              className={`px-2 py-1 font-bold text-[8px] rounded uppercase flex items-center gap-1 transition-all ${
                selectedFile
                  ? `${t.accentBg} ${t.accentText} cursor-pointer hover:brightness-110`
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
            >
              <span className="material-symbols-outlined text-[11px]">download</span>
              <span>COPY TO TF2 SD</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
