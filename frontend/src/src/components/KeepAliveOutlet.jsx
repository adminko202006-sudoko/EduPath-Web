import { useLocation, useOutlet } from 'react-router-dom';
import { useState } from 'react';

const KeepAliveOutlet = () => {
  const location = useLocation();
  const outlet = useOutlet();

  const [cache, setCache] = useState(() => new Map());

  const routeKey = `${location.pathname}${location.search}`;

  // Keep previously visited routes mounted (so their state is preserved) while
  // hiding them. This is the React-endorsed "adjust state during render"
  // pattern: guarded so it only runs once per unseen route, then stabilizes.
  if (outlet && !cache.has(routeKey)) {
    setCache(new Map(cache).set(routeKey, outlet));
  }

  return (
    <div className="w-full">
      {Array.from(cache.entries()).map(
        ([key, element]) => (
          <div
            key={key}
            style={{
              display:
                key === routeKey
                  ? 'block'
                  : 'none',
            }}
            className="w-full"
          >
            {element}
          </div>
        )
      )}
    </div>
  );
};

export default KeepAliveOutlet;