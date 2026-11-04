import { useState } from 'react';
import { ACTIVITES } from '../libelles.js';
import { useMissions, CarteMission, SansMission } from './Commun.jsx';
import { IcoAlerte } from '../Icones.jsx';
import { messageErreur } from '../supabase.js';

export default function Missions() {
  const { chargement, missions, erreur } = useMissions();
  const [type, setType] = useState('');
  const liste = type ? missions.filter((m) => m.type === type) : missions;

  return (
    <section className="section" style={{ paddingTop: 48 }}>
      <div className="container">
        <div className="section-head">
          <div>
            <span className="kicker">Missions ouvertes</span>
            <h2>Trouvez votre prochaine mission</h2>
          </div>
          <p>Chaque mission indique le lieu, les dates et la rémunération. Pas de mission qui vous convient ? Postulez sans en choisir : nous vous rappellerons.</p>
        </div>

        <div className="filtres" role="group" aria-label="Filtrer par activité">
          <button className="chip" aria-pressed={type === ''} onClick={() => setType('')}>Toutes</button>
          {ACTIVITES.map((a) => (
            <button key={a.k} className="chip" aria-pressed={type === a.k} onClick={() => setType(a.k)}>{a.l}</button>
          ))}
        </div>

        {erreur && (
          <div className="alert alert-danger" style={{ marginBottom: 20 }}><IcoAlerte />{messageErreur(erreur)}</div>
        )}
        {chargement ? (
          <div className="missions-grid">{[0, 1, 2, 3].map((i) => <div className="squelette" key={i} />)}</div>
        ) : liste.length ? (
          <div className="missions-grid">{liste.map((m) => <CarteMission key={m.id} m={m} />)}</div>
        ) : (
          <SansMission />
        )}
      </div>
    </section>
  );
}
