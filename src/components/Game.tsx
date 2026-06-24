import { useEffect, useMemo, useRef, useState } from 'react';
import '../game/game.css';
import { getShopBonuses, readInventory, writeCoins, readCoins } from '../game/shop';
import { addProgressXp, completionPercent, readPlayerProgress } from '../game/playerProgress';
import { getCharacterBonuses, readSelectedCharacter, readSelectedHorse } from '../game/characters';
import { LOCATIONS, type LocationId } from '../game/world';
import { supabase } from '../lib/supabase';

const FINISH_X = 214;
const CASTLE_DOOR_X = 218;
const WORLD_WIDTH_PERCENT = 240;
const CAMERA_FOLLOW_SCREEN_X = 42;
const MAX_CAMERA_X = WORLD_WIDTH_PERCENT - 100;
const OBSTACLES = [78, 142, 194];
const BOSS_X = 207;
const BOSS_MAX_HP = 100;
const HERO_MAX_HP = 120;
const ENDLESS_HERO_X = 42;
const ENDLESS_START_OBSTACLE_X = 172;
const ENDLESS_RESET_X = 224;
const ENDLESS_BASE_SPEED = 34;
const ENDLESS_SPEED_STEP = 2.6;

type GameMode = 'story' | 'endless';

function toWorldPercent(x: number) {
  return 4 + (x / CASTLE_DOOR_X) * 72;
}

