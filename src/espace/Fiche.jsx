import { useCallback, useEffect, useState } from 'react';
import { supabase, messageErreur } from '../supabase.js';
import {
  ETAPES, CRITERES, JOURS, CRENEAUX, EXPERIENCES, STATUTS_AFFECTATION, libelleType, libelleEtape,
  etapeSuivante, initiales, telAffiche, dateHeure, court, jourAn, periode,
} from '../libelles.js';
import { IcoX, IcoAlerte, IcoWhatsapp, IcoCalendrier } from '../Icones.jsx';

const ACTIONS = { etape: 'Étape', entretien: 'Entretien fixé', affectation: 'Mission', remarque: 'Remarque' };

export default function Fiche({ c, photo, peutAgir, moi, onFermer, onChange }) {
  const [notes, setNotes] = useState({});
  const [journal, setJournal] = useState([]);
  const [affectations, setAffectations] = useState([]);
  const [missions, setMissions] = useState([]);
  const [erreur, setErreur] = useState('');
  const [occupe, setOccupe] = useState(false);
  const [refus, setRefus] = useState(null);       // texte du motif quand on refuse
  const [entretien, setEntretien] = useState(null); // { le, lieu } quand on le fixe
  const [remarque, setRemarque] = useState('');
  const [missionChoisie, setMissionChoisie] = useState('');

  const charger = useCallback(async () => {
    const [ev, jr, af, mi] = await Promise.all([
      supabase.from('evaluations_candidat').select('critere, note').eq('candidat_id', c.id),
      supabase.from('journal_candidats').select('*').eq('candidat_id', c.id).order('le', { ascending: false }),
      supabase.from('affectations_mission').select('id, statut, le, missions_terrain(titre, lieu, date_debut, date_fin)').eq('candidat_id', c.id).order('le', { ascending: false }),
      supabase.from('missions_terrain').select('id, titre, lieu, date_debut, date_fin, places').eq('statut', 'ouverte').gte('date_fin', new Date().toISOString().slice(0, 10)).order('date_debut'),
    ]);
    setNotes(Object.fromEntries((ev.data || []).map((n) => [n.critere, n.note])));
    setJournal(jr.data || []);
    setAffectations(af.data || []);
    setMissions(mi.data || []);
  }, [c.id]);

  useEffect(() => {
    charger();
    setRefus(null); setEntretien(null); setErreur(''); setRemarque(''); setMissionChoisie('');
  }, [charger]);

  useEffect(() => {
    const f = (e) => { if (e.key === 'Escape') onFermer(); };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, [onFermer]);

  async function agir(fn, args) {
    setOccupe(true);
    setErreur('');
    const { error } = await supabase.rpc(fn, args);
    setOccupe(false);
    if (error) { setErreur(messageErreur(error)); return false; }
    await Promise.all([charger(), onChange()]);
    return true;
  }

  async function noter(critere, note) {
    setNotes((n) => ({ ...n, [critere]: note }));
    await agir('noter_candidat', { p_candidat: c.id, p_critere: critere, p_note: note });
  }

  const suivante = etapeSuivante(c.etape);
  const actionSuivante = ETAPES.find((e) => e.k === c.etape)?.action;
  const valeurs = Object.values(notes);
  const moyenne = valeurs.length ? (valeurs.reduce((a, b) => a + b, 0) / valeurs.length).toFixed(1).replace('.', ',') : null;
  const exp = EXPERIENCES.find((x) => x.k === c.experience)?.l;
  const lienWa = `https://wa.me/225${c.telephone}`;

  return (
    <>
      <div className="voile" onClick={onFermer} />
      <aside className="panneau" role="dialog" aria-modal="true" aria-label={`Fiche de ${c.nom}`}>
        <div className="panneau-head">
          {photo
            ? <a href={photo} target="_blank" rel="noreferrer" className="av" style={{ width: 84, height: 84 }} title="Voir la photo en grand"><img src={photo} alt={`Photo de ${c.nom}`} /></a>
            : <span className="av">{initiales(c.nom)}</span>}
          <div style={{ minWidth: 0 }}>
            <h2>{c.nom}</h2>
            <p>{c.quartier}, {c.ville} · {c.age} ans · dossier {c.code_suivi}</p>
            <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
              <span className={`tag ${c.etape === 'refusee' ? 'tag-danger' : 'tag-em'}`}><span className="dot" />{libelleEtape(c.etape)}</span>
              {c.suivi_par === moi.id && <span className="tag">Suivi par vous</span>}
              {c.suivi_par && c.suivi_par !== moi.id && c.suivi_par_nom && <span className="tag">Suivi par {c.suivi_par_nom}</span>}
            </div>
          </div>
          <button className="btn btn-ghost btn-icon fermer" aria-label="Fermer la fiche" onClick={onFermer}><IcoX /></button>
        </div>

        <div className="panneau-body">
          {erreur && <div className="alert alert-danger" role="alert"><IcoAlerte />{erreur}</div>}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <a className="btn btn-ghost btn-sm" href={`tel:+225${c.telephone}`}>Appeler {telAffiche(c.telephone)}</a>
            <a className="btn btn-ghost btn-sm" href={lienWa} target="_blank" rel="noreferrer"><IcoWhatsapp taille={16} />WhatsApp</a>
          </div>

          {c.etape === 'entretien' && c.entretien_le && (
            <div className="alert alert-amber"><IcoCalendrier />
              <span>Entretien <strong>{dateHeure(c.entretien_le)}</strong> · {c.entretien_lieu}</span>
            </div>
          )}

          <section className="bloc">
            <h3>Profil</h3>
            <dl className="infos">
              <div><dt>Activités</dt><dd>{c.activites.map(libelleType).join(', ')}</dd></div>
              <div><dt>Expérience</dt><dd>{exp}</dd></div>
              <div><dt>Langues</dt><dd>{c.langues.join(', ') || '—'}</dd></div>
              <div><dt>Né(e) le</dt><dd>{jourAn(c.date_naissance)}</dd></div>
              <div><dt>Jours</dt><dd>{JOURS.filter((j) => c.jours.includes(j.k)).map((j) => j.l).join(', ')}</dd></div>
              <div><dt>Moments</dt><dd>{CRENEAUX.filter((x) => c.creneaux.includes(x.k)).map((x) => x.l).join(', ')}</dd></div>
              {c.mission_souhaitee && <div className="large"><dt>A postulé pour</dt><dd>{c.mission_souhaitee}</dd></div>}
              {c.experience_detail && <div className="large"><dt>Ce qu’il ou elle a déjà fait</dt><dd style={{ whiteSpace: 'pre-line' }}>{c.experience_detail}</dd></div>}
              <div className="large"><dt>Candidature reçue</dt><dd>{dateHeure(c.cree_le)}</dd></div>
            </dl>
          </section>

          <section className="bloc">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <h3 style={{ fontFamily: 'var(--body)', fontSize: 13, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>Grille d’entretien</h3>
              <span className="moyenne">{moyenne ? <><strong className="tnum">{moyenne}</strong><span className="hint">/ 5</span></> : <span className="hint">Pas encore noté</span>}</span>
            </div>
            <div className="grille">
              {CRITERES.map((cr) => (
                <div className="critere" key={cr.k}>
                  <span>{cr.l}</span>
                  <span className="notes" role="group" aria-label={cr.l}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} className={notes[cr.k] >= n ? 'on' : ''} aria-pressed={notes[cr.k] === n}
                        aria-label={`${cr.l} : ${n} sur 5`} disabled={!peutAgir || occupe} onClick={() => noter(cr.k, n)}>{n}</button>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {peutAgir && entretien && (
            <section className="bloc">
              <h3>Fixer l’entretien</h3>
              <div className="grid-2">
                <label className="field"><span>Date et heure</span>
                  <input className="input" type="datetime-local" value={entretien.le} onChange={(e) => setEntretien({ ...entretien, le: e.target.value })} />
                </label>
                <label className="field"><span>Lieu</span>
                  <input className="input" value={entretien.lieu} onChange={(e) => setEntretien({ ...entretien, lieu: e.target.value })} placeholder="Ex. : Bureau Kaba-Kaba" />
                </label>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" disabled={occupe} onClick={async () => {
                  if (!entretien.le) { setErreur('Choisissez la date et l’heure.'); return; }
                  if (await agir('fixer_entretien', { p_candidat: c.id, p_le: new Date(entretien.le).toISOString(), p_lieu: entretien.lieu })) setEntretien(null);
                }}>Enregistrer l’entretien</button>
                <button className="btn btn-ghost" onClick={() => setEntretien(null)}>Annuler</button>
              </div>
              <p className="hint">Le candidat voit la date et le lieu en suivant son dossier.</p>
            </section>
          )}

          {peutAgir && refus !== null && (
            <section className="bloc">
              <h3>Refuser la candidature</h3>
              <textarea className="textarea" value={refus} onChange={(e) => setRefus(e.target.value)} placeholder="Motif (gardé au journal, jamais montré au candidat)" />
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-danger" disabled={occupe} onClick={async () => {
                  if (await agir('changer_etape_candidat', { p_candidat: c.id, p_etape: 'refusee', p_motif: refus })) setRefus(null);
                }}>Confirmer le refus</button>
                <button className="btn btn-ghost" onClick={() => setRefus(null)}>Annuler</button>
              </div>
            </section>
          )}

          {(c.etape === 'formation' || c.etape === 'validee' || affectations.length > 0) && (
            <section className="bloc">
              <h3>Missions</h3>
              {affectations.map((a) => (
                <div className="ligne-aff" key={a.id}>
                  <span style={{ minWidth: 0 }}>
                    <strong style={{ display: 'block' }}>{a.missions_terrain?.titre}</strong>
                    <span className="hint">{a.missions_terrain?.lieu} · {periode(a.missions_terrain?.date_debut, a.missions_terrain?.date_fin)}</span>
                  </span>
                  <select className="select" value={a.statut} disabled={!peutAgir || occupe} aria-label="Statut de la mission"
                    onChange={(e) => agir('changer_affectation', { p_affectation: a.id, p_statut: e.target.value })}>
                    {STATUTS_AFFECTATION.map((s) => <option key={s.k} value={s.k}>{s.l}</option>)}
                  </select>
                </div>
              ))}
              {peutAgir && (c.etape === 'formation' || c.etape === 'validee') && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <select className="select" style={{ flex: 1, minWidth: 220 }} value={missionChoisie} onChange={(e) => setMissionChoisie(e.target.value)} aria-label="Mission à affecter">
                    <option value="">{missions.length ? 'Choisir une mission ouverte…' : 'Aucune mission ouverte'}</option>
                    {missions.map((m) => <option key={m.id} value={m.id}>{m.titre} · {m.lieu} · {periode(m.date_debut, m.date_fin)}</option>)}
                  </select>
                  <button className="btn btn-primary" disabled={!missionChoisie || occupe} onClick={async () => {
                    if (await agir('affecter_candidat', { p_candidat: c.id, p_mission: missionChoisie })) setMissionChoisie('');
                  }}>Affecter</button>
                </div>
              )}
            </section>
          )}

          <section className="bloc">
            <h3>Journal</h3>
            {peutAgir && (
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="input" value={remarque} onChange={(e) => setRemarque(e.target.value)} placeholder="Ajouter une remarque…" aria-label="Remarque" />
                <button className="btn btn-ghost" disabled={!remarque.trim() || occupe} onClick={async () => {
                  if (await agir('noter_remarque_candidat', { p_candidat: c.id, p_texte: remarque })) setRemarque('');
                }}>Noter</button>
              </div>
            )}
            <ul className="journal">
              {journal.map((j) => (
                <li key={j.id}>
                  <span>
                    <strong>{ACTIONS[j.action] || j.action}</strong>
                    {j.action === 'etape' && <> : {libelleEtape(j.de)} → {libelleEtape(j.vers)}</>}
                    {j.action === 'affectation' && j.vers && <> : {STATUTS_AFFECTATION.find((s) => s.k === j.vers)?.l}</>}
                    {j.texte && <> · {j.texte}</>}
                    <small>{court(j.le)}{j.par === moi.id ? ' · vous' : ''}</small>
                  </span>
                </li>
              ))}
              <li><span><strong>Candidature reçue</strong><small>{court(c.cree_le)}</small></span></li>
            </ul>
          </section>
        </div>

        {peutAgir && (
          <div className="panneau-foot">
            {c.etape === 'refusee' ? (
              <button className="btn btn-primary" disabled={occupe} onClick={() => agir('changer_etape_candidat', { p_candidat: c.id, p_etape: 'nouvelle', p_motif: 'Dossier repris' })}>Reprendre le dossier</button>
            ) : (
              <>
                {(c.etape === 'preselection' || c.etape === 'entretien') && !entretien && (
                  <button className="btn btn-ghost" onClick={() => { setRefus(null); setEntretien({ le: '', lieu: c.entretien_lieu || '' }); }}>
                    {c.etape === 'entretien' ? 'Changer l’entretien' : 'Fixer l’entretien'}
                  </button>
                )}
                {suivante && (
                  <button className="btn btn-primary" disabled={occupe} onClick={() => agir('changer_etape_candidat', { p_candidat: c.id, p_etape: suivante })}>{actionSuivante}</button>
                )}
                {refus === null && (
                  <button className="btn btn-danger" onClick={() => { setEntretien(null); setRefus(''); }}>Refuser</button>
                )}
              </>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
