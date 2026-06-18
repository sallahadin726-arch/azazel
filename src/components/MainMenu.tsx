import '../game/menu.css';

const FEATURES = [
  { emoji: '🐎', label: 'Верховая езда' },
  { emoji: '⚔️', label: 'Сражения' },
  { emoji: '🏇', label: 'Гонки' },
  { emoji: '🗺️', label: 'Открытый мир' },
  { emoji: '🏹', label: 'Прокачка' },
];

export function MainMenu({ onPlay, hasSave }: { onPlay: () => void; hasSave?: boolean }) {
  return (
    <div className="menu">
      <div className="menu-bg" />
      <div className="menu-grade" />
      <div className="menu-glow" />

      {/* парящая пыль степи */}
      <div className="dust">
        {Array.from({ length: 14 }, (_, i) => <span key={i} className={`d d${i % 7}`} />)}
      </div>

      <div className="menu-content">
        <div className="eyebrow">⊹ STEPPE SAGA ⊹</div>

        <h1 className="logo">
          <span className="l1">LEGEND OF THE</span>
          <span className="l2">STEPPE&nbsp;RIDER</span>
        </h1>

        <div className="ornament"><i /><span>🐎</span><i /></div>

        {/* сцена-герой */}
        <div className="hero-scene">
          <div className="sun" />
          <div className="ridge" />
          <div className="rider">🏇</div>
          <div className="ground" />
        </div>

        <p className="tagline">Оседлай коня. Покори Великую степь. Найди сокровище Золотого хана.</p>

        <div className="cta">
          <button className="play-btn" onClick={onPlay}>
            <span className="pb-glow" />
            ▶ {hasSave ? 'ПРОДОЛЖИТЬ' : 'ИГРАТЬ'}
          </button>
        </div>

        <div className="features">
          {FEATURES.map((f) => (
            <span className="feat" key={f.label}>
              <b>{f.emoji}</b> {f.label}
            </span>
          ))}
        </div>
      </div>

      <div className="menu-foot">v1.0 · Сделано для nFactorial Teens</div>
    </div>
  );
}
