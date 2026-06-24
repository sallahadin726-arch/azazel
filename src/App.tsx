import { useEffect, useMemo, useState } from 'react';
import { MainMenu } from './components/MainMenu';
import { Game } from './components/Game';
import { MapSelect } from './components/MapSelect';
import { supabase } from './lib/supabase';
import type { LocationId } from './game/world';

const SAVE_KEY = 'azazel-save-session';

// «Legend of the Steppe Rider»: главное меню → игра.
export default function App() {
  const [screen, setScreen] = useState<'menu' | 'map' | 'game'>('menu');
  const [destination, setDestination] = useState<LocationId | null>(null);
  const [hasSave, setHasSave] = useState(false);

  const saveSessionId = useMemo(() => {
    const stored = window.localStorage.getItem(SAVE_KEY);
    if (stored) return stored;

    const next = crypto.randomUUID?.() ?? `save-${Date.now()}`;
    window.localStorage.setItem(SAVE_KEY, next);
    return next;
  }, []);

  useEffect(() => {
    let ignore = false;

    async function checkSave() {
      const { data } = await supabase
        .from('game_progress')
        .select('session_id')
        .eq('session_id', saveSessionId)
        .maybeSingle();

      if (!ignore) {
        setHasSave(Boolean(data));
      }
    }

    void checkSave();
    return () => {
      ignore = true;
    };
  }, [saveSessionId]);

  if (screen === 'menu') return <MainMenu onPlay={() => setScreen('map')} hasSave={hasSave} />;

  if (screen === 'map') {
    return (
      <MapSelect
        onBack={() => setScreen('menu')}
        onSelect={(location) => {
          setDestination(location);
          setScreen('game');
        }}
      />
    );
  }

  return (
    <main className="app">
      <Game destination={destination} onExit={() => setScreen('menu')} saveSessionId={saveSessionId} />
    </main>
  );
}
