import { useEffect, useRef, useState } from 'react';
import {
  ACTIVITY_INFO,
  LOCATION_ACTIVITIES,
  MAX_LEVEL,
  SHOP,
  STAT_INFO,
  upgradeCost,
  type ActivityId,
  type Gear,
  type HeroStats,
  type StatId,
} from '../game/progress';
import type { LocationId } from '../game/world';
import { LOCATIONS } from '../game/world';

// API, которое игра передаёт во все активности.
export type GameApi = {
  gold: number;
  stats: HeroStats;
  equipment: string[];
  powers: { speed: number; endurance: number; archery: number };
  reward: (gold: number, rep: number, msg: string) => void;
  upgrade: (stat: StatId) => void;
  buy: (gear: Gear) => void;
};

const sleep = (ms: number) => new Promise<void>((res) => window.setTimeout(res, ms));
const rnd = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// ====================================================================
// Оболочка модального окна
// ====================================================================
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="ov" onClick={onClose}>
      <div className="ov-card" onClick={(e) => e.stopPropagation()}>
        <div className="ov-head">
          <h2>{title}</h2>
          <button className="ov-x" onClick={onClose}>✕</button>
        </div>
        <div className="ov-body">{children}</div>
      </div>
    </div>
  );
}

// Экран результата для мини-игр
function Result({ win, gold, rep, again, onMenu }: { win: boolean; gold: number; rep: number; again: () => void; onMenu: () => void }) {
  return (
    <div className="mini-result">
      <h3>{win ? '🎉 Победа!' : '💢 Не вышло…'}</h3>
      <p>🪙 +{gold} золота · ⭐ +{rep} репутации</p>
      <div className="row">
        <button className="btn primary" onClick={again}>↻ Ещё раз</button>
        <button className="btn" onClick={onMenu}>← К занятиям</button>
      </div>
    </div>
  );
}

// ====================================================================
// 🏇 Гонки на лошадях — кликер на скорость
// ====================================================================
function RaceGame({ api, onMenu }: { api: GameApi; onMenu: () => void }) {
  const TICKS = 50; // 5 секунд
  const [phase, setPhase] = useState<'ready' | 'run' | 'done'>('ready');
  const [me, setMe] = useState(0);
  const [foe, setFoe] = useState(0);
  const [t, setT] = useState(TICKS);
  const paid = useRef(false);
  const GOAL = 400;
  const foeRate = 4 + Math.max(0, 3 - api.powers.speed * 0.3); // соперник чуть медленнее у прокачанных

  useEffect(() => {
    if (phase !== 'run') return;
    const iv = window.setInterval(() => {
      setFoe((f) => f + foeRate + Math.random() * 3);
      setT((x) => x - 1);
    }, 100);
    return () => window.clearInterval(iv);
  }, [phase, foeRate]);

  useEffect(() => {
    if (phase === 'run' && t <= 0) setPhase('done');
  }, [t, phase]);

  if (phase === 'done') {
    const win = me >= foe;
    if (!paid.current) {
      paid.current = true;
      api.reward(win ? 50 : 10, win ? 3 : 0, win ? '🏇 Ты выиграл гонку!' : '🏇 Гонка проиграна.');
    }
    return (
      <Result win={win} gold={win ? 50 : 10} rep={win ? 3 : 0}
        again={() => { paid.current = false; setMe(0); setFoe(0); setT(TICKS); setPhase('ready'); }}
        onMenu={onMenu} />
    );
  }

  return (
    <div className="mini">
      <p className="mini-desc">Жми «Гони!» как можно быстрее. Каждый рывок: +{(6 + api.powers.speed * 1.5).toFixed(1)} (скорость лошади Lv {api.powers.speed}).</p>
      <div className="race-track"><div className="race-h" style={{ left: `${Math.min(100, (me / GOAL) * 100)}%` }}>🐎</div></div>
      <div className="race-track foe"><div className="race-h" style={{ left: `${Math.min(100, (foe / GOAL) * 100)}%` }}>🐴</div></div>
      <p className="mini-stat">⏱️ {phase === 'run' ? (t / 10).toFixed(1) + ' c' : 'готов'} · ты {Math.round(me)} : {Math.round(foe)} соперник</p>
      {phase === 'ready'
        ? <button className="btn primary big" onClick={() => setPhase('run')}>🚩 Старт</button>
        : <button className="btn gold big" onClick={() => setMe((m) => m + 6 + api.powers.speed * 1.5)}>🐎 Гони!</button>}
    </div>
  );
}

