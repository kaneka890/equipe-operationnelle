import { useEffect, useState } from 'react';

// Navigation par « # » : aucune configuration côté hébergeur.
function lire() {
  const brut = window.location.hash.replace(/^#/, '') || '/';
  const [path, qs] = brut.split('?');
  return { path: path || '/', params: new URLSearchParams(qs || '') };
}

export function useRoute() {
  const [route, setRoute] = useState(lire);
  useEffect(() => {
    const f = () => {
      setRoute(lire());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', f);
    return () => window.removeEventListener('hashchange', f);
  }, []);
  return route;
}

export function aller(chemin) {
  window.location.hash = chemin;
}
