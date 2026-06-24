import { readCoins } from './shop';
import { readPlayerProgress, type PlayerProgress } from './playerProgress';

export const CHARACTER_KEY = 'azazel-selected-character';
export const HORSE_KEY = 'azazel-selected-horse';

export type CharacterKind = 'hero' | 'enemy' | 'important' | 'horse' | 'secret';

export type CharacterBonus = {
  strength: number;
  speed: number;
  vision: number;
  endurance: number;
};

export type CharacterEntry = {
  id: string;
  name: string;
  role: string;
  description: string;
  kind: CharacterKind;
  unlock: string;
  level: number;
  coins: number;
  bosses: number;
  selectable: boolean;
  bonus: Partial<CharacterBonus>;
};

export const EMPTY_BONUS: CharacterBonus = {
  strength: 0,
  speed: 0,
  vision: 0,
  endurance: 0,
};

export const CHARACTERS: CharacterEntry[] = [
  {
    id: 'ayan',
    name: 'Аян',
    role: 'Главный герой',
    description: 'Ищет сокровище Золотого хана. Надежный всадник для начала пути.',
    kind: 'hero',
    unlock: 'Открыт сразу',
    level: 1,
    coins: 0,
    bosses: 0,
    selectable: true,
    bonus: { speed: 1 },
  },
  {
    id: 'aiaru',
    name: 'Айару',
    role: 'Охотница',
    description: 'Лучница и следопыт. Лучше замечает ловушки и тайные места.',
    kind: 'hero',
    unlock: 'Нужен 2 уровень и 150 монет',
    level: 2,
    coins: 150,
    bosses: 0,
    selectable: true,
    bonus: { vision: 2, speed: 1 },
  },
  {
    id: 'erzhan',
    name: 'Ержан',
    role: 'Старый мудрец',
    description: 'Знает древние легенды и помогает получать больше опыта.',
    kind: 'hero',
    unlock: 'Нужен 3 уровень',
    level: 3,
    coins: 0,
    bosses: 0,
    selectable: true,
    bonus: { vision: 3, endurance: 1 },
  },
  {
    id: 'bekzat',
    name: 'Бекзат',
    role: 'Главарь разбойников',
    description: 'Жестокий воин. Открывается только после серьезных побед.',
    kind: 'enemy',
    unlock: 'Нужен 5 уровень, 500 монет и 1 побежденный босс',
    level: 5,
    coins: 500,
    bosses: 1,
    selectable: true,
    bonus: { strength: 3, endurance: 1 },
  },
  {
    id: 'black-rider',
    name: 'Чёрный всадник',
    role: 'Таинственный враг',
    description: 'Появляется ночью и преследует героя. Очень быстрый стиль игры.',
    kind: 'enemy',
    unlock: 'Нужен 8 уровень, 900 монет и 2 босса',
    level: 8,
    coins: 900,
    bosses: 2,
    selectable: true,
    bonus: { speed: 4, strength: 1 },
  },
  {
    id: 'steppe-wolf',
    name: 'Степной волк',
    role: 'Дикий хищник',
    description: 'Нападает на путников по ночам. Его можно открыть в коллекции.',
    kind: 'enemy',
    unlock: 'Нужен 4 уровень',
    level: 4,
    coins: 0,
    bosses: 0,
    selectable: false,
    bonus: {},
  },
  {
    id: 'karabai',
    name: 'Карабай',
    role: 'Торговец',
    description: 'Продает оружие, доспехи, еду и лошадей.',
    kind: 'important',
    unlock: 'Нужен 2 уровень',
    level: 2,
    coins: 0,
    bosses: 0,
    selectable: false,
    bonus: {},
  },
  {
    id: 'nurlan',
    name: 'Нурлан',
    role: 'Кузнец',
    description: 'Улучшает оружие и снаряжение перед трудными боями.',
    kind: 'important',
    unlock: 'Нужен 4 уровень и 300 монет',
    level: 4,
    coins: 300,
    bosses: 0,
    selectable: false,
    bonus: {},
  },
  {
    id: 'mausoleum-keeper',
    name: 'Хранитель мавзолея',
    role: 'Хранитель тайн',
    description: 'Охраняет вход к сокровищу и древним знаниям.',
    kind: 'important',
    unlock: 'Нужен 6 уровень и 1 босс',
    level: 6,
    coins: 0,
    bosses: 1,
    selectable: false,
    bonus: {},
  },
  {
    id: 'buran',
    name: 'Буран',
    role: 'Быстрая лошадь',
    description: 'Верный конь, с которым начинается путешествие.',
    kind: 'horse',
    unlock: 'Открыт сразу',
    level: 1,
    coins: 0,
    bosses: 0,
    selectable: true,
    bonus: { speed: 1 },
  },
  {
    id: 'taiburyl',
    name: 'Тайбурыл',
    role: 'Легендарный скакун',
    description: 'Достойный всаднику. Хорошо прыгает и быстро разгоняется.',
    kind: 'horse',
    unlock: 'Нужен 4 уровень и 350 монет',
    level: 4,
    coins: 350,
    bosses: 0,
    selectable: true,
    bonus: { speed: 3, endurance: 1 },
  },
  {
    id: 'kokzhal',
    name: 'Кокжал',
    role: 'Чёрный боевой конь',
    description: 'Сильный конь для опасных боев.',
    kind: 'horse',
    unlock: 'Нужен 6 уровень, 650 монет и 1 босс',
    level: 6,
    coins: 650,
    bosses: 1,
    selectable: true,
    bonus: { strength: 1, endurance: 3 },
  },
  {
    id: 'zhelayak',
    name: 'Желаяқ',
    role: 'Самая быстрая лошадь',
    description: 'Мечта любого всадника. Очень помогает на сложных картах.',
    kind: 'horse',
    unlock: 'Нужен 9 уровень, 1000 монет и 2 босса',
    level: 9,
    coins: 1000,
    bosses: 2,
    selectable: true,
    bonus: { speed: 5, vision: 1 },
  },
  {
    id: 'golden-ghost',
    name: 'Призрак золотого хана',
    role: 'Секретный персонаж',
    description: 'Дух великого хана. Открывается почти в конце пути.',
    kind: 'secret',
    unlock: 'Нужен 9 уровень, 1500 монет и 3 босса',
    level: 9,
    coins: 1500,
    bosses: 3,
    selectable: true,
    bonus: { strength: 3, speed: 3, vision: 3, endurance: 3 },
  },
];