// ====================================================================
// ✉️ Доставка сообщений — «Саймон»: запомни и повтори маршрут
// ====================================================================
const PADS = [
  { id: 0, label: '⬆️', cls: 'p0' },
  { id: 1, label: '➡️', cls: 'p1' },
  { id: 2, label: '⬇️', cls: 'p2' },
  { id: 3, label: '⬅️', cls: 'p3' },
];
function DeliveryGame({ api, onMenu }: { api: GameApi; onMenu: () => void }) {
  const [seq, setSeq] = useState<number[]>([]);
  const [round, setRound] = useState(0);
  const [active, setActive] = useState<number | null>(null);
  const [phase, setPhase] = useState<'idle' | 'show' | 'input' | 'done'>('idle');
  const [pos, setPos] = useState(0);
  const [won, setWon] = useState(false);
  const alive = useRef(true);
  const paid = useRef(false);
  const MAX_ROUNDS = 4;
  useEffect(() => () => { alive.current = false; }, []);

  async function playSequence(s: number[]) {
    setPhase('show');
    await sleep(500);
    for (const p of s) {
      if (!alive.current) return;
      setActive(p); await sleep(450);
      setActive(null); await sleep(220);
    }
    if (!alive.current) return;
    setPos(0);
    setPhase('input');
  }

  function startRound() {
    const next = [...seq, rnd(0, 3)];
    setSeq(next);
    setRound(next.length);
    void playSequence(next);
  }

  function press(id: number) {
    if (phase !== 'input') return;
    if (id !== seq[pos]) { finish(false); return; }
    const np = pos + 1;
    if (np >= seq.length) {
      if (seq.length >= MAX_ROUNDS + 1) { finish(true); return; }
      setPhase('idle');
      window.setTimeout(startRound, 600);
    } else {
      setPos(np);
    }
  }

  function finish(win: boolean) {
    setWon(win);
    setPhase('done');
  }

  if (phase === 'done') {
    const delivered = won ? round : Math.max(0, round - 1);
    const gold = delivered * (15 + api.powers.endurance * 3);
    const rep = delivered;
    if (!paid.current) {
      paid.current = true;
      api.reward(gold, rep, `✉️ Доставлено сообщений: ${delivered}.`);
    }
    return (
      <Result win={delivered > 0} gold={gold} rep={rep}
        again={() => { paid.current = false; setSeq([]); setRound(0); setPos(0); setWon(false); setPhase('idle'); }}
        onMenu={onMenu} />
    );
  }

  return (
    <div className="mini">
      <p className="mini-desc">Запомни маршрут гонца и повтори. Доставлено: <b>{Math.max(0, round - (phase === 'input' ? 1 : 0))}</b>. Выносливость Lv {api.powers.endurance} = больше золота.</p>
      <div className="simon">
        {PADS.map((p) => (
          <button key={p.id} className={`pad ${p.cls} ${active === p.id ? 'on' : ''}`}
            disabled={phase !== 'input'} onClick={() => press(p.id)}>{p.label}</button>
        ))}
      </div>
      <p className="mini-stat">{phase === 'show' ? '👀 Смотри…' : phase === 'input' ? '⌨️ Повтори маршрут!' : 'Готов в путь'}</p>
      {phase === 'idle' && <button className="btn primary big" onClick={startRound}>🐎 Выехать с письмом</button>}
    </div>
  );
}

