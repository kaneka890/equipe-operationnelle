import { useState } from 'react';
import { ACTIVITES } from '../libelles.js';
import { useMissions, CarteMission, SansMission, EntetePage } from './Commun.jsx';
import { IcoAlerte } from '../Icones.jsx';
import { messageErreur } from '../supabase.js';

export default function Missions() {
  const { chargement, missions, erreur } = useMissions();
  const [type, setType] = useState('');
  const liste = type ? missions.filter((m) => m.type === type) : missions;
  const nb = (k) => (k ? missions.filter((m) => m.type === k).length : missions.length);

  return (
    <>
      <EntetePage titre="Missions ouvertes" texte="Avis de recrutement en cours. Chaque avis précise le lieu, la période, les horaires, la rémunération et le nombre de postes. Une candidature peut aussi être déposée sans choisir de mission." />
      <section className="corps-page">
        <div className="container">
          <div className="onglets" role="group" aria-label="Filtrer par activité">
            <button className="onglet" aria-pressed={type === ''} onClick={() => setType('')}>Toutes <span className="tnum">{nb('')}</span></button>
            {ACTIVITES.map((a) => (
              <button key={a.k} className="onglet" aria-pressed={type === a.k} onClick={() => setType(a.k)}>{a.l} <span className="tnum">{nb(a.k)}</span></button>
            ))}
          </div>

          {erreur && (
            <div className="alert alert-danger" style={{ marginBottom: 20 }}><IcoAlerte />{messageErreur(erreur)}</div>
          )}
          {chargement ? (
            <div className="offres">{[0, 1].map((i) => <div className="squelette squelette-offre" key={i} />)}</div>
          ) : liste.length ? (
            <div className="offres">{liste.map((m) => <CarteMission key={m.id} m={m} />)}</div>
          ) : (
            <SansMission />
          )}
        </div>
      </section>
    </>
  );
}
