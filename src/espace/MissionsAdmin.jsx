import { useCallback, useEffect, useState } from 'react';
import { supabase, messageErreur } from '../supabase.js';
import { TYPES_MISSION, STATUTS_MISSION, libelleType, periode, fcfa } from '../libelles.js';
import { IcoPlus, IcoX, IcoAlerte } from '../Icones.jsx';

const NOUVELLE = {
  partenaire_id: '', type: 'degustation', titre: '', description: '', lieu: '', ville: 'Abidjan',
  date_debut: '', date_fin: '', horaires: '', tarif_jour: '', places: '2', statut: 'ouverte',
};

export default function MissionsAdmin({ peutAgir }) {
  const [missions, setMissions] = useState([]);
  const [partenaires, setPartenaires] = useState([]);
  const [occupees, setOccupees] = useState({});
  const [erreur, setErreur] = useState('');
  const [modal, setModal] = useState(null); // 'mission' | 'partenaire'
  const [chargement, setChargement] = useState(true);

  const charger = useCallback(async () => {
    const [mi, pa, af] = await Promise.all([
      supabase.from('missions_terrain').select('*, partenaires(nom)').order('date_debut', { ascending: false }),
      supabase.from('partenaires').select('*').order('nom'),
      supabase.from('affectations_mission').select('mission_id').neq('statut', 'annulee'),
    ]);
    setChargement(false);
    const err = mi.error || pa.error || af.error;
    if (err) { setErreur(messageErreur(err)); return; }
    setMissions(mi.data || []);
    setPartenaires(pa.data || []);
    const n = {};
    (af.data || []).forEach((a) => { n[a.mission_id] = (n[a.mission_id] || 0) + 1; });
    setOccupees(n);
  }, []);

  useEffect(() => { charger(); }, [charger]);

  async function changerStatut(m, statut) {
    setErreur('');
    const { error } = await supabase.from('missions_terrain').update({ statut }).eq('id', m.id);
    if (error) setErreur(messageErreur(error));
    charger();
  }

  return (
    <>
      <div className="main-head">
        <div>
          <h1>Missions et partenaires</h1>
          <p>Une mission « ouverte » apparaît sur le site public, avec ses places restantes.</p>
        </div>
        {peutAgir && (
          <div className="toolbar">
            <button className="btn btn-ghost" onClick={() => setModal('partenaire')}><IcoPlus taille={18} />Partenaire</button>
            <button className="btn btn-primary" onClick={() => setModal('mission')} disabled={!partenaires.length}
              title={partenaires.length ? '' : 'Ajoutez d’abord un partenaire'}><IcoPlus taille={18} />Nouvelle mission</button>
          </div>
        )}
      </div>

      {erreur && <div className="alert alert-danger"><IcoAlerte />{erreur}</div>}
      {!chargement && !partenaires.length && (
        <div className="alert alert-info">Commencez par ajouter un partenaire : chaque mission est faite pour l’un d’eux.</div>
      )}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr><th>Mission</th><th>Partenaire</th><th>Dates</th><th>Tarif / jour</th><th>Places</th><th>Statut</th></tr>
          </thead>
          <tbody>
            {chargement && <tr><td colSpan={6}><div className="squelette" style={{ minHeight: 60 }} /></td></tr>}
            {!chargement && !missions.length && (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--ink-3)', padding: 40 }}>Aucune mission pour l’instant.</td></tr>
            )}
            {missions.map((m) => {
              const pris = occupees[m.id] || 0;
              return (
                <tr key={m.id}>
                  <td>
                    <strong style={{ display: 'block' }}>{m.titre}</strong>
                    <span className="hint">{libelleType(m.type)} · {m.lieu}{m.ville ? `, ${m.ville}` : ''}</span>
                  </td>
                  <td>{m.partenaires?.nom}</td>
                  <td>{periode(m.date_debut, m.date_fin)}</td>
                  <td className="tnum">{m.tarif_jour != null ? fcfa(m.tarif_jour) : '—'}</td>
                  <td>
                    <span className="places tnum">
                      <span className="track"><i style={{ width: `${Math.min(100, (pris / m.places) * 100)}%` }} /></span>
                      {pris} / {m.places}
                    </span>
                  </td>
                  <td>
                    <select className="select" value={m.statut} disabled={!peutAgir} aria-label={`Statut de ${m.titre}`}
                      onChange={(e) => changerStatut(m, e.target.value)}>
                      {STATUTS_MISSION.map((s) => <option key={s.k} value={s.k}>{s.l}</option>)}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h2 style={{ fontSize: 22, marginTop: 12 }}>Partenaires</h2>
      <div className="table-wrap">
        <table className="table" style={{ minWidth: 560 }}>
          <thead><tr><th>Nom</th><th>Contact</th><th>Sur le site public</th></tr></thead>
          <tbody>
            {!partenaires.length && <tr><td colSpan={3} style={{ color: 'var(--ink-3)' }}>Aucun partenaire.</td></tr>}
            {partenaires.map((p) => (
              <tr key={p.id}>
                <td><strong>{p.nom}</strong></td>
                <td>{[p.contact, p.telephone].filter(Boolean).join(' · ') || '—'}</td>
                <td>{p.afficher_nom ? <span className="tag tag-em">Nom affiché</span> : <span className="tag">Confidentiel</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal === 'mission' && <ModalMission partenaires={partenaires} onFermer={() => setModal(null)} onFait={() => { setModal(null); charger(); }} />}
      {modal === 'partenaire' && <ModalPartenaire onFermer={() => setModal(null)} onFait={() => { setModal(null); charger(); }} />}
    </>
  );
}

function Modal({ titre, onFermer, children, pied }) {
  useEffect(() => {
    const f = (e) => { if (e.key === 'Escape') onFermer(); };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, [onFermer]);
  return (
    <div className="modal" onMouseDown={(e) => { if (e.target === e.currentTarget) onFermer(); }}>
      <div className="modal-card" role="dialog" aria-modal="true" aria-label={titre}>
        <div className="modal-head"><h2>{titre}</h2><button className="btn btn-ghost btn-icon" aria-label="Fermer" onClick={onFermer}><IcoX /></button></div>
        <div className="modal-body">{children}</div>
        <div className="modal-foot">{pied}</div>
      </div>
    </div>
  );
}

function ModalMission({ partenaires, onFermer, onFait }) {
  const [f, setF] = useState({ ...NOUVELLE, partenaire_id: partenaires[0]?.id || '' });
  const [erreur, setErreur] = useState('');
  const [attente, setAttente] = useState(false);
  const maj = (k, v) => setF((x) => ({ ...x, [k]: v }));

  async function enregistrer() {
    setErreur('');
    if (f.titre.trim().length < 3) return setErreur('Donnez un titre à la mission.');
    if (f.lieu.trim().length < 2) return setErreur('Indiquez le lieu.');
    if (!f.date_debut || !f.date_fin) return setErreur('Indiquez les dates.');
    if (f.date_fin < f.date_debut) return setErreur('La date de fin est avant la date de début.');
    const places = parseInt(f.places, 10);
    if (!(places >= 1)) return setErreur('Indiquez le nombre de places.');
    setAttente(true);
    const { error } = await supabase.from('missions_terrain').insert({
      ...f,
      titre: f.titre.trim(), lieu: f.lieu.trim(), ville: f.ville.trim(),
      description: f.description.trim() || null, horaires: f.horaires.trim() || null,
      tarif_jour: f.tarif_jour === '' ? null : parseInt(String(f.tarif_jour).replace(/\D/g, ''), 10),
      places,
    });
    setAttente(false);
    if (error) return setErreur(error.code === '23514' ? 'Une information n’est pas valable. Vérifiez les champs.' : messageErreur(error));
    onFait();
  }

  return (
    <Modal titre="Nouvelle mission" onFermer={onFermer} pied={<>
      <button className="btn btn-ghost" onClick={onFermer}>Annuler</button>
      <button className="btn btn-primary" disabled={attente} onClick={enregistrer}>{attente ? 'Enregistrement…' : 'Créer la mission'}</button>
    </>}>
      <div className="grid-2">
        <label className="field"><span>Partenaire</span>
          <select className="select" value={f.partenaire_id} onChange={(e) => maj('partenaire_id', e.target.value)}>
            {partenaires.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
          </select>
        </label>
        <label className="field"><span>Activité</span>
          <select className="select" value={f.type} onChange={(e) => maj('type', e.target.value)}>
            {TYPES_MISSION.map((t) => <option key={t.k} value={t.k}>{t.l}</option>)}
          </select>
        </label>
      </div>
      <label className="field"><span>Titre</span>
        <input className="input" value={f.titre} onChange={(e) => maj('titre', e.target.value)} placeholder="Ex. : Dégustation de jus en rayon" />
      </label>
      <div className="grid-2">
        <label className="field"><span>Lieu</span>
          <input className="input" value={f.lieu} onChange={(e) => maj('lieu', e.target.value)} placeholder="Ex. : Supermarché de Cocody" />
        </label>
        <label className="field"><span>Ville</span>
          <input className="input" value={f.ville} onChange={(e) => maj('ville', e.target.value)} />
        </label>
      </div>
      <div className="grid-2">
        <label className="field"><span>Du</span><input className="input" type="date" value={f.date_debut} onChange={(e) => maj('date_debut', e.target.value)} /></label>
        <label className="field"><span>Au</span><input className="input" type="date" value={f.date_fin} onChange={(e) => maj('date_fin', e.target.value)} /></label>
      </div>
      <div className="grid-2">
        <label className="field"><span>Horaires <span className="hint">(facultatif)</span></span>
          <input className="input" value={f.horaires} onChange={(e) => maj('horaires', e.target.value)} placeholder="Ex. : 9 h – 17 h" />
        </label>
        <label className="field"><span>Tarif par jour (FCFA)</span>
          <input className="input" inputMode="numeric" value={f.tarif_jour} onChange={(e) => maj('tarif_jour', e.target.value)} placeholder="Laisser vide si à définir" />
        </label>
      </div>
      <div className="grid-2">
        <label className="field"><span>Places</span>
          <input className="input" type="number" min="1" max="500" value={f.places} onChange={(e) => maj('places', e.target.value)} />
        </label>
        <label className="field"><span>Statut</span>
          <select className="select" value={f.statut} onChange={(e) => maj('statut', e.target.value)}>
            <option value="ouverte">Ouverte (visible sur le site)</option>
            <option value="brouillon">Brouillon (cachée)</option>
          </select>
        </label>
      </div>
      <label className="field"><span>Description <span className="hint">(facultatif, visible sur le site)</span></span>
        <textarea className="textarea" value={f.description} onChange={(e) => maj('description', e.target.value)} />
      </label>
      {erreur && <div className="alert alert-danger" role="alert"><IcoAlerte />{erreur}</div>}
    </Modal>
  );
}

function ModalPartenaire({ onFermer, onFait }) {
  const [f, setF] = useState({ nom: '', contact: '', telephone: '', afficher_nom: true });
  const [erreur, setErreur] = useState('');
  const [attente, setAttente] = useState(false);
  const maj = (k, v) => setF((x) => ({ ...x, [k]: v }));

  async function enregistrer() {
    setErreur('');
    if (f.nom.trim().length < 2) return setErreur('Indiquez le nom du partenaire.');
    setAttente(true);
    const { error } = await supabase.from('partenaires').insert({
      nom: f.nom.trim(), contact: f.contact.trim() || null, telephone: f.telephone.trim() || null, afficher_nom: f.afficher_nom,
    });
    setAttente(false);
    if (error) return setErreur(messageErreur(error));
    onFait();
  }

  return (
    <Modal titre="Nouveau partenaire" onFermer={onFermer} pied={<>
      <button className="btn btn-ghost" onClick={onFermer}>Annuler</button>
      <button className="btn btn-primary" disabled={attente} onClick={enregistrer}>{attente ? 'Enregistrement…' : 'Ajouter'}</button>
    </>}>
      <label className="field"><span>Nom de la marque ou de l’entreprise</span>
        <input className="input" value={f.nom} onChange={(e) => maj('nom', e.target.value)} />
      </label>
      <div className="grid-2">
        <label className="field"><span>Contact <span className="hint">(facultatif)</span></span>
          <input className="input" value={f.contact} onChange={(e) => maj('contact', e.target.value)} />
        </label>
        <label className="field"><span>Téléphone <span className="hint">(facultatif)</span></span>
          <input className="input" type="tel" value={f.telephone} onChange={(e) => maj('telephone', e.target.value)} />
        </label>
      </div>
      <label className="check">
        <input type="checkbox" checked={f.afficher_nom} onChange={(e) => maj('afficher_nom', e.target.checked)} />
        <span>Afficher son nom sur le site public. Décochez pour une mission confidentielle : les candidats le découvriront à l’entretien.</span>
      </label>
      {erreur && <div className="alert alert-danger" role="alert"><IcoAlerte />{erreur}</div>}
    </Modal>
  );
}
