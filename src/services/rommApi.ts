import { ServerConfig, GameRom, PlatformId } from '../types';

export interface RommTestResult {
  success: boolean;
  message: string;
  pingMs: number;
  serverVersion?: string;
  totalPlatforms?: number;
}

function getAuthHeaders(config: ServerConfig): HeadersInit {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };

  if (config.apiKey && config.apiKey.trim().length > 0) {
    const key = config.apiKey.trim();
    headers['X-API-KEY'] = key;
    headers['Authorization'] = key.startsWith('Bearer ') ? key : `Bearer ${key}`;
  } else if (config.username && config.password) {
    const encoded = btoa(`${config.username}:${config.password}`);
    headers['Authorization'] = `Basic ${encoded}`;
  }

  return headers;
}

function normalizeUrl(url: string): string {
  let clean = url.trim();
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = 'http://' + clean;
  }
  return clean.replace(/\/+$/, '');
}

export async function testRommConnection(config: ServerConfig): Promise<RommTestResult> {
  const base = normalizeUrl(config.serverUrl);
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    // Try RomM standard endpoints: /api/heartbeat or /api/status or /api/platforms
    let resp: Response | null = null;
    let endpoint = '/api/heartbeat';

    try {
      resp = await fetch(`${base}/api/heartbeat`, {
        method: 'GET',
        headers: getAuthHeaders(config),
        signal: controller.signal,
      });
    } catch {
      // Fallback to /api/status or /api/platforms
      try {
        resp = await fetch(`${base}/api/platforms`, {
          method: 'GET',
          headers: getAuthHeaders(config),
          signal: controller.signal,
        });
        endpoint = '/api/platforms';
      } catch {
        // Fallback root ping
        resp = await fetch(`${base}/`, {
          method: 'GET',
          signal: controller.signal,
        });
        endpoint = '/';
      }
    }

    clearTimeout(timeoutId);
    const elapsed = Date.now() - startTime;

    if (!resp.ok) {
      if (resp.status === 401 || resp.status === 403) {
        return {
          success: false,
          message: `Authentication Failed (${resp.status}): Check your API Key or Token`,
          pingMs: elapsed,
        };
      }
      return {
        success: false,
        message: `HTTP Error ${resp.status} on ${endpoint}`,
        pingMs: elapsed,
      };
    }

    let serverVersion = 'RomM v2/v3';
    let totalPlatforms = 0;
    try {
      const data = await resp.json();
      if (data && Array.isArray(data)) {
        totalPlatforms = data.length;
      } else if (data && Array.isArray(data.items)) {
        totalPlatforms = data.items.length;
      }
      if (data && data.version) {
        serverVersion = `RomM v${data.version}`;
      }
    } catch {
      // Not JSON, but HTTP 200 OK
    }

    return {
      success: true,
      message: `Connected successfully (${elapsed}ms)`,
      pingMs: elapsed,
      serverVersion,
      totalPlatforms,
    };
  } catch (err: unknown) {
    const elapsed = Date.now() - startTime;
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (errorMsg.includes('abort')) {
      return {
        success: false,
        message: 'Connection timed out (Host unreachable after 6s)',
        pingMs: elapsed,
      };
    }
    return {
      success: false,
      message: `Failed to reach server: ${errorMsg}. Check URL and Wi-Fi.`,
      pingMs: elapsed,
    };
  }
}

// Map RomM platform slugs/names to R36S platform IDs
export function mapPlatformSlug(slugOrName: string): PlatformId {
  const s = slugOrName.toLowerCase();
  if (s.includes('snes') || s.includes('super-nintendo') || s.includes('super nintendo')) return 'snes';
  if (s.includes('gba') || s.includes('advance') || s.includes('game-boy-advance')) return 'gba';
  if (s.includes('ps1') || s.includes('psx') || s.includes('playstation')) return 'ps1';
  if (s.includes('n64') || s.includes('nintendo 64') || s.includes('nintendo-64')) return 'n64';
  if (s.includes('genesis') || s.includes('megadrive') || s.includes('sega')) return 'genesis';
  if (s.includes('arcade') || s.includes('mame') || s.includes('fbneo')) return 'arcade';
  return 'snes'; // Default fallback
}

