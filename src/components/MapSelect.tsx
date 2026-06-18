import '../game/map.css';
import { LOCATIONS, LOCATION_ORDER, type LocationId } from '../game/world';

export function MapSelect({
  onSelect,
  onBack,
}: {
  onSelect: (location: LocationId) => void;
  onBack: () => void;
}) {
  return (
    <div className="map-select">
      <div className="map-panel" aria-label="Карта мира">
        <button className="map-back" onClick={onBack} aria-label="Назад" />
        <div className="map-hotspots">
          {LOCATION_ORDER.map((id) => {
            const loc = LOCATIONS[id];
            return (
              <button
                key={id}
                className="map-pin"
                style={{ left: `${loc.x}%`, top: `${loc.y}%` }}
                onClick={() => onSelect(id)}
                aria-label={`Выбрать: ${loc.name}`}
                title={loc.name}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
