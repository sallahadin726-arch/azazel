import type { LocationId } from './world';

export const PLAYER_PROGRESS_KEY = 'azazel-player-progress';
export const MAX_PLAYER_LEVEL = 9;

export type PlayerProgress = {
  level: number;
  xp: number;
  completedLocations: LocationId[];
  defeatedBosses: LocationId[];
};

export const LEVEL_XP = [0, 100, 230, 390, 580, 800, 1050, 1330, 1640];

export function readPlayerProgress(): PlayerProgress {
  try {
    const raw = window.localStorage.getItem(PLAYER_PROGRESS_KEY);
    if (!raw) return { level: 1, xp: 0, completedLocations: [], defeatedBosses: [] };
    const parsed = JSON.parse(raw) as Partial<PlayerProgress>;
    return {
      level: typeof parsed.level === 'number' ? parsed.level : 1,
      xp: typeof parsed.xp === 'number' ? parsed.xp : 0,
      completedLocations: Array.isArray(parsed.completedLocations) ? parsed.completedLocations : [],
      defeatedBosses: Array.isArray(parsed.defeatedBosses) ? parsed.defeatedBosses : [],
    };
  } catch {
    return { level: 1, xp: 0, completedLocations: [], defeatedBosses: [] };
  }
}

export function writePlayerProgress(progress: PlayerProgress) {
  window.localStorage.setItem(PLAYER_PROGRESS_KEY, JSON.stringify(progress));
}

export function levelFromXp(xp: number) {
  let level = 1;
  for (let index = 0; index < LEVEL_XP.length; index += 1) {
    if (xp >= LEVEL_XP[index]) level = index + 1;
  }
  return Math.min(MAX_PLAYER_LEVEL, level);
}

export function addProgressXp(amount: number, location?: LocationId, bossDefeated?: boolean) {
  const current = readPlayerProgress();
  const completedLocations = location && !current.completedLocations.includes(location)
    ? [...current.completedLocations, location]
    : current.completedLocations;
  const defeatedBosses = location && bossDefeated && !current.defeatedBosses.includes(location)
    ? [...current.defeatedBosses, location]
    : current.defeatedBosses;
  const xp = Math.max(0, current.xp + amount);
  const next = {
    xp,
    level: levelFromXp(xp),
    completedLocations,
    defeatedBosses,
  };
  writePlayerProgress(next);
  return next;
}

export function completionPercent(progress = readPlayerProgress()) {
  return Math.min(100, Math.round((progress.level / MAX_PLAYER_LEVEL) * 100));
}