export async function fetchRommLibrary(config: ServerConfig): Promise<{
  games: GameRom[];
  totalFound: number;
}> {
  const base = normalizeUrl(config.serverUrl);
  const headers = getAuthHeaders(config);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    // 1. Fetch platforms
    let platformItems: Array<{ id: number | string; name: string; slug?: string }> = [];
    try {
      const pResp = await fetch(`${base}/api/platforms`, {
        headers,
        signal: controller.signal,
      });
      if (pResp.ok) {
        const pData = await pResp.json();
        platformItems = Array.isArray(pData) ? pData : pData.items || [];
      }
    } catch (e) {
      console.warn('Failed to fetch platforms list from RomM', e);
    }

    // 2. Fetch ROMs list
    let romItems: any[] = [];
    try {
      const rResp = await fetch(`${base}/api/roms?limit=250`, {
        headers,
        signal: controller.signal,
      });
      if (rResp.ok) {
        const rData = await rResp.json();
        romItems = Array.isArray(rData) ? rData : rData.items || [];
      }
    } catch (e) {
      console.warn('Failed to fetch roms list from RomM', e);
    }

    clearTimeout(timeoutId);

    if (romItems.length === 0) {
      return { games: [], totalFound: 0 };
    }

    // Transform RomM items into GameRom objects
    const mappedGames: GameRom[] = romItems.map((item, idx) => {
      const platSlug = item.platform_slug || item.platform?.slug || item.platform_name || item.platform?.name || 'snes';
      const platformId = mapPlatformSlug(platSlug);

      const sizeBytes = Number(item.fs_size || item.file_size || item.size || 1048576);
      const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(1) + 'M';

      let coverUrl = item.cover_url || item.path_cover || '';
      if (coverUrl && !coverUrl.startsWith('http')) {
        coverUrl = `${base}${coverUrl.startsWith('/') ? '' : '/'}${coverUrl}`;
      }
      if (!coverUrl) {
        coverUrl = `/portmaster/romm/cover.png`;
      }

      return {
        id: `romm-${item.id || idx}`,
        title: item.name || item.title || `ROM #${item.id}`,
        subtitle: `${item.developer || item.publisher || 'RomM Server'} • ${item.release_year || item.year || 1995}`,
        platform: platformId,
        releaseYear: item.release_year || item.year || 1995,
        developer: item.developer || 'Unknown',
        publisher: item.publisher || 'Unknown',
        size: sizeMB,
        sizeBytes,
        status: 'cloud', // Available on cloud server
        rating: item.rating ? Number((item.rating / 20).toFixed(1)) : 4.5,
        isFavorite: Boolean(item.favorite || item.is_favorite),
        crc32: item.crc32 || '00000000',
        region: item.region || 'USA / World',
        core: platformId === 'snes' ? 'Snes9x 2010' : platformId === 'gba' ? 'mGBA' : platformId === 'ps1' ? 'PCSX-ReARMed' : 'RetroArch',
        saveSyncStatus: 'synced',
        lastSaveSync: 'Ready',
        saveSlot: 'Slot #01',
        playtime: '0h 00m',
        description: item.summary || item.description || `Fetched from your RomM Server (${config.serverUrl})`,
        coverUrl,
        romFileName: item.file_name || item.fs_name || `${item.name || 'game'}.zip`,
        smbPath: `smb://${config.smbHost || 'server'}/${config.smbShare || 'roms'}/${platformId}/${item.file_name || item.name || 'game.zip'}`,
      };
    });

    return {
      games: mappedGames,
      totalFound: mappedGames.length,
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    throw err;
  }
}
