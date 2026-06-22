import { useEffect, useRef, useState } from 'react';
import '../game/game.css';
import { LOCATIONS, type LocationId } from '../game/world';

const FINISH_X = 214;
const CASTLE_DOOR_X = 218;
const WORLD_WIDTH_PERCENT = 240;
const CAMERA_FOLLOW_SCREEN_X = 42;
const MAX_CAMERA_X = WORLD_WIDTH_PERCENT - 100;

function toWorldPercent(x: number) {
  return 4 + (x / CASTLE_DOOR_X) * 72;
}

export function Game({ destination, onExit }: { destination?: LocationId | null; onExit?: () => void }) {
  const [heroX, setHeroX] = useState(18);
  const [cameraX, setCameraX] = useState(0);
  const [walkDir, setWalkDir] = useState<0 | -1 | 1>(0);
  const [jumping, setJumping] = useState(false);
  const [moving, setMoving] = useState(false);
  const [mounted, setMounted] = useState(true);
  const [insideCastle, setInsideCastle] = useState(false);
  const [rearing, setRearing] = useState(false);
  const [gold, setGold] = useState(350);
  const jumpUntil = useRef(0);
  const moveRef = useRef(false);
  const walkRef = useRef<0 | -1 | 1>(0);
  const rearRef = useRef(false);
  const heroXRef = useRef(heroX);
  const cameraXRef = useRef(cameraX);
  const mountedRef = useRef(mounted);
  const insideCastleRef = useRef(insideCastle);

  const nearCastleDoor = !mounted && Math.abs(heroX - CASTLE_DOOR_X) < 3;
  mountedRef.current = mounted;
  insideCastleRef.current = insideCastle;

  function startRide() {
    if (!mounted || insideCastle) return;
    moveRef.current = true;
    setMoving(true);
  }

  function jump() {
    if (!mounted || insideCastle) return;
    const now = performance.now();
    if (now < jumpUntil.current) return;
    jumpUntil.current = now + 640;
    setJumping(true);
    window.setTimeout(() => setJumping(false), 640);
  }

  function startRear() {
    if (!mounted || insideCastle) return;
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
    if (!mounted || insideCastle) return;
    setMounted(false);
    setMoving(false);
    setRearing(false);
    rearRef.current = false;
  }

  function enterCastle() {
    if (mounted || insideCastle || !nearCastleDoor) return;
    setInsideCastle(true);
    setGold((value) => value + 100);
  }

  function walk(direction: 0 | -1 | 1) {
    if (mounted || insideCastle) return;
    walkRef.current = direction;
    setWalkDir(direction);
  }

  useEffect(() => {
    const start = mounted ? window.setTimeout(startRide, 450) : 0;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === ' ' || event.key === 'ArrowUp') {
        event.preventDefault();
        if (mounted) jump();
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
        if (mounted && !insideCastle) {
          dismount();
        } else if (!mounted && !insideCastle) {
          walk(-1);
        }
      }
      if (event.key.toLowerCase() === 'e') {
        event.preventDefault();
        if (mounted && !insideCastle) {
          startRear();
        }
      }
      if (event.key === 'Enter') {
        enterCastle();
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
  }, [mounted, insideCastle, nearCastleDoor]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(40, now - last) / 1000;
      last = now;
      let nextHeroX = heroXRef.current;

      if (!mountedRef.current && !insideCastleRef.current && walkRef.current !== 0) {
        nextHeroX = Math.max(FINISH_X - 9, Math.min(CASTLE_DOOR_X + 1, nextHeroX + walkRef.current * 9 * dt));
      }

      if (moveRef.current) {
        const speed = rearRef.current ? 18 : 14;
        nextHeroX = Math.min(FINISH_X, nextHeroX + speed * dt);

        if (nextHeroX >= FINISH_X) {
          moveRef.current = false;
          rearRef.current = false;
          setMoving(false);
          setRearing(false);
          setGold((value) => value + 25);
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
  }, []);

  const heroWorldX = toWorldPercent(heroX);
  const destinationName = destination ? LOCATIONS[destination].name : 'замок';

  return (
    <div className="pixel-game">
      <div className="screen">
        <section className="play-scene">
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
              <div className="stat-bar red"><b style={{ width: '100%' }} /><span>120/120</span></div>
              <div className="stat-bar blue"><b style={{ width: '100%' }} /><span>80/80</span></div>
              <div className="level">Lv. 7</div>
            </div>
          </div>

          <div className="top-right">
            <div className="destination">Куда: {destinationName}</div>
            <div className="coin"><i />{gold}</div>
            <button className="pause" onClick={onExit} aria-label="Пауза">Ⅱ</button>
          </div>

          <div className="world ground-world" style={{ left: `-${cameraX}%` }}>
            <div className="ground">
              {heroX > FINISH_X - 24 && (
                <img
                  className="destination-castle"
                  src="/castle-realistic.png"
                  alt=""
                  draggable={false}
                  style={{ left: `${toWorldPercent(CASTLE_DOOR_X + 14)}%` }}
                />
              )}
              <div
                className={`rider ${moving ? 'run' : ''} ${jumping ? 'jump' : ''} ${rearing ? 'rearing' : ''} ${mounted ? 'mounted' : 'dismounted'} ${walkDir ? 'walk' : ''} ${insideCastle ? 'inside' : ''}`}
                style={{ left: `${heroWorldX}%` }}
              >
                {mounted && (
                  <img className="rider-art" src="/rider-horse-realistic.png" alt="" draggable={false} />
                )}
                {!mounted && (
                  <img className="hero-art" src="/hero-realistic.png" alt="" draggable={false} />
                )}
              </div>
              <div className="finish-flag" style={{ left: `${toWorldPercent(FINISH_X)}%` }}>ЗАМОК</div>
              {heroX >= FINISH_X && !insideCastle && (
                <div className="castle-action" style={{ left: `${toWorldPercent(mounted ? FINISH_X : CASTLE_DOOR_X)}%` }}>
                  {mounted ? 'Слезь с коня' : nearCastleDoor ? 'Войди в замок' : 'Иди к воротам'}
                </div>
              )}
              {insideCastle && (
                <div className="castle-action done" style={{ left: `${toWorldPercent(FINISH_X)}%` }}>
                  Квест выполнен
                </div>
              )}
            </div>
          </div>

          <div className="controls left-controls">
            <button
              onPointerDown={() => walk(-1)}
              onPointerUp={() => walk(0)}
              onPointerLeave={() => walk(0)}
              onPointerCancel={() => walk(0)}
              aria-label="Назад"
            >
              ◀
            </button>
            <button
              className={!mounted && nearCastleDoor ? 'ready' : ''}
              onPointerDown={!mounted && nearCastleDoor ? enterCastle : undefined}
              onClick={!mounted && nearCastleDoor ? enterCastle : undefined}
              aria-label={!mounted && nearCastleDoor ? 'Войти в замок' : 'Вниз'}
            >
              {!mounted && nearCastleDoor ? 'ВПЕРЁД' : '▼'}
            </button>
            <button
              onPointerDown={mounted ? startRide : () => walk(1)}
              onPointerUp={() => walk(0)}
              onPointerLeave={() => walk(0)}
              onPointerCancel={() => walk(0)}
              onClick={mounted ? startRide : undefined}
              aria-label="Вперед"
            >
              ▶
            </button>
          </div>

          <div className="controls right-controls">
            <button
              className="horse-btn"
              onPointerDown={heroX >= FINISH_X ? dismount : startRide}
              onClick={heroX >= FINISH_X ? dismount : startRide}
              aria-label={heroX >= FINISH_X ? 'Слезть с коня' : 'Скакать'}
            >
              {heroX >= FINISH_X ? '⇣' : '♞'}
            </button>
            <button
              className="sword-btn"
              onPointerDown={mounted ? startRear : undefined}
              onPointerUp={stopRear}
              onPointerLeave={stopRear}
              onPointerCancel={stopRear}
              aria-label="Встать на дыбы"
            >
              ⤴
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

          {!mounted && !insideCastle && (
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
