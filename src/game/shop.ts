export type ShopCategory = 'weapon' | 'shield' | 'potion' | 'food';

export type ShopItem = {
  id: string;
  name: string;
  category: ShopCategory;
  price: number;
  description: string;
  effect: {
    strength?: number;
    speed?: number;
    vision?: number;
    endurance?: number;
  };
};

export const COINS_KEY = 'azazel-shop-coins';
export const INVENTORY_KEY = 'azazel-shop-inventory';

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'iron-sword',
    name: 'Железный меч',
    category: 'weapon',
    price: 180,
    description: 'Надёжный клинок для боя с разбойниками.',
    effect: { strength: 2 },
  },
  {
    id: 'steppe-saber',
    name: 'Степная сабля',
    category: 'weapon',
    price: 420,
    description: 'Лёгкая сабля, с которой герой атакует быстрее.',
    effect: { strength: 4, speed: 1 },
  },
  {
    id: 'round-shield',
    name: 'Круглый щит',
    category: 'shield',
    price: 220,
    description: 'Защищает в схватках и помогает дольше держаться.',
    effect: { endurance: 2 },
  },
  {
    id: 'golden-shield',
    name: 'Золотой щит',
    category: 'shield',
    price: 520,
    description: 'Крепкий щит для опасных заданий.',
    effect: { endurance: 4, strength: 1 },
  },
  {
    id: 'speed-potion',
    name: 'Зелье скорости',
    category: 'potion',
    price: 160,
    description: 'Ускоряет бег и скачку.',
    effect: { speed: 3 },
  },
  {
    id: 'eagle-potion',
    name: 'Зелье орлиного зрения',
    category: 'potion',
    price: 190,
    description: 'Помогает раньше замечать путь, врагов и тайники.',
    effect: { vision: 4 },
  },
  {
    id: 'power-potion',
    name: 'Зелье силы',
    category: 'potion',
    price: 240,
    description: 'Усиливает удары героя.',
    effect: { strength: 3 },
  },
  {
    id: 'bread',
    name: 'Хлеб',
    category: 'food',
    price: 35,
    description: 'Простая еда в дорогу.',
    effect: { endurance: 1 },
  },
  {
    id: 'water',
    name: 'Вода',
    category: 'food',
    price: 25,
    description: 'Восстанавливает силы в пути.',
    effect: { endurance: 1, speed: 1 },
  },
  {
    id: 'watermelon',
    name: 'Арбуз',
    category: 'food',
    price: 70,
    description: 'Сочный запас энергии для долгой дороги.',
    effect: { endurance: 2 },
  },
  {
    id: 'melon',
    name: 'Дыня',
    category: 'food',
    price: 75,
    description: 'Сладкая еда, которая бодрит героя.',
    effect: { endurance: 2, vision: 1 },
  },
  {
    id: 'apple',
    name: 'Яблоко',
    category: 'food',
    price: 40,
    description: 'Быстрый перекус перед скачкой.',
    effect: { speed: 1 },
  },
  {
    id: 'pineapple',
    name: 'Ананас',
    category: 'food',
    price: 110,
    description: 'Редкий фрукт из дальних торговых путей.',
    effect: { strength: 1, endurance: 2 },
  },
  {
    id: 'pear',
    name: 'Груша',
    category: 'food',
    price: 45,
    description: 'Лёгкая еда, полезная в дороге.',
    effect: { vision: 1 },
  },
];

export function readInventory(): string[] {
  try {
    const raw = window.localStorage.getItem(INVENTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function writeInventory(items: string[]) {
  window.localStorage.setItem(INVENTORY_KEY, JSON.stringify(items));
}

export function readCoins(defaultCoins = 350) {
  const raw = window.localStorage.getItem(COINS_KEY);
  const value = raw ? Number(raw) : defaultCoins;
  return Number.isFinite(value) ? value : defaultCoins;
}

export function writeCoins(value: number) {
  window.localStorage.setItem(COINS_KEY, String(Math.max(0, value)));
}

export function getShopBonuses(inventory = readInventory()) {
  return SHOP_ITEMS
    .filter(item => inventory.includes(item.id))
    .reduce(
      (bonus, item) => ({
        strength: bonus.strength + (item.effect.strength ?? 0),
        speed: bonus.speed + (item.effect.speed ?? 0),
        vision: bonus.vision + (item.effect.vision ?? 0),
        endurance: bonus.endurance + (item.effect.endurance ?? 0),
      }),
      { strength: 0, speed: 0, vision: 0, endurance: 0 },
    );
}
