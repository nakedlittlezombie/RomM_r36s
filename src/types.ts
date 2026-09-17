export type PlatformId = 'snes' | 'gba' | 'ps1' | 'n64' | 'genesis' | 'arcade';

export type ThemeMode = 'amber' | 'cyan' | 'paper';

export type ActiveScreen = 'library' | 'sync' | 'settings' | 'smb-browser' | 'metadata-modal';

export type RomStatus = 'installed' | 'downloading' | 'cloud' | 'ready';

export interface GameRom {
  id: string;
  title: string;
  subtitle: string;
  platform: PlatformId;
  releaseYear: number;
  developer: string;
  publisher: string;
  size: string; // e.g., '1.4M', '4.0M'
  sizeBytes: number;
  status: RomStatus;
  downloadProgress?: number; // 0 - 100
  downloadSpeed?: string; // e.g. '1.2MB/s'
  rating: number; // e.g. 4.9
  isFavorite: boolean;
  crc32: string; // e.g. '0EC0C93A'
  chip?: string; // e.g. 'Super FX 2'
  region: string; // e.g. 'USA / NTSC'
  core: string; // e.g. 'Snes9x 2010'
  saveSyncStatus: 'synced' | 'local_ahead' | 'cloud_ahead' | 'none';
  lastSaveSync: string; // e.g. '2m ago'
  saveSlot: string; // e.g. 'Slot #01'
  playtime: string; // e.g. '14h 22m (87%)'
  description: string;
  coverUrl: string;
  romFileName: string;
  smbPath: string;
}

export interface DownloadTask {
  id: string;
  romId: string;
  title: string;
  platform: PlatformId;
  size: string;
  currentBytes: number;
  totalBytes: number;
  progress: number; // 0 - 100
  speed: string;
  eta: string;
  status: 'downloading' | 'queued' | 'paused' | 'done';
}

export interface CloudSaveEvent {
  id: string;
  gameTitle: string;
  platform: PlatformId;
  slot: string;
  timeAgo: string;
  direction: 'bidirectional' | 'upload' | 'download';
  crc32: string;
  status: 'synced' | 'verified' | 'conflict';
  details: string;
}

export type StorageMount = '/roms' | '/roms2';

export interface ServerConfig {
  serverUrl: string;
  username: string;
  apiKey: string;
  isTokenMasked: boolean;
  pingMs: number;
  autoSyncSaves: boolean;
  smbShareUrl: string;
  storageMount: StorageMount; // '/roms' (TF1 / Internal) or '/roms2' (TF2 / Secondary Card)
  tf2SyncPath: string;
  theme: ThemeMode;
  conflictResolution: 'Keep Newer Save' | 'Server Authoritative' | 'Local Authoritative';
}

export interface SmbFileItem {
  name: string;
  type: 'file' | 'directory';
  size?: string;
  platform?: PlatformId;
  path: string;
  modified?: string;
}