// ====================================================================
// 🔍 Поиск потерянных вещей — найди ячейку с пропажей
// ====================================================================
function SearchGame({ api, onMenu }: { api: GameApi; onMenu: () => void }) {
  const SIZE = 16; // 4×4
  const [target] = useState(() => rnd(0, SIZE - 1));
  const [open, setOpen] = useState<number[]>([]);
  const [left, setLeft] = useState(4 + api.powers.archery);
  const [hint, setHint] = useState('Где-то здесь спрятана пропажа…');
  const [phase, setPhase] = useState<'play' | 'done'>('play');
  const [found, setFound] = useState(false);
  const paid = useRef(false);

  function dist(a: number, b: number) {
    return Math.abs((a % 4) - (b % 4)) + Math.abs(Math.floor(a / 4) - Math.floor(b / 4));
  }
  function dig(i: number) {
    if (phase !== 'play' || open.includes(i)) return;
    const no = [...open, i];
    setOpen(no);
    if (i === target) { setFound(true); setPhase('done'); return; }
    const l = left - 1;
    setLeft(l);
    const d = dist(i, target);
    setHint(d <= 1 ? '🔥 Горячо!' : d <= 2 ? '🌤️ Тепло' : '❄️ Холодно');
    if (l <= 0) setPhase('done');
  }

  if (phase === 'done') {
    if (!paid.current) {
      paid.current = true;
      api.reward(found ? 40 : 5, found ? 2 : 0, found ? '🔍 Пропажа найдена!' : '🔍 Поиски ничего не дали.');
    }
    return (
      <Result win={found} gold={found ? 40 : 5} rep={found ? 2 : 0}
        again={onMenu} onMenu={onMenu} />
    );
  }

  return (
    <div className="mini">
      <p className="mini-desc">Зоркость лучника (Lv {api.powers.archery}) даёт больше попыток. Осталось копков: <b>{left}</b>.</p>
      <div className="grid16">
        {Array.from({ length: SIZE }, (_, i) => (
          <button key={i} className={`cell ${open.includes(i) ? 'dug' : ''}`} onClick={() => dig(i)} disabled={open.includes(i)}>
            {open.includes(i) ? (i === target ? '🎁' : '·') : '⛰️'}
          </button>
        ))}
      </div>
      <p className="mini-stat">{hint}</p>
    </div>
  );
}

// ====================================================================
// ⚔️ Сражение с разбойниками — пошаговый бой
// ====================================================================
function CombatGame({ api, onMenu }: { api: GameApi; onMenu: () => void }) {
  const heroMax = 20 + api.powers.endurance * 4;
  const [hp, setHp] = useState(heroMax);
  const [foe, setFoe] = useState(24);
  const [guard, setGuard] = useState(false);
  const [turn, setTurn] = useState<'hero' | 'foe'>('hero');
  const [log, setLog] = useState<string[]>(['Разбойник преграждает путь!']);
  const [phase, setPhase] = useState<'fight' | 'done'>('fight');
  const [won, setWon] = useState(false);
  const paid = useRef(false);
  const add = (m: string) => setLog((p) => [m, ...p].slice(0, 5));

  function enemyTurn(curHp: number) {
    let dmg = rnd(4, 7);
    if (guard) { dmg = Math.ceil(dmg / 2); setGuard(false); }
    const nh = curHp - dmg;
    add(`👹 Разбойник бьёт на ${dmg}.`);
    setHp(nh);
    if (nh <= 0) { setPhase('done'); setWon(false); return; }
    setTurn('hero');
  }

  function act(kind: 'melee' | 'shoot' | 'guard') {
    if (turn !== 'hero' || phase !== 'fight') return;
    let nf = foe;
    if (kind === 'melee') { const d = rnd(4, 7); nf -= d; add(`⚔️ Удар на ${d}.`); }
    else if (kind === 'shoot') {
      const chance = Math.min(0.95, 0.55 + api.powers.archery * 0.07);
      if (Math.random() < chance) { const d = rnd(7, 11) + api.powers.archery; nf -= d; add(`🏹 Выстрел точно в цель: ${d}!`); }
      else add('🏹 Промах!');
    } else { setGuard(true); const heal = Math.min(heroMax - hp, 3); setHp((h) => h + heal); add(`🛡️ Защита${heal ? `, +${heal} HP` : ''}.`); }

    setFoe(nf);
    if (nf <= 0) { setPhase('done'); setWon(true); return; }
    setTurn('foe');
    window.setTimeout(() => enemyTurn(hp), 700);
  }

  if (phase === 'done') {
    if (!paid.current) {
      paid.current = true;
      api.reward(won ? 60 : 0, won ? 4 : 0, won ? '⚔️ Разбойник повержен!' : '⚔️ Пришлось отступить…');
    }
    return (
      <Result win={won} gold={won ? 60 : 0} rep={won ? 4 : 0}
        again={() => { paid.current = false; setHp(heroMax); setFoe(24); setGuard(false); setTurn('hero'); setWon(false); setLog(['Новый разбойник!']); setPhase('fight'); }}
        onMenu={onMenu} />
    );
  }

  return (
    <div className="mini">
      <div className="hp-row"><span>🤠 Всадник</span><div className="hp-bar"><div style={{ width: `${(hp / heroMax) * 100}%` }} /></div><b>{Math.max(0, hp)}/{heroMax}</b></div>
      <div className="hp-row"><span>👹 Разбойник</span><div className="hp-bar foe"><div style={{ width: `${(foe / 24) * 100}%` }} /></div><b>{Math.max(0, foe)}/24</b></div>
      <div className="row wrap">
        <button className="btn primary" disabled={turn !== 'hero'} onClick={() => act('melee')}>⚔️ Удар</button>
        <button className="btn gold" disabled={turn !== 'hero'} onClick={() => act('shoot')}>🏹 Выстрел</button>
        <button className="btn" disabled={turn !== 'hero'} onClick={() => act('guard')}>🛡️ Защита</button>
      </div>
      <ul className="combat-log">{log.map((m, i) => <li key={i}>{m}</li>)}</ul>
    </div>
  );
}

