// ===== Прокачка героя, экипировка и активности =====
import type { LocationId } from './world';

export type StatId = 'speed' | 'endurance' | 'archery';

export type HeroStats = {
  speed: number;      // уровень скорости лошади
  endurance: number;  // уровень выносливости всадника
  archery: number;    // уровень стрельбы из лука
  reputation: number; // репутация в аулах
};

export const MAX_LEVEL = 6;

export const STAT_INFO: Record<StatId, { name: string; emoji: string; base: number }> = {
  speed:     { name: 'Скорость лошади',       emoji: '🐎', base: 60 },
  endurance: { name: 'Выносливость всадника', emoji: '💪', base: 60 },
  archery:   { name: 'Стрельба из лука',      emoji: '🏹', base: 70 },
};

/** Стоимость улучшения с текущего уровня на следующий. */
export function upgradeCost(level: number, base: number): number {
  return base * level;
}

// ---- Экипировка (магазин) ----
export type Gear = {
  id: string;
  name: string;
  emoji: string;
  price: number;
  stat: StatId;
  bonus: number;
  desc: string;
};

export const SHOP: Gear[] = [
  { id: 'saddle',   name: 'Седло мастера',   emoji: '🪑', price: 120, stat: 'speed',     bonus: 2, desc: 'Удобное седло — лошадь скачет резвее.' },
  { id: 'horseshoe',name: 'Стальные подковы',emoji: '🧲', price: 90,  stat: 'speed',     bonus: 1, desc: 'Крепкие подковы для быстрого галопа.' },
  { id: 'bow',      name: 'Тугой лук',       emoji: '🏹', price: 140, stat: 'archery',   bonus: 2, desc: 'Дальнобойный лук степных мастеров.' },
  { id: 'quiver',   name: 'Полный колчан',   emoji: '🎯', price: 80,  stat: 'archery',   bonus: 1, desc: 'Больше стрел — меньше промахов.' },
  { id: 'armor',    name: 'Кольчуга',        emoji: '🛡️', price: 130, stat: 'endurance', bonus: 2, desc: 'Защищает всадника в долгом пути и в бою.' },
  { id: 'flask',    name: 'Фляга кумыса',    emoji: '🥛', price: 70,  stat: 'endurance', bonus: 1, desc: 'Восстанавливает силы в дороге.' },
];

export function gearBonus(equipment: string[], stat: StatId): number {
  return SHOP.filter((g) => equipment.includes(g.id) && g.stat === stat)
    .reduce((sum, g) => sum + g.bonus, 0);
}

/** Итоговая «мощь» характеристики = уровень + бонусы экипировки. */
export function power(stats: HeroStats, equipment: string[], stat: StatId): number {
  return stats[stat] + gearBonus(equipment, stat);
}

// ---- Активности ----
export type ActivityId = 'race' | 'delivery' | 'search' | 'combat' | 'train' | 'shop';

export const ACTIVITY_INFO: Record<ActivityId, { name: string; emoji: string; desc: string }> = {
  race:     { name: 'Гонки на лошадях',        emoji: '🏇', desc: 'Обгони соперника! Чем выше скорость лошади — тем дальше каждый рывок.' },
  delivery: { name: 'Доставка сообщений',      emoji: '✉️', desc: 'Запомни маршрут гонца и повтори его без ошибок.' },
  search:   { name: 'Поиск потерянных вещей',  emoji: '🔍', desc: 'Найди пропажу на местности. Меткий глаз лучника даёт больше попыток.' },
  combat:   { name: 'Сражение с разбойниками', emoji: '⚔️', desc: 'Пошаговый бой: бей, стреляй из лука или защищайся.' },
  train:    { name: 'Тренировка (прокачка)',   emoji: '📈', desc: 'Вложи золото в скорость, выносливость и стрельбу.' },
  shop:     { name: 'Лавка экипировки',        emoji: '🛒', desc: 'Купи сёдла, подковы, луки и броню.' },
};

/** Какие активности доступны в каждой локации. */
export const LOCATION_ACTIVITIES: Record<LocationId, ActivityId[]> = {
  aul:        ['train', 'race', 'delivery'],
  alatau:     ['search', 'combat'],
  forest:     ['search', 'combat'],
  ruins:      ['search', 'delivery'],
  mines:      ['combat', 'train'],
  bandit:     ['combat', 'race'],
  port:       ['shop', 'delivery', 'race'],
  lighthouse: ['delivery', 'search'],
  mausoleum:  [],
};
