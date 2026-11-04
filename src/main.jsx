import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { useRoute } from './router.js';
import { Topbar, Footer } from './public/Commun.jsx';
import Accueil from './public/Accueil.jsx';
import Missions from './public/Missions.jsx';
import Campagnes from './public/Campagnes.jsx';
import Postuler from './public/Postuler.jsx';
import Suivi from './public/Suivi.jsx';

function App() {
  const { path, params } = useRoute();

  let page;
  if (path === '/missions') page = <Missions />;
  else if (path === '/campagnes') page = <Campagnes />;
  else if (path === '/postuler') page = <Postuler key={params.get('mission') || ''} missionId={params.get('mission')} />;
  else if (path === '/suivi') page = <Suivi codeInitial={params.get('code') || ''} />;
  else page = <Accueil />;

  return (
    <>
      <Topbar chemin={path} />
      <main>{page}</main>
      <Footer />
    </>
  );
}

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>);