function readLocalSave(sessionId: string) {
  try {
    const raw = window.localStorage.getItem(`azazel-local-save-${sessionId}`);
    return raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function writeLocalSave(sessionId: string, payload: Record<string, unknown>) {
  try {
    window.localStorage.setItem(`azazel-local-save-${sessionId}`, JSON.stringify(payload));
  } catch {
    // ignore storage errors
  }
}

export function Game({
  destination,
  onExit,
  saveSessionId,
}: {
  destination?: LocationId | null;
  onExit?: () => void;
  saveSessionId: string;
}) {
  const [heroX, setHeroX] = useState(18);
  const [cameraX, setCameraX] = useState(0);
  const [walkDir, setWalkDir] = useState<0 | -1 | 1>(0);
  const [jumping, setJumping] = useState(false);
  const [moving, setMoving] = useState(false);
  const [mounted, setMounted] = useState(true);
  const [insideCastle, setInsideCastle] = useState(false);
  const [rearing, setRearing] = useState(false);
  const [gold, setGold] = useState(350);
  const [saving, setSaving] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode>('story');
  const [inventory] = useState(() => readInventory());
  const [selectedCharacter] = useState(() => readSelectedCharacter());
  const [selectedHorse] = useState(() => readSelectedHorse());
  const bonuses = useMemo(() => {
    const shop = getShopBonuses(inventory);
    const character = getCharacterBonuses();

    return {
      strength: shop.strength + character.strength,
      speed: shop.speed + character.speed,
      vision: shop.vision + character.vision,
      endurance: shop.endurance + character.endurance,
    };
  }, [inventory]);
  const [clearedObstacles, setClearedObstacles] = useState<number[]>([]);
  const [bossHp, setBossHp] = useState(BOSS_MAX_HP);
  const [heroHp, setHeroHp] = useState(HERO_MAX_HP);
  const [bossDefeated, setBossDefeated] = useState(false);
  const [bossMessage, setBossMessage] = useState('Перепрыгивай препятствия и доберись до стража');
  const [endlessObstacleX, setEndlessObstacleX] = useState(ENDLESS_START_OBSTACLE_X);
  const [endlessScore, setEndlessScore] = useState(0);
  const [endlessBest, setEndlessBest] = useState(() => Number(window.localStorage.getItem('azazel-endless-best') ?? 0));
  const [endlessRunning, setEndlessRunning] = useState(true);
  const [endlessGameOver, setEndlessGameOver] = useState(false);
  const [playerProgress, setPlayerProgress] = useState(() => readPlayerProgress());
  const jumpUntil = useRef(0);
  const moveRef = useRef(false);
  const walkRef = useRef<0 | -1 | 1>(0);
  const rearRef = useRef(false);
  const heroXRef = useRef(heroX);
  const cameraXRef = useRef(cameraX);
  const mountedRef = useRef(mounted);
  const insideCastleRef = useRef(insideCastle);
  const clearedObstaclesRef = useRef<number[]>([]);
  const jumpingRef = useRef(false);
  const bossDefeatedRef = useRef(false);
  const endlessObstacleXRef = useRef(ENDLESS_START_OBSTACLE_X);
  const endlessScoreRef = useRef(0);
  const endlessRunningRef = useRef(true);
  const endlessGameOverRef = useRef(false);
  const runnerPauseUntil = useRef(0);

  const nearBoss = Math.abs(heroX - BOSS_X) < 12;
  const nearCastleDoor = bossDefeated && !mounted && Math.abs(heroX - CASTLE_DOOR_X) < 3;
  const canDismount = mounted && !insideCastle && (heroX >= FINISH_X || (!bossDefeated && heroX >= BOSS_X - 4));
  mountedRef.current = mounted;
  insideCastleRef.current = insideCastle;
  clearedObstaclesRef.current = clearedObstacles;
  bossDefeatedRef.current = bossDefeated;
  endlessObstacleXRef.current = endlessObstacleX;
  endlessScoreRef.current = endlessScore;
  endlessRunningRef.current = endlessRunning;
  endlessGameOverRef.current = endlessGameOver;

  const endlessSpeed = ENDLESS_BASE_SPEED + endlessScore * ENDLESS_SPEED_STEP + bonuses.speed * 0.8;

  function resetEndless() {
    heroXRef.current = ENDLESS_HERO_X;
    cameraXRef.current = 0;
    endlessObstacleXRef.current = ENDLESS_START_OBSTACLE_X;
    endlessScoreRef.current = 0;
    endlessRunningRef.current = true;
    endlessGameOverRef.current = false;
    jumpingRef.current = false;
    jumpUntil.current = 0;
    moveRef.current = true;
    rearRef.current = false;
    walkRef.current = 0;
    setHeroX(ENDLESS_HERO_X);
    setCameraX(0);
    setMounted(true);
    setInsideCastle(false);
    setMoving(true);
    setRearing(false);
    setJumping(false);
    setWalkDir(0);
    setEndlessObstacleX(ENDLESS_START_OBSTACLE_X);
    setEndlessScore(0);
    setEndlessRunning(true);
    setEndlessGameOver(false);
    setBossMessage('Бесконечный забег: прыгай через кости');
  }

  function switchMode(mode: GameMode) {
    setGameMode(mode);
    if (mode === 'endless') {
      resetEndless();
      return;
    }

    heroXRef.current = 18;
    cameraXRef.current = 0;
    moveRef.current = true;
    rearRef.current = false;
    walkRef.current = 0;
    setHeroX(18);
    setCameraX(0);
    setMounted(true);
    setInsideCastle(false);
    setMoving(true);
    setRearing(false);
    setJumping(false);
    setWalkDir(0);
    setBossMessage('Конь бежит сам. Прыгай через препятствия');
  }

  async function saveProgress() {
    setSaving(true);

    const payload = {
      session_id: saveSessionId,
      hero_x: heroX,
      mounted,
      inside_castle: insideCastle,
      gold,
      destination: destination ?? null,
      state_json: {
        hero_x: heroX,
        mounted,
        inside_castle: insideCastle,
        gold,
        boss_defeated: bossDefeated,
        destination: destination ?? null,
      },
      updated_at: new Date().toISOString(),
    };

    try {
      const { error } = await supabase.from('game_progress').upsert(payload, {
        onConflict: 'session_id',
      });

      if (error) {
        console.warn('Supabase save failed, using local fallback:', error);
      } else {
        writeLocalSave(saveSessionId, payload);
      }
    } catch (error) {
      console.warn('Supabase save error, using local fallback:', error);
    } finally {
      writeLocalSave(saveSessionId, payload);
      setSaving(false);
    }
  }

  function startRide() {
    if (!mounted || insideCastle) return;
    if (gameMode === 'endless') {
      if (endlessGameOverRef.current) resetEndless();
      return;
    }
    if (!bossDefeated && heroXRef.current >= BOSS_X - 4) return;
    moveRef.current = true;
    setMoving(true);
  }

  function jump() {
    if (!mounted || insideCastle) return;
    if (gameMode === 'endless' && endlessGameOverRef.current) {
      resetEndless();
      return;
    }
    const now = performance.now();
    if (now < jumpUntil.current) return;
    jumpUntil.current = now + 640;
    jumpingRef.current = true;
    setJumping(true);
    window.setTimeout(() => {
      jumpingRef.current = false;
      setJumping(false);
    }, 640);
  }

  function startRear() {
    if (!mounted || insideCastle) return;
    if (gameMode === 'endless') {
      jump();
      return;
    }
    if (nearBoss && !bossDefeated) {
      setBossMessage('Сначала слезь с коня, потом начинай схватку со стражем');
      return;
    }
    rearRef.current = true;
    moveRef.current = true;
    setRearing(true);
    setMoving(true);
  }

  function stopRear() {
    rearRef.current = false;
    moveRef.current = false;
    setRearing(false);
    setMoving(false);
  }

  function dismount() {
    if (gameMode === 'endless') return;
    if (!mounted || insideCastle) return;
    setMounted(false);
    setMoving(false);
    setRearing(false);
    rearRef.current = false;
    if (!bossDefeated && nearBoss) {
      setBossMessage('Схватка началась. Бей стража мечом');
    }
  }

  function enterCastle() {
    if (gameMode === 'endless') return;
    if (mounted || insideCastle || !nearCastleDoor) return;
    setInsideCastle(true);
    setPlayerProgress(addProgressXp(90, destination ?? 'aul', true));
    const reward = 100 + bonuses.strength * 5 + bonuses.vision * 3;
    setGold((value) => {
      const next = value + reward;
      writeCoins(readCoins() + reward);
      return next;
    });
  }

  function attackBoss() {
    if (gameMode === 'endless') {
      jump();
      return;
    }
    if (mounted || insideCastle) {
      setBossMessage('Сначала слезь с коня, потом начинай схватку');
      return;
    }
    if (!nearBoss) {
      setBossMessage('Подойди ближе к стражу');
      return;
    }
    if (bossDefeated) return;

    const damage = 18 + bonuses.strength * 4;
    setBossHp((hp) => {
      const next = Math.max(0, hp - damage);
      if (next <= 0) {
        setBossDefeated(true);
        setBossMessage('Страж побежден. Теперь можно войти в замок');
        runnerPauseUntil.current = performance.now() + 500;
        setPlayerProgress(addProgressXp(140, destination ?? 'aul', true));
        const reward = 180 + bonuses.strength * 10;
        setGold((value) => {
          const total = value + reward;
          writeCoins(readCoins() + reward);
          return total;
        });
      } else {
        setBossMessage(`Удар по стражу: -${damage}`);
      }
      return next;
    });

    if (!bossDefeatedRef.current) {
      const taken = Math.max(4, 14 - bonuses.endurance);
      setHeroHp((hp) => Math.max(10, hp - taken));
    }
  }

  function walk(direction: 0 | -1 | 1) {
    if (gameMode === 'endless') return;
    if (mounted || insideCastle) return;
    walkRef.current = direction;
    setWalkDir(direction);
  }

  useEffect(() => {
    if (gameMode === 'endless') return;

    heroXRef.current = 18;
    cameraXRef.current = 0;
    moveRef.current = false;
    rearRef.current = false;
    walkRef.current = 0;
    setHeroX(18);
    setCameraX(0);
    setMounted(true);
    setInsideCastle(false);
    moveRef.current = true;
    setMoving(true);
    setRearing(false);
    setWalkDir(0);
    setJumping(false);
    setClearedObstacles([]);
    setBossHp(BOSS_MAX_HP);
    setHeroHp(HERO_MAX_HP);
    setBossDefeated(false);
    setBossMessage('Конь бежит сам. Прыгай через препятствия');
  }, [destination, gameMode]);

  useEffect(() => {
    if (gameMode === 'endless') return;

    let ignore = false;

    async function loadProgress() {
      const fallback = readLocalSave(saveSessionId);

      const applyPayload = (payload: Record<string, unknown>) => {
        if (ignore) return;

        const state = payload.state_json && typeof payload.state_json === 'object'
          ? (payload.state_json as Record<string, unknown>)
          : {};

        const savedHeroX = typeof state.hero_x === 'number' ? state.hero_x : typeof payload.hero_x === 'number' ? payload.hero_x : 18;
        const nextHeroX = savedHeroX >= FINISH_X - 4 ? 18 : savedHeroX;
        heroXRef.current = nextHeroX;
        setHeroX(nextHeroX);
        setMounted(true);
        setInsideCastle(false);
        setGold(typeof state.gold === 'number' ? state.gold : typeof payload.gold === 'number' ? payload.gold : 350);
        setBossDefeated(Boolean(state.boss_defeated ?? payload.boss_defeated));
        if (Boolean(state.boss_defeated ?? payload.boss_defeated)) setBossHp(0);
      };

      try {
        const { data, error } = await supabase
          .from('game_progress')
          .select('hero_x, mounted, inside_castle, gold, destination, state_json')
          .eq('session_id', saveSessionId)
          .maybeSingle();

        if (!ignore && data) {
          applyPayload(data as Record<string, unknown>);
          writeLocalSave(saveSessionId, data as Record<string, unknown>);
          return;
        }

        if (!ignore && error && error.code !== 'PGRST116') {
          console.warn('Supabase load warning:', error);
        }

        if (!ignore && fallback) {
          applyPayload(fallback);
        }
      } catch (error) {
        console.warn('Supabase load error, using local fallback:', error);

        if (!ignore && fallback) {
          applyPayload(fallback);
        }
      }
    }

    void loadProgress();
    return () => {
      ignore = true;
    };
  }, [saveSessionId, gameMode]);

  useEffect(() => {
    const start = mounted ? window.setTimeout(startRide, 150) : 0;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === ' ' || event.key === 'ArrowUp') {
        event.preventDefault();
        if (gameMode === 'endless') jump();
        else if (mounted) jump();
        else enterCastle();
      }
      if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') {
        if (mounted) startRide();
        else walk(1);
      }
      if (event.key === 'ArrowLeft') {
        if (!mounted && !insideCastle) {
          walk(-1);
        }
      }
      if (event.key.toLowerCase() === 'a') {
        event.preventDefault();
        if (!mounted && !insideCastle) {
          walk(-1);
        }
      }
      if (event.key.toLowerCase() === 'f') {
        event.preventDefault();
        if (mounted && !insideCastle) {
          dismount();
        }
      }
      if (event.key.toLowerCase() === 'e') {
        event.preventDefault();
        if (gameMode === 'endless') {
          jump();
        } else if (!mounted && nearBoss && !bossDefeated) {
          attackBoss();
        } else if (mounted && !insideCastle) {
          startRear();
        }
      }
      if (event.key === 'Enter') {
        if (gameMode === 'endless') resetEndless();
        else enterCastle();
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (
        event.key === 'ArrowRight' ||
        event.key.toLowerCase() === 'd' ||
        event.key === 'ArrowLeft' ||
        event.key.toLowerCase() === 'a'
      ) {
        walk(0);
      }
      if (event.key.toLowerCase() === 'e') {
        stopRear();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      if (start) window.clearTimeout(start);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [mounted, insideCastle, nearCastleDoor, nearBoss, bossDefeated, bonuses.strength, bonuses.endurance, gameMode]);

  useEffect(() => {
    if (gameMode === 'endless') return;

    const saveTimer = window.setInterval(() => {
      void saveProgress();
    }, 1500);

    return () => window.clearInterval(saveTimer);
  }, [heroX, mounted, insideCastle, gold, destination, saveSessionId, bossDefeated, gameMode]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(40, now - last) / 1000;
      last = now;
      let nextHeroX = heroXRef.current;

      if (gameMode === 'endless') {
        if (endlessRunningRef.current && !endlessGameOverRef.current) {
          const nextObstacleX = endlessObstacleXRef.current - endlessSpeed * dt;
          const collision = Math.abs(nextObstacleX - ENDLESS_HERO_X) < 8;

          if (collision && !jumpingRef.current) {
            endlessRunningRef.current = false;
            endlessGameOverRef.current = true;
            moveRef.current = false;
            setMoving(false);
            setEndlessRunning(false);
            setEndlessGameOver(true);
            setBossMessage('Забег окончен. Нажми Space или RUN, чтобы начать снова');
          } else if (nextObstacleX < ENDLESS_HERO_X - 16) {
            const nextScore = endlessScoreRef.current + 1;
            const nextBest = Math.max(endlessBest, nextScore);
            endlessScoreRef.current = nextScore;
            endlessObstacleXRef.current = ENDLESS_RESET_X + Math.min(38, nextScore * 3);
            setEndlessScore(nextScore);
            setEndlessObstacleX(endlessObstacleXRef.current);
            setBossMessage(`Прыжок ${nextScore}. Конь ускоряется`);

            if (nextBest !== endlessBest) {
              setEndlessBest(nextBest);
              window.localStorage.setItem('azazel-endless-best', String(nextBest));
            }
          } else {
            endlessObstacleXRef.current = nextObstacleX;
            setEndlessObstacleX(nextObstacleX);
          }
        }

        if (heroXRef.current !== ENDLESS_HERO_X) {
          heroXRef.current = ENDLESS_HERO_X;
          setHeroX(ENDLESS_HERO_X);
        }
        if (cameraXRef.current !== 0) {
          cameraXRef.current = 0;
          setCameraX(0);
        }

        raf = requestAnimationFrame(tick);
        return;
      }

      if (
        mountedRef.current &&
        !insideCastleRef.current &&
        now > runnerPauseUntil.current &&
        !moveRef.current &&
        (bossDefeatedRef.current || nextHeroX < BOSS_X - 4)
      ) {
        moveRef.current = true;
        setMoving(true);
      }

      if (!mountedRef.current && !insideCastleRef.current && walkRef.current !== 0) {
        nextHeroX = Math.max(FINISH_X - 9, Math.min(CASTLE_DOOR_X + 1, nextHeroX + walkRef.current * 9 * dt));
      }

      if (moveRef.current) {
        const speed = (rearRef.current ? 20 : 16) + bonuses.speed * 0.9;
        nextHeroX = Math.min(FINISH_X, nextHeroX + speed * dt);

        const obstacle = OBSTACLES.find((x) => (
          !clearedObstaclesRef.current.includes(x) &&
          heroXRef.current < x &&
          nextHeroX >= x - 0.8
        ));

        if (obstacle !== undefined) {
          if (jumpingRef.current) {
            setClearedObstacles((items) => items.includes(obstacle) ? items : [...items, obstacle]);
            setPlayerProgress(addProgressXp(20, destination ?? 'aul'));
            setBossMessage('Отличный прыжок');
          } else {
            nextHeroX = obstacle - 7;
            moveRef.current = false;
            rearRef.current = false;
            runnerPauseUntil.current = now + 650;
            setMoving(false);
            setRearing(false);
            setHeroHp((hp) => Math.max(10, hp - 8));
            setBossMessage('Ударился! Прыгай через следующее препятствие');
          }
        }

        if (!bossDefeatedRef.current && nextHeroX >= BOSS_X - 4) {
          nextHeroX = BOSS_X - 4;
          moveRef.current = false;
          rearRef.current = false;
          runnerPauseUntil.current = Number.POSITIVE_INFINITY;
          setMoving(false);
          setRearing(false);
          setBossMessage('Страж замка ждёт. Слезь с коня и начинай бой');
        }

        if (nextHeroX >= FINISH_X) {
          moveRef.current = false;
          rearRef.current = false;
          setMoving(false);
          setRearing(false);
          const reward = 25 + bonuses.strength * 3;
          setGold((value) => {
            const next = value + reward;
            writeCoins(readCoins() + reward);
            return next;
          });
        }
      }

      if (nextHeroX !== heroXRef.current) {
        heroXRef.current = nextHeroX;
        setHeroX(nextHeroX);
      }

      // Camera Follow: cameraX is measured in screen-width percent.
      // Camera position is locked to the horse position. No damping is used
      // here, so when the horse stops, the camera stops on the same frame.
      const heroScreenX = (toWorldPercent(nextHeroX) / 100) * WORLD_WIDTH_PERCENT;
      const nextCameraX = Math.max(0, Math.min(MAX_CAMERA_X, heroScreenX - CAMERA_FOLLOW_SCREEN_X));

      if (nextCameraX !== cameraXRef.current) {
        cameraXRef.current = nextCameraX;
        setCameraX(nextCameraX);
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [bonuses.speed, bonuses.strength, gameMode, endlessSpeed, endlessBest]);

  const heroWorldX = toWorldPercent(heroX);
  const destinationName = destination ? LOCATIONS[destination].name : 'замок';
  const activeObstacleClass = `obstacle obstacle-${endlessScore % 3}`;

  return (
    <div className="pixel-game">
      <div className="screen">
        <section className={`play-scene location-${destination ?? 'aul'} mode-${gameMode}`}>
          <div className="world" style={{ left: `-${cameraX}%` }}>
            <div className="sky">
              <div className="cloud cloud-a" />
              <div className="cloud cloud-b" />
              <div className="cloud cloud-c" />
              <div className="mountain mountain-a" />
              <div className="mountain mountain-b" />
              <div className="mountain mountain-c" />
              <div className="mountain mountain-d" />
              <div className="snowcap snowcap-a" />
              <div className="snowcap snowcap-b" />
              <div className="snowcap snowcap-c" />
              <div className="trees trees-left" />
              <div className="trees trees-mid" />
              <div className="trees trees-right" />
              <div className="yurt" />
              <div className="quest-cart" />
              <div className="castle" />
            </div>
          </div>

          <div className="hud top-left">
            <div className="portrait">
              <span />
            </div>
            <div className="hud-bars">
              <div className="stat-bar red"><b style={{ width: `${(heroHp / HERO_MAX_HP) * 100}%` }} /><span>{gameMode === 'endless' ? `Счёт ${endlessScore}` : `${heroHp}/120`}</span></div>
              <div className="stat-bar blue"><b style={{ width: '100%' }} /><span>{gameMode === 'endless' ? `x${endlessSpeed.toFixed(0)}` : `${80 + bonuses.endurance * 8}/80`}</span></div>
              <div className="level">{gameMode === 'endless' ? `Рекорд ${endlessBest}` : `Lv. ${playerProgress.level}/9 · ${completionPercent(playerProgress)}%`}</div>
            </div>
          </div>

          <div className="top-right">
            <div className="mode-switch" aria-label="Режим игры">
              <button className={gameMode === 'story' ? 'active' : ''} onClick={() => switchMode('story')}>СЮЖЕТ</button>
              <button className={gameMode === 'endless' ? 'active' : ''} onClick={() => switchMode('endless')}>БЕСКОНЕЧНЫЙ</button>
            </div>
            <div className="destination">{gameMode === 'endless' ? 'Бесконечный забег' : `Куда: ${destinationName}`}</div>
            {gameMode === 'story' && <div className="coin"><i />{gold}</div>}
            {gameMode === 'story' && <span className="save-status">{saving ? 'сохр…' : 'сохр'}</span>}
            <button className="pause" onClick={onExit} aria-label="Пауза">Ⅱ</button>
          </div>

          <div className="world ground-world" style={{ left: `-${gameMode === 'endless' ? 0 : cameraX}%` }}>
            <div className="ground">
              {gameMode === 'story' && heroX > FINISH_X - 24 && (
                <img
                  className="destination-castle"
                  src="/castle-realistic.png"
                  alt=""
                  draggable={false}
                  style={{ left: `${toWorldPercent(CASTLE_DOOR_X + 14)}%` }}
                />
              )}
              {gameMode === 'story' && OBSTACLES.map((x, index) => (
                <div
                  className={`obstacle obstacle-${index} ${clearedObstacles.includes(x) ? 'cleared' : ''}`}
                  key={x}
                  style={{ left: `${toWorldPercent(x)}%` }}
                />
              ))}
              {gameMode === 'endless' && (
                <div
                  className={activeObstacleClass}
                  style={{ left: `${toWorldPercent(endlessObstacleX)}%` }}
                />
              )}
              {gameMode === 'story' && !bossDefeated && (
                <div className="boss" style={{ left: `${toWorldPercent(BOSS_X)}%` }}>
                  <div className="boss-health"><b style={{ width: `${bossHp}%` }} /></div>
                  <div className="boss-body" />
                </div>
              )}
              <div
                className={`rider selected-${selectedCharacter} horse-${selectedHorse} ${moving ? 'run' : ''} ${jumping ? 'jump' : ''} ${rearing ? 'rearing' : ''} ${mounted ? 'mounted' : 'dismounted'} ${walkDir ? 'walk' : ''} ${insideCastle ? 'inside' : ''}`}
                style={{ left: `${heroWorldX}%` }}
              >
                {mounted && (
                  <img className="rider-art" src="/rider-horse-realistic.png" alt="" draggable={false} />
                )}
                {!mounted && (
                  <img className="hero-art" src="/hero-realistic.png" alt="" draggable={false} />
                )}
              </div>
              {gameMode === 'story' && <div className="finish-flag" style={{ left: `${toWorldPercent(FINISH_X)}%` }}>{bossDefeated ? 'ЗАМОК' : 'СТРАЖ'}</div>}
            </div>
          </div>

          <div className="boss-message">{bossMessage}</div>
          {gameMode === 'endless' && (
            <div className={`endless-panel ${endlessGameOver ? 'danger' : ''}`}>
              <strong>{endlessGameOver ? 'ПРОИГРЫШ' : `СЧЁТ ${endlessScore}`}</strong>
              <span>скорость {endlessSpeed.toFixed(0)} · рекорд {endlessBest}</span>
            </div>
          )}

          <div className="controls left-controls">
            <button
              onPointerDown={() => walk(-1)}
              onPointerUp={() => walk(0)}
              onPointerLeave={() => walk(0)}
              onPointerCancel={() => walk(0)}
              aria-label={gameMode === 'endless' ? 'Нет действия' : 'Назад'}
            >
              ◀
            </button>
            <button
              className={!mounted && nearCastleDoor && gameMode === 'story' ? 'ready' : ''}
              onPointerDown={!mounted && nearCastleDoor && gameMode === 'story' ? enterCastle : undefined}
              onClick={!mounted && nearCastleDoor && gameMode === 'story' ? enterCastle : undefined}
              aria-label={!mounted && nearCastleDoor && gameMode === 'story' ? 'Войти в замок' : 'Вниз'}
            >
              {!mounted && nearCastleDoor && gameMode === 'story' ? 'ВПЕРЁД' : '▼'}
            </button>
            <button
              onPointerDown={gameMode === 'endless' && endlessGameOver ? resetEndless : mounted ? startRide : () => walk(1)}
              onPointerUp={() => walk(0)}
              onPointerLeave={() => walk(0)}
              onPointerCancel={() => walk(0)}
              onClick={gameMode === 'endless' && endlessGameOver ? resetEndless : mounted ? startRide : undefined}
              aria-label={gameMode === 'endless' && endlessGameOver ? 'Начать заново' : 'Вперед'}
            >
              {gameMode === 'endless' && endlessGameOver ? 'RE' : 'RUN'}
            </button>
          </div>

          <div className="controls right-controls">
            <button
              className="horse-btn"
              onPointerDown={gameMode === 'endless' ? jump : canDismount ? dismount : startRide}
              onClick={gameMode === 'endless' ? jump : canDismount ? dismount : startRide}
              aria-label={gameMode === 'endless' ? 'Прыжок' : canDismount ? 'Слезть с коня' : 'Скакать'}
            >
              {gameMode === 'endless' ? '↗' : canDismount ? '⇣' : '♞'}
            </button>
            <button
              className="sword-btn"
              onPointerDown={gameMode === 'endless' ? jump : !mounted && nearBoss && !bossDefeated ? attackBoss : mounted ? startRear : undefined}
              onPointerUp={stopRear}
              onPointerLeave={stopRear}
              onPointerCancel={stopRear}
              aria-label={gameMode === 'endless' ? 'Прыжок' : !mounted && nearBoss && !bossDefeated ? 'Атаковать стража' : 'Встать на дыбы'}
            >
              ⚔
            </button>
            <button
              className="jump-btn"
              onPointerDown={mounted ? jump : enterCastle}
              onClick={mounted ? jump : enterCastle}
              aria-label={mounted ? 'Прыжок' : 'Войти в замок'}
            >
              {mounted ? '↗' : '⇥'}
            </button>
          </div>

          {gameMode === 'story' && !mounted && !insideCastle && (
            <button
              className={`enter-castle-btn ${nearCastleDoor ? 'ready' : ''}`}
              onPointerDown={nearCastleDoor ? enterCastle : undefined}
              onClick={nearCastleDoor ? enterCastle : undefined}
              aria-label={nearCastleDoor ? 'Вперед в замок' : 'Подойди к воротам'}
            >
              {nearCastleDoor ? 'ВПЕРЁД В ЗАМОК' : 'ПОДОЙДИ К ВОРОТАМ'}
            </button>
          )}
        </section>
      </div>
    </div>
  );
}