// ====================================================================
// 📈 Тренировка (прокачка)
// ====================================================================
function TrainingPanel({ api }: { api: GameApi }) {
  return (
    <div className="mini">
      <p className="mini-desc">Вкладывай золото в характеристики героя. У тебя 🪙 {api.gold}.</p>
      {(Object.keys(STAT_INFO) as StatId[]).map((id) => {
        const info = STAT_INFO[id];
        const lvl = api.stats[id];
        const cost = upgradeCost(lvl, info.base);
        const maxed = lvl >= MAX_LEVEL;
        return (
          <div className="up-row" key={id}>
            <div className="up-main">
              <span className="up-name">{info.emoji} {info.name}</span>
              <span className="dots">{Array.from({ length: MAX_LEVEL }, (_, i) => <i key={i} className={i < lvl ? 'on' : ''} />)}</span>
            </div>
            <button className="btn primary" disabled={maxed || api.gold < cost} onClick={() => api.upgrade(id)}>
              {maxed ? 'МАКС' : `↑ 🪙${cost}`}
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ====================================================================
// 🛒 Лавка экипировки
// ====================================================================
function ShopPanel({ api }: { api: GameApi }) {
  return (
    <div className="mini">
      <p className="mini-desc">Экипировка постоянно усиливает героя. У тебя 🪙 {api.gold}.</p>
      <div className="shop">
        {SHOP.map((g) => {
          const owned = api.equipment.includes(g.id);
          return (
            <div className="gear" key={g.id}>
              <span className="gear-emoji">{g.emoji}</span>
              <div className="gear-info">
                <b>{g.name}</b>
                <small>{g.desc} (+{g.bonus} {STAT_INFO[g.stat].emoji})</small>
              </div>
              <button className="btn gold" disabled={owned || api.gold < g.price} onClick={() => api.buy(g)}>
                {owned ? '✓ есть' : `🪙${g.price}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ====================================================================
// Меню активностей локации + маршрутизатор
// ====================================================================
export function ActivityOverlay({
  overlay, setOverlay, location, api, onClose,
}: {
  overlay: 'menu' | ActivityId;
  setOverlay: (o: 'menu' | ActivityId | null) => void;
  location: LocationId;
  api: GameApi;
  onClose: () => void;
}) {
  const loc = LOCATIONS[location];
  const acts = LOCATION_ACTIVITIES[location];

  if (overlay === 'menu') {
    return (
      <Modal title={`${loc.emoji} ${loc.name} — чем займёмся?`} onClose={onClose}>
        <div className="act-list">
          {acts.length === 0 && <p className="mini-desc">Здесь нет занятий — только тайна легенды.</p>}
          {acts.map((a) => {
            const info = ACTIVITY_INFO[a];
            return (
              <button key={a} className="act-card" onClick={() => setOverlay(a)}>
                <span className="act-emoji">{info.emoji}</span>
                <span className="act-text"><b>{info.name}</b><small>{info.desc}</small></span>
                <span className="act-go">▶</span>
              </button>
            );
          })}
        </div>
      </Modal>
    );
  }

  const info = ACTIVITY_INFO[overlay];
  const back = () => setOverlay('menu');
  return (
    <Modal title={`${info.emoji} ${info.name}`} onClose={onClose}>
      {overlay === 'race' && <RaceGame api={api} onMenu={back} />}
      {overlay === 'delivery' && <DeliveryGame api={api} onMenu={back} />}
      {overlay === 'search' && <SearchGame api={api} onMenu={back} />}
      {overlay === 'combat' && <CombatGame api={api} onMenu={back} />}
      {overlay === 'train' && <><TrainingPanel api={api} /><button className="btn block" onClick={back}>← К занятиям</button></>}
      {overlay === 'shop' && <><ShopPanel api={api} /><button className="btn block" onClick={back}>← К занятиям</button></>}
    </Modal>
  );
}
