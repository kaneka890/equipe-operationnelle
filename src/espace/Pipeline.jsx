import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase, messageErreur } from '../supabase.js';
import { ETAPES, ACTIVITES, libelleType, initiales, telAffiche, jourAn } from '../libelles.js';
import { IcoRecherche, IcoAlerte } from '../Icones.jsx';
import Fiche from './Fiche.jsx';
import { liensPhotos } from '../photo.js';

const LIB_ETAPE = Object.fromEntries([...ETAPES.map((e) => [e.k, e.l]), ['refusee', 'Refusés']]);
const STATUT = Object.fromEntries([...ETAPES.map((e) => [e.k, e.court]), ['refusee', 'Non retenu(e)']]);

// Registre des candidatures : un tableau, filtré par étape (onglets) et par activité.
export default function Pipeline({ peutAgir, moi }) {
  const [liste, setListe] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [q, setQ] = useState('');
  const [activite, setActivite] = useState('');
  const [etape, setEtape] = useState('');
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

  const recherches = useMemo(() => {
    const t = q.trim().toLowerCase();
    return liste.filter((c) =>
      (!activite || c.activites.includes(activite)) &&
      (!t || `${c.nom} ${c.quartier} ${c.ville} ${c.telephone} ${c.code_suivi}`.toLowerCase().includes(t)));
  }, [liste, q, activite]);

  const compte = (k) => recherches.filter((c) => (k ? c.etape === k : c.etape !== 'refusee')).length;
  const lignes = recherches.filter((c) => (etape ? c.etape === etape : c.etape !== 'refusee'));
  const courant = ouvert ? liste.find((c) => c.id === ouvert) : null;
  const onglets = [{ k: '', l: 'Dossiers en cours' }, ...ETAPES, { k: 'refusee', l: 'Refusés' }];

  return (
    <>
      <div className="main-head">
        <div>
          <p className="main-fil">Recrutement / Registre</p>
          <h1>Registre des candidatures</h1>
          <p>{peutAgir ? 'Sélectionnez un dossier pour l’étudier, fixer l’entretien, le noter ou l’affecter à une mission.' : 'Accès en lecture seule (direction).'}</p>
        </div>
      </div>

      <div className="registre">
        <div className="onglets registre-onglets" role="group" aria-label="Filtrer par étape">
          {onglets.map((o) => (
            <button key={o.k || 'tous'} className="onglet" aria-pressed={etape === o.k} onClick={() => setEtape(o.k)}>
              {o.k ? LIB_ETAPE[o.k] : o.l} <span className="tnum">{compte(o.k)}</span>
            </button>
          ))}
        </div>

        <div className="registre-outils">
          <label className="search">
            <IcoRecherche taille={16} />
            <span className="sr">Rechercher</span>
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom, commune, téléphone ou n° de dossier" />
          </label>
          <select className="select" value={activite} onChange={(e) => setActivite(e.target.value)} aria-label="Filtrer par activité">
            <option value="">Toutes les activités</option>
            {ACTIVITES.map((a) => <option key={a.k} value={a.k}>{a.l}</option>)}
          </select>
          <span className="registre-total tnum">{lignes.length} dossier{lignes.length > 1 ? 's' : ''}</span>
        </div>

        {erreur && <div className="alert alert-danger" style={{ margin: 16 }}><IcoAlerte />{erreur}</div>}

        <div className="registre-table-wrap">
          <table className="registre-table">
            <thead>
              <tr>
                <th>N° dossier</th>
                <th>Candidat(e)</th>
                <th>Téléphone</th>
                <th>Commune</th>
                <th>Activités</th>
                <th>Déposé le</th>
                <th>Note</th>
                <th>Étape</th>
              </tr>
            </thead>
            <tbody>
              {chargement && <tr><td colSpan={8} className="registre-vide">Chargement du registre…</td></tr>}
              {!chargement && !lignes.length && <tr><td colSpan={8} className="registre-vide">Aucun dossier dans cette rubrique.</td></tr>}
              {lignes.map((c) => (
                <tr key={c.id} aria-selected={ouvert === c.id} onClick={() => setOuvert(c.id)}>
                  <td className="tnum mono">{c.code_suivi}</td>
                  <td>
                    <button className="registre-nom" onClick={(e) => { e.stopPropagation(); setOuvert(c.id); }}>
                      <span className="av av-carre">{photos[c.photo_chemin] ? <img src={photos[c.photo_chemin]} alt="" /> : initiales(c.nom)}</span>
                      <span><strong>{c.nom}</strong><small>{c.age} ans</small></span>
                    </button>
                  </td>
                  <td className="tnum">{telAffiche(c.telephone)}</td>
                  <td>{c.quartier}{c.ville ? `, ${c.ville}` : ''}</td>
                  <td>{c.activites.map(libelleType).join(', ')}</td>
                  <td className="tnum">{jourAn(c.cree_le)}</td>
                  <td className="tnum">{c.moyenne != null ? `${String(c.moyenne).replace('.', ',')} / 5` : '—'}</td>
                  <td><span className={`statut statut-${c.etape}`}>{STATUT[c.etape]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {courant && (
        <Fiche c={courant} photo={photos[courant.photo_chemin]} peutAgir={peutAgir} moi={moi} onFermer={() => setOuvert(null)} onChange={charger} />
      )}
    </>
  );
}
