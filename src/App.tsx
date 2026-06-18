import { useState } from 'react';
import { MainMenu } from './components/MainMenu';
import { Game } from './components/Game';
import { MapSelect } from './components/MapSelect';
import type { LocationId } from './game/world';

// «Legend of the Steppe Rider»: главное меню → игра.
// Auth/Entries из стартового шаблона сохранены в src/components —
// подключишь, когда захочешь сохранять прогресс игрока в Supabase.
export default function App() {
  const [screen, setScreen] = useState<'menu' | 'map' | 'game'>('menu');
  const [destination, setDestination] = useState<LocationId | null>(null);

  if (screen === 'menu') return <MainMenu onPlay={() => setScreen('map')} />;

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
      <Game destination={destination} onExit={() => setScreen('menu')} />
    </main>
  );
}
