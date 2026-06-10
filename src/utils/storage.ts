import type { SaveData, GameStats } from "../engine/types";

const SAVE_KEY = "sudoku-save";
const STATS_KEY = "sudoku-stats";

const DEFAULT_STATS: GameStats = {
  totalPlayed: 0,
  totalCompleted: 0,
  easyCompleted: 0,
  mediumCompleted: 0,
  hardCompleted: 0,
  currentStreak: 0,
  bestStreak: 0,
};

export function loadSave(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SaveData;
  } catch {
    return null;
  }
}

export function saveSave(data: SaveData): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

export function clearSave(): void {
  localStorage.removeItem(SAVE_KEY);
}

export function loadStats(): GameStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return { ...DEFAULT_STATS };
    return { ...DEFAULT_STATS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_STATS };
  }
}

export function saveStats(stats: GameStats): void {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    // silently ignore
  }
}
