// ===== Игровой мир «Legend of the Steppe Rider» =====
// Координаты x/y заданы в процентах от карты (1920×1080), чтобы маркеры
// точно совпадали с фоновым изображением public/world-map.png.

export type LocationId =
  | 'aul'
  | 'alatau'
  | 'forest'
  | 'ruins'
  | 'mines'
  | 'bandit'
  | 'port'
  | 'lighthouse'
  | 'mausoleum';

export type Quest = {
  title: string;
  description: string;
  reward: number; // золото
  /** Награда-предмет, попадает в инвентарь после выполнения. */
  item?: string;
  /** Квест доступен, только если в инвентаре есть этот предмет. */
  requiresItem?: string;
};

export type GameLocation = {
  id: LocationId;
  name: string;
  emoji: string;
  /** позиция маркера в процентах от ширины/высоты карты */
  x: number;
  y: number;
  /** краткое лор-описание */
  lore: string;
  /** куда можно доехать по дороге отсюда */
  links: LocationId[];
  quest?: Quest;
  /** клад: золото, которое можно забрать один раз */
  treasure?: number;
};

export const LOCATIONS: Record<LocationId, GameLocation> = {
  aul: {
    id: 'aul',
    name: 'Родной аул',
    emoji: '🏕️',
    x: 51, y: 48,
    lore: 'Дом Степного всадника. Юрты, кони и запах дыма очага. Отсюда начинается твой путь.',
    links: ['alatau', 'forest', 'ruins', 'mines', 'bandit', 'port'],
    quest: {
      title: 'Зов степи',
      description: 'Старейшина просит тебя объехать земли и вернуть аулу былую славу. Отправляйся в путь!',
      reward: 50,
    },
  },
  alatau: {
    id: 'alatau',
    name: 'Пики Алатау',
    emoji: '⛰️',
    x: 16, y: 24,
    lore: 'Снежные вершины и водопад Тёрт. Воздух режет лёгкие, но среди льдов спрятаны древние тайники.',
    links: ['aul'],
    quest: {
      title: 'Сердце ледника',
      description: 'Найди замёрзший родник на склоне и принеси старейшине осколок вечного льда.',
      reward: 80,
      item: 'Осколок льда',
    },
    treasure: 120,
  },
  forest: {
    id: 'forest',
    name: 'Тёмный лес Қараңғы',
    emoji: '🌲',
    x: 11, y: 50,
    lore: 'Шепчущая чаща, где из темноты светятся чьи-то глаза. Лесной дух испытывает каждого путника.',
    links: ['aul'],
    quest: {
      title: 'Шёпот чащи',
      description: 'Пройди лес, не сбившись с тропы, и развей проклятие, мучающее охотников аула.',
      reward: 90,
      item: 'Оберег леса',
    },
    treasure: 100,
  },
  ruins: {
    id: 'ruins',
    name: 'Руины Сарая',
    emoji: '🏛️',
    x: 81, y: 48,
    lore: 'Колонны павшего ханства, увитые лозой. Здесь хранится ключ к легенде о Золотом хане.',
    links: ['aul', 'mausoleum'],
    quest: {
      title: 'Ключ забытого хана',
      description: 'Разгадай надпись на разбитой арке и добудь Древний ключ — он откроет скрытый мавзолей.',
      reward: 120,
      item: 'Древний ключ',
    },
  },
  mines: {
    id: 'mines',
    name: 'Железные рудники Темир-Тау',
    emoji: '⛏️',
    x: 85, y: 28,
    lore: 'Гулкие штольни в горах. Рудокопы добывают железо, но в глубине что-то ворочается во тьме.',
    links: ['aul'],
    quest: {
      title: 'Тьма в забое',
      description: 'Спустись в обвалившуюся штольню и спаси застрявших рудокопов.',
      reward: 110,
      item: 'Стальной клинок',
    },
  },
  bandit: {
    id: 'bandit',
    name: 'Лагерь разбойников',
    emoji: '🏴‍☠️',
    x: 22, y: 78,
    lore: 'Шатры и костры в пустыне Кум. Под флагом с черепом прячутся те, кто грабит караваны.',
    links: ['aul'],
    quest: {
      title: 'Гроза пустыни',
      description: 'Разбей лагерь разбойников и верни купцам украденный караван. Понадобится оружие.',
      reward: 150,
      requiresItem: 'Стальной клинок',
    },
    treasure: 130,
  },
  port: {
    id: 'port',
    name: 'Порт Жибек',
    emoji: '⚓',
    x: 51, y: 81,
    lore: 'Торговый город на Шёлковом пути и шумная гавань. Здесь покупают и продают всё на свете.',
    links: ['aul', 'lighthouse'],
    quest: {
      title: 'Шёлковый путь',
      description: 'Помоги купцам доставить груз и заслужи доверие торговой гильдии.',
      reward: 100,
    },
  },
  lighthouse: {
    id: 'lighthouse',
    name: 'Маяк Нур',
    emoji: '🗼',
    x: 72, y: 85,
    lore: 'Одинокий маяк на скалах. Его свет ведёт корабли — но сегодня огонь погас.',
    links: ['port'],
    quest: {
      title: 'Свет во тьме',
      description: 'Зажги погасший огонь маяка и спаси корабли от рифов в ночном шторме.',
      reward: 90,
      item: 'Линза маяка',
    },
  },
  mausoleum: {
    id: 'mausoleum',
    name: 'Скрытый мавзолей',
    emoji: '🕌',
    x: 82, y: 75,
    lore: 'Бирюзовый купол усыпальницы Золотого хана. За запечатанной дверью спит легендарное сокровище.',
    links: ['ruins'],
    quest: {
      title: 'Легенда Золотого хана',
      description: 'Открой Древним ключом печать мавзолея и забери легендарное сокровище степи.',
      reward: 500,
      requiresItem: 'Древний ключ',
    },
    treasure: 1000,
  },
};

export const START_LOCATION: LocationId = 'aul';

/** Порядок отрисовки/обхода. */
export const LOCATION_ORDER: LocationId[] = [
  'aul', 'alatau', 'forest', 'ruins', 'mines', 'bandit', 'port', 'lighthouse', 'mausoleum',
];