export function isCharacterUnlocked(
  character: CharacterEntry,
  progress: PlayerProgress = readPlayerProgress(),
  coins = readCoins(),
) {
  return (
    progress.level >= character.level &&
    coins >= character.coins &&
    progress.defeatedBosses.length >= character.bosses
  );
}

function readSelected(key: string, fallback: string, kind: CharacterKind) {
  const selectedId = window.localStorage.getItem(key) || fallback;
  const progress = readPlayerProgress();
  const coins = readCoins();
  const selected = CHARACTERS.find(character => character.id === selectedId && character.kind === kind);

  if (!selected || !selected.selectable || !isCharacterUnlocked(selected, progress, coins)) {
    window.localStorage.setItem(key, fallback);
    return fallback;
  }

  return selected.id;
}

export function readSelectedCharacter() {
  const selectedId = window.localStorage.getItem(CHARACTER_KEY) || 'ayan';
  const progress = readPlayerProgress();
  const coins = readCoins();
  const selected = CHARACTERS.find(character => character.id === selectedId && character.kind !== 'horse');

  if (!selected || !selected.selectable || !isCharacterUnlocked(selected, progress, coins)) {
    window.localStorage.setItem(CHARACTER_KEY, 'ayan');
    return 'ayan';
  }

  return selected.id;
}

export function readSelectedHorse() {
  return readSelected(HORSE_KEY, 'buran', 'horse');
}

export function writeSelectedCharacter(id: string) {
  window.localStorage.setItem(CHARACTER_KEY, id);
}

export function writeSelectedHorse(id: string) {
  window.localStorage.setItem(HORSE_KEY, id);
}

export function getCharacterBonuses() {
  const selectedIds = [readSelectedCharacter(), readSelectedHorse()];

  return CHARACTERS
    .filter(character => selectedIds.includes(character.id))
    .reduce<CharacterBonus>(
      (bonus, character) => ({
        strength: bonus.strength + (character.bonus.strength ?? 0),
        speed: bonus.speed + (character.bonus.speed ?? 0),
        vision: bonus.vision + (character.bonus.vision ?? 0),
        endurance: bonus.endurance + (character.bonus.endurance ?? 0),
      }),
      { ...EMPTY_BONUS },
    );
}
