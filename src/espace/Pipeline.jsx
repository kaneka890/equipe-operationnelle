import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase, messageErreur } from '../supabase.js';
import { ETAPES, ACTIVITES, libelleType, initiales, JOURS } from '../libelles.js';
import { IcoRecherche, IcoAlerte, IcoEtoile } from '../Icones.jsx';
import Fiche from './Fiche.jsx';
import { liensPhotos } from '../photo.js';

export default function Pipeline({ peutAgir, moi }) {
  const [liste, setListe] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [q, setQ] = useState('');
  const [activite, setActivite] = useState('');
  const [voirRefus, setVoirRefus] = useState(false);
  const [ouvert, setOuvert] = useState(null);
  const [photos, setPhotos] = useState({});

  const charger = useCallback(async () => {
    const { data, error } = await supabase.from('v_candidats').select('*').order('cree_le', { ascending: false });
    setChargement(false);
    if (error) { setErreur(messageErreur(error)); return; }
    setErreur('');
    setListe(data || []);
    const manquantes = (data || []).map((c) => c.photo_chemin).filter(Boolean);
    if (manquantes.length) {
      const liens = await liensPhotos(manquantes);
      setPhotos((p) => ({ ...p, ...liens }));
    }
  }, []);

  useEffect(() => { charger(); }, [charger]);

  const filtres = useMemo(() => {
    const t = q.trim().toLowerCase();
    return liste.filter((c) =>
      (!activite || c.activites.includes(activite)) &&
      (!t || `${c.nom} ${c.quartier} ${c.ville} ${c.telephone}`.toLowerCase().includes(t)));
  }, [liste, q, activite]);

  const colonnes = [...ETAPES, ...(voirRefus ? [{ k: 'refusee', l: 'Refusés' }] : [])];
  const maintenant = Date.now();
  const kpi = {
    actifs: liste.filter((c) => c.etape !== 'refusee').length,
    nouvelles: liste.filter((c) => c.etape === 'nouvelle').length,
    entretiens: liste.filter((c) => c.etape === 'entretien' && c.entretien_le && new Date(c.entretien_le).getTime() > maintenant).length,
    valides: liste.filter((c) => c.etape === 'validee').length,
  };
  const courant = ouvert ? liste.find((c) => c.id === ouvert) : null;

  return (
    <>
      <div className="main-head">
        <div>
          <h1>Candidatures</h1>
          <p>{peutAgir ? 'Ouvrez une fiche pour noter l’entretien, faire avancer ou affecter à une mission.' : 'Lecture seule : la direction consulte sans modifier.'}</p>
        </div>
        <div className="toolbar">
          <label className="search">
            <IcoRecherche taille={18} />
            <span className="sr">Rechercher</span>
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom, quartier, numéro…" />
          </label>
          <select className="select" value={activite} onChange={(e) => setActivite(e.target.value)} aria-label="Filtrer par activité">
            <option value="">Toutes les activités</option>
            {ACTIVITES.map((a) => <option key={a.k} value={a.k}>{a.l}</option>)}
          </select>
          <label className="check" style={{ alignItems: 'center' }}>
            <input type="checkbox" checked={voirRefus} onChange={(e) => setVoirRefus(e.target.checked)} />
            Voir les refusés
          </label>
        </div>
      </div>

      <div className="kpis">
        <div className="kpi"><span>Dossiers en cours</span><strong className="tnum">{kpi.actifs}</strong></div>
        <div className="kpi"><span>Nouvelles à étudier</span><strong className="tnum">{kpi.nouvelles}</strong></div>
        <div className="kpi"><span>Entretiens à venir</span><strong className="tnum">{kpi.entretiens}</strong></div>
        <div className="kpi"><span>Promoteurs validés</span><strong className="tnum">{kpi.valides}</strong></div>
      </div>

      {erreur && <div className="alert alert-danger"><IcoAlerte />{erreur}</div>}

      <div className="board-wrap">
        <div className={`board${voirRefus ? ' avec-refus' : ''}`}>
          {colonnes.map((col) => {
            const cartes = filtres.filter((c) => c.etape === col.k);
            return (
              <section className="col" key={col.k} aria-label={col.l}>
                <div className="col-head"><h2>{col.l}</h2><span className="n tnum">{cartes.length}</span></div>
                {chargement && <div className="squelette" style={{ minHeight: 120, borderRadius: 12 }} />}
                {!chargement && !cartes.length && <p className="rien">Aucun dossier</p>}
                {cartes.map((c) => (
                  <button key={c.id} className="carte" aria-pressed={ouvert === c.id} onClick={() => setOuvert(c.id)}>
                    <span className="qui">
                      <span className="av">{photos[c.photo_chemin] ? <img src={photos[c.photo_chemin]} alt="" /> : initiales(c.nom)}</span>
                      <span style={{ minWidth: 0 }}>
                        <span className="nom" style={{ display: 'block' }}>{c.nom}</span>
                        <span className="ou">{c.quartier} · {c.age} ans</span>
                      </span>
                    </span>
                    <span className="tags">{c.activites.map((a) => <span className="tag tag-amber" key={a}>{libelleType(a)}</span>)}</span>
                    <span className="pied">
                      <span>{JOURS.filter((j) => c.jours.includes(j.k)).map((j) => j.l).join(' · ')}</span>
                      {c.moyenne != null && <span className="note-badge tnum"><IcoEtoile taille={14} />{String(c.moyenne).replace('.', ',')}</span>}
                    </span>
                  </button>
                ))}
              </section>
            );
          })}
        </div>
      </div>

      {courant && (
        <Fiche c={courant} photo={photos[courant.photo_chemin]} peutAgir={peutAgir} moi={moi} onFermer={() => setOuvert(null)} onChange={charger} />
      )}
    </>
  );
}
