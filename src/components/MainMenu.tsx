import { useState } from 'react';
import '../game/menu.css';
import {
  readCoins,
  readInventory,
  SHOP_ITEMS,
  writeCoins,
  writeInventory,
  type ShopCategory,
} from '../game/shop';
import { completionPercent, readPlayerProgress } from '../game/playerProgress';
import {
  CHARACTERS as CHARACTER_LIST,
  isCharacterUnlocked,
  readSelectedCharacter,
  readSelectedHorse,
  writeSelectedCharacter,
  writeSelectedHorse,
  type CharacterKind,
} from '../game/characters';

const TOP_TOOLS = ['Достижения', 'Почта', 'Настройки'];
const MENU_ITEMS = [
  { label: 'Играть', icon: 'horse', primary: true },
  { label: 'Продолжить', icon: 'sword' },
  { label: 'Открытый мир', icon: 'map' },
  { label: 'Персонажи', icon: 'scroll' },
  { label: 'Магазин', icon: 'bag' },
  { label: 'Настройки', icon: 'gear' },
  { label: 'Выход', icon: 'door' },
];

const CHARACTERS = [
  {
    id: 'ayan',
    name: 'Аян',
    role: 'Степной всадник',
    description: 'Главный герой. Быстрый, смелый и готовый к дальнему пути.',
    image: '/hero-realistic.png',
    unlock: 'Открыт сразу',
    level: 1,
    coins: 0,
  },
  {
    id: 'erzhan',
    name: 'Ержан',
    role: 'Старый мудрец',
    description: 'Знает древние легенды и помогает находить скрытые тропы.',
    image: '/hero-realistic.png',
    unlock: 'Нужен 3 уровень',
    level: 3,
    coins: 0,
  },
  {
    id: 'aiaru',
    name: 'Айару',
    role: 'Охотница',
    description: 'Меткая лучница и следопыт, сильна в лесу и горах.',
    image: '/hero-realistic.png',
    unlock: 'Нужно 500 монет',
    level: 1,
    coins: 500,
  },
  {
    id: 'bekzat',
    name: 'Бекзат',
    role: 'Главарь разбойников',
    description: 'Сильный воин, открывается после серьёзных испытаний.',
    image: '/hero-realistic.png',
    unlock: '7 уровень и 800 монет',
    level: 7,
    coins: 800,
  },
  {
    id: 'temir',
    name: 'Темир',
    role: 'Рудокоп',
    description: 'Крепкий герой из рудников, выдерживает тяжёлые схватки.',
    image: '/hero-realistic.png',
    unlock: '10 уровень и 1000 монет',
    level: 10,
    coins: 1000,
  },
  {
    id: 'tulpar',
    name: 'Тулпар',
    role: 'Легендарный конь',
    description: 'Быстрее ветра. Открывается за богатство и славу.',
    image: '/rider-horse-realistic.png',
    unlock: '12 уровень и 1500 монет',
    level: 12,
    coins: 1500,
  },
];

const CHARACTER_GROUPS: { kind: CharacterKind; title: string }[] = [
  { kind: 'hero', title: 'Главные герои' },
  { kind: 'enemy', title: 'Враги' },
  { kind: 'important', title: 'Важные персонажи' },
  { kind: 'horse', title: 'Лошади' },
  { kind: 'secret', title: 'Секретный персонаж' },
];

void CHARACTERS;
void CHARACTER_GROUPS;

function getCharacterImage(character: { id: string; kind: CharacterKind }) {
  return `/characters/${character.id}.png`;
}

function Key({ children }: { children: string }) {
  return <span className="control-key">{children}</span>;
}

function ControlsScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="controls-page">
      <img className="controls-bg" src="/steppe-clean-bg.png" alt="" draggable={false} />
      <div className="controls-frame">
        <button className="controls-back" onClick={onBack}>Назад</button>
        <header className="controls-title">
          <h1>Управление</h1>
          <p>Все управление интуитивно и просто</p>
        </header>

        <main className="controls-grid">
          <section className="control-card movement">
            <h2>Передвижение</h2>
            <div className="control-art">
              <img src="/rider-horse-realistic.png" alt="" draggable={false} />
              <div className="wasd">
                <Key>W</Key>
                <Key>A</Key>
                <Key>S</Key>
                <Key>D</Key>
              </div>
            </div>
            <p>Движение героя</p>
            <div className="control-row">
              <Key>Shift</Key>
              <span>Ускорение (скачка)</span>
              <i className="horse-symbol" />
            </div>
          </section>

          <section className="control-card interaction">
            <h2>Взаимодействие</h2>
            <div className="control-art">
              <img src="/rider-horse-realistic.png" alt="" draggable={false} />
              <div className="npc-mark">!</div>
              <div className="npc" />
            </div>
            <div className="control-row">
              <Key>E</Key>
              <span>Поговорить / Взаимодействовать</span>
            </div>
          </section>

          <section className="control-card combat">
            <h2>Бой</h2>
            <div className="control-art battle">
              <img src="/rider-horse-realistic.png" alt="" draggable={false} />
              <div className="enemy" />
              <div className="enemy-health" />
            </div>
            <div className="mouse-row">
              <span><i className="mouse left" />Левая кнопка мыши<br />Атака</span>
              <span><i className="mouse right" />Правая кнопка мыши<br />Блок / Защита</span>
            </div>
          </section>

          <section className="control-card other">
            <h2>Другие действия</h2>
            <ul>
              <li><Key>I</Key><span>Инвентарь</span></li>
              <li><Key>M</Key><span>Карта мира</span></li>
              <li><Key>Q</Key><span>Квесты</span></li>
              <li><Key>L</Key><span>Легенда / Дневник</span></li>
              <li><Key>Esc</Key><span>Меню паузы</span></li>
            </ul>
          </section>

          <section className="control-card mounted">
            <h2>На лошади</h2>
            <ul>
              <li><Key>↑</Key><span>Призвать лошадь<br /><small>(если лошадь рядом)</small></span></li>
              <li><Key>H</Key><span>Слезть с лошади</span></li>
              <li><Key>Space</Key><span>Прыжок<br /><small>(через препятствия)</small></span></li>
            </ul>
          </section>

          <section className="control-card ui-card">
            <h2>Интерфейс</h2>
            <div className="ui-layout">
              <div className="portrait-ui" />
              <div className="bars-ui">
                <span className="bar red" />
                <span className="bar yellow" />
                <span className="bar blue" />
              </div>
              <div className="mini-map" />
            </div>
            <p>Быстрые слоты (предметы / навыки)</p>
            <div className="slots">
              {['1', '2', '3', '4', '5', '6'].map(slot => <span key={slot}>{slot}</span>)}
            </div>
          </section>
        </main>

        <footer className="controls-tip">
          <span className="tip-icon" />
          <p>Исследуйте мир, выполняйте задания, сражайтесь с врагами и станьте легендой степи!</p>
          <span className="tip-yurt" />
        </footer>
      </div>
    </div>
  );
}

