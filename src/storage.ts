import { ServerConfig, GameRom } from './types';
import { INITIAL_SERVER_CONFIG, INITIAL_GAMES } from './mockData';

const CONFIG_STORAGE_KEY = 'romm_r36s_server_config';
const GAMES_STORAGE_KEY = 'romm_r36s_games_library';

export function loadSavedConfig(): ServerConfig {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...INITIAL_SERVER_CONFIG,
        ...parsed,
      };
    }
  } catch (e) {
    console.warn('Failed to load server config from localStorage', e);
  }
  return INITIAL_SERVER_CONFIG;
}

export function saveConfig(config: ServerConfig): void {
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn('Failed to save server config to localStorage', e);
  }
}

export function loadSavedGames(): GameRom[] {
  try {
    const raw = localStorage.getItem(GAMES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load games from localStorage', e);
  }
  return INITIAL_GAMES;
}

export function saveGames(games: GameRom[]): void {
  try {
    localStorage.setItem(GAMES_STORAGE_KEY, JSON.stringify(games));
  } catch (e) {
    console.warn('Failed to save games to localStorage', e);
  }
}