function CharacterCatalog({
  selectedCharacter,
  selectedHorse,
  progress,
  coins,
  onSelect,
  onBack,
}: {
  selectedCharacter: string;
  selectedHorse: string;
  progress: ReturnType<typeof readPlayerProgress>;
  coins: number;
  onSelect: (character: { id: string; kind: CharacterKind }) => void;
  onBack: () => void;
}) {
  return (
    <div className="characters-page">
      <img className="characters-bg" src="/steppe-clean-bg.png" alt="" draggable={false} />
      <div className="characters-frame">
        <button className="characters-back" onClick={onBack}>Назад</button>
        <header className="characters-title">
          <p>Легенда степного всадника</p>
          <h1>Персонажи</h1>
          <span>Уровень {progress.level} · {coins} монет · {completionPercent(progress)}%</span>
        </header>

        <section className="characters-section">
          <h2>Главные герои</h2>
          <div className="character-grid">
            {CHARACTER_LIST.map(character => {
              const unlocked = isCharacterUnlocked(character, progress, coins);
              const selected = character.kind === 'horse'
                ? selectedHorse === character.id
                : selectedCharacter === character.id;
              const canSelect = unlocked && character.selectable;
              const bonusText = [
                character.bonus.strength ? `Сила +${character.bonus.strength}` : '',
                character.bonus.speed ? `Скорость +${character.bonus.speed}` : '',
                character.bonus.vision ? `Зрение +${character.bonus.vision}` : '',
                character.bonus.endurance ? `Выносливость +${character.bonus.endurance}` : '',
              ].filter(Boolean).join(' · ');

              return (
                <article
                  className={`character-card character-${character.id} ${unlocked ? 'unlocked' : 'locked'} ${selected ? 'selected' : ''}`}
                  key={character.id}
                >
                  <div className="character-art">
                    <img
                      className={`character-image image-${character.id}`}
                      src={getCharacterImage(character)}
                      alt=""
                      draggable={false}
                    />
                    {!unlocked && <div className="character-lock">Закрыто</div>}
                  </div>
                  <div className="character-copy">
                    <h3>{character.name}</h3>
                    <strong>{character.role}</strong>
                    <p>{character.description}</p>
                    <span>{unlocked ? bonusText || 'Коллекционный персонаж' : character.unlock}</span>
                  </div>
                  <button
                    type="button"
                    disabled={!canSelect}
                    onClick={() => onSelect({ id: character.id, kind: character.kind })}
                  >
                    {selected ? 'Выбран' : unlocked ? 'Выбрать' : 'Недоступен'}
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

const CATEGORY_LABELS: Record<ShopCategory, string> = {
  weapon: 'Оружие',
  shield: 'Щиты',
  potion: 'Зелья',
  food: 'Еда',
};

function ShopScreen({
  coins,
  inventory,
  onBuy,
  onBack,
}: {
  coins: number;
  inventory: string[];
  onBuy: (id: string) => void;
  onBack: () => void;
}) {
  return (
    <div className="shop-page">
      <img className="shop-bg" src="/steppe-clean-bg.png" alt="" draggable={false} />
      <div className="shop-frame">
        <button className="shop-back" onClick={onBack}>Назад</button>
        <header className="shop-title">
          <p>Торговая лавка</p>
          <h1>Магазин</h1>
          <span>{coins} монет · куплено {inventory.length}</span>
        </header>

        {(Object.keys(CATEGORY_LABELS) as ShopCategory[]).map(category => (
          <section className="shop-section" key={category}>
            <h2>{CATEGORY_LABELS[category]}</h2>
            <div className="shop-grid">
              {SHOP_ITEMS.filter(item => item.category === category).map(item => {
                const owned = inventory.includes(item.id);
                const canBuy = coins >= item.price && !owned;
                const effects = [
                  item.effect.strength ? `Сила +${item.effect.strength}` : '',
                  item.effect.speed ? `Бег +${item.effect.speed}` : '',
                  item.effect.vision ? `Зрение +${item.effect.vision}` : '',
                  item.effect.endurance ? `Выносливость +${item.effect.endurance}` : '',
                ].filter(Boolean).join(' · ');

                return (
                  <article className={`shop-item ${owned ? 'owned' : ''}`} key={item.id}>
                    <div className={`shop-icon ${item.category} item-${item.id}`} />
                    <div>
                      <h3>{item.name}</h3>
                      <p>{item.description}</p>
                      <span>{effects}</span>
                    </div>
                    <button disabled={!canBuy} onClick={() => onBuy(item.id)}>
                      {owned ? 'Куплено' : `${item.price} монет`}
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export function MainMenu({ onPlay }: { onPlay: () => void; hasSave?: boolean }) {
  const [controlsOpen, setControlsOpen] = useState(false);
  const [charactersOpen, setCharactersOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [coins, setCoins] = useState(() => readCoins());
  const [inventory, setInventory] = useState(() => readInventory());
  const [playerProgress] = useState(() => readPlayerProgress());
  const [selectedCharacter, setSelectedCharacter] = useState(() => readSelectedCharacter());
  const [selectedHorse, setSelectedHorse] = useState(() => readSelectedHorse());

  if (controlsOpen) {
    return <ControlsScreen onBack={() => setControlsOpen(false)} />;
  }

  if (charactersOpen) {
    return (
      <CharacterCatalog
        selectedCharacter={selectedCharacter}
        selectedHorse={selectedHorse}
        progress={playerProgress}
        coins={coins}
        onBack={() => setCharactersOpen(false)}
        onSelect={(character) => {
          if (character.kind === 'horse') {
            setSelectedHorse(character.id);
            writeSelectedHorse(character.id);
            return;
          }

          setSelectedCharacter(character.id);
          writeSelectedCharacter(character.id);
        }}
      />
    );
  }

  if (shopOpen) {
    return (
      <ShopScreen
        coins={coins}
        inventory={inventory}
        onBack={() => setShopOpen(false)}
        onBuy={(id) => {
          const item = SHOP_ITEMS.find(entry => entry.id === id);
          if (!item || inventory.includes(id) || coins < item.price) return;

          const nextCoins = coins - item.price;
          const nextInventory = [...inventory, id];
          setCoins(nextCoins);
          setInventory(nextInventory);
          writeCoins(nextCoins);
          writeInventory(nextInventory);
        }}
      />
    );
  }

  return (
    <div className="menu">
      <img className="menu-bg" src="/steppe-clean-bg.png" alt="" draggable={false} />
      <div className="menu-vignette" />
      <img className="menu-rider" src="/rider-horse-realistic.png" alt="" draggable={false} />

      <header className="menu-top">
        <div className="player-card">
          <div className="player-portrait" />
          <div>
            <strong>Степной Всадник</strong>
            <span>Уровень {playerProgress.level} · {completionPercent(playerProgress)}%</span>
          </div>
        </div>

        <nav className="tool-row" aria-label="Быстрые действия">
          {TOP_TOOLS.map((tool, index) => (
            <button
              key={tool}
              type="button"
              aria-label={tool}
              onClick={tool === 'Настройки' ? () => setControlsOpen(true) : undefined}
            >
              <i>{index + 1}</i>
              <span>{tool}</span>
            </button>
          ))}
        </nav>
      </header>

      <main className="menu-center">
        <p className="saga-label">Steppe Saga</p>
        <h1>
          <span>Legend of the</span>
          Steppe Rider
        </h1>

        <div className="menu-stack" aria-label="Главное меню">
          {MENU_ITEMS.map(item => (
            <button
              key={item.label}
              className={item.primary ? 'menu-choice primary' : 'menu-choice'}
              type="button"
              onClick={
                item.primary || item.label === 'Продолжить'
                  ? onPlay
                  : item.label === 'Персонажи'
                    ? () => setCharactersOpen(true)
                  : item.label === 'Магазин'
                    ? () => setShopOpen(true)
                  : item.label === 'Настройки'
                    ? () => setControlsOpen(true)
                    : undefined
              }
            >
              <i data-icon={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
