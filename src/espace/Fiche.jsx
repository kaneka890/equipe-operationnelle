import { useCallback, useEffect, useState } from 'react';
import { supabase, messageErreur } from '../supabase.js';
import {
  ETAPES, CRITERES, JOURS, CRENEAUX, EXPERIENCES, STATUTS_AFFECTATION, libelleType, libelleEtape,
  etapeSuivante, initiales, telAffiche, dateHeure, court, jourAn, periode,
} from '../libelles.js';
import { IcoX, IcoAlerte } from '../Icones.jsx';
import { liensPhotos, ESPACE_CAMPAGNES } from '../photo.js';

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
  const [photosCampagnes, setPhotosCampagnes] = useState([]);
  const [liensCampagnes, setLiensCampagnes] = useState({});

  const charger = useCallback(async () => {
    const [ev, jr, af, mi] = await Promise.all([
      supabase.from('evaluations_candidat').select('critere, note').eq('candidat_id', c.id),
      supabase.from('journal_candidats').select('*').eq('candidat_id', c.id).order('le', { ascending: false }),
      supabase.from('affectations_mission').select('id, statut, le, mission_id, missions_terrain(titre, lieu, date_debut, date_fin)').eq('candidat_id', c.id).order('le', { ascending: false }),
      supabase.from('missions_terrain').select('id, titre, lieu, date_debut, date_fin, places').eq('statut', 'ouverte').gte('date_fin', new Date().toISOString().slice(0, 10)).order('date_debut'),
    ]);
    setNotes(Object.fromEntries((ev.data || []).map((n) => [n.critere, n.note])));
    setJournal(jr.data || []);
    setAffectations(af.data || []);
    setMissions(mi.data || []);
    // Photos des campagnes auxquelles il ou elle a été affecté(e).
    const ids = [...new Set((af.data || []).filter((a) => a.statut !== 'annulee').map((a) => a.mission_id))];
    if (!ids.length) { setPhotosCampagnes([]); return; }
    const { data: ph } = await supabase.from('photos_campagne').select('id, chemin, legende, publique, mission_id, cree_le').in('mission_id', ids).order('cree_le');
    setPhotosCampagnes(ph || []);
    const l = await liensPhotos((ph || []).map((p) => p.chemin), ESPACE_CAMPAGNES);
    setLiensCampagnes((x) => ({ ...x, ...l }));
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

  const avecAff = c.etape === 'formation' || c.etape === 'validee' || affectations.length > 0;
  const statutClasse =c.etape === 'refusee' ? 'statut statut-refusee' : `statut statut-${c.etape}`;
  const statutTexte = c.etape === 'refusee' ? 'Non retenu(e)' : libelleEtape(c.etape);

  return (
    <>
      <div className="voile" onClick={onFermer} />
      <aside className="panneau dossier" role="dialog" aria-modal="true" aria-label={`Dossier de ${c.nom}`}>
        <div className="dossier-tete">
          <div className="dossier-ident">
            {photo
              ? <a href={photo} target="_blank" rel="noreferrer" className="dossier-photo" title="Voir la photo en grand"><img src={photo} alt={`Photo de ${c.nom}`} /></a>
              : <span className="dossier-photo vide-photo">{initiales(c.nom)}</span>}
            <div style={{ minWidth: 0 }}>
              <p className="dossier-numero">Dossier n° <span className="tnum">{c.code_suivi}</span></p>
              <h2>{c.nom}</h2>
              <p className="dossier-sous">
                <span className={statutClasse}>{statutTexte}</span>
                <span>
                  {c.suivi_par === moi.id ? 'Suivi par vous' : c.suivi_par_nom ? `Suivi par ${c.suivi_par_nom}` : 'Non attribué'}
                </span>
              </p>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" aria-label="Fermer le dossier" onClick={onFermer}><IcoX /></button>
        </div>

        <div className="panneau-body dossier-corps">
          {erreur && <div className="alert alert-danger" role="alert"><IcoAlerte />{erreur}</div>}

          {c.etape === 'entretien' && c.entretien_le && (
            <p className="mention"><strong>Entretien convoqué</strong> le {dateHeure(c.entretien_le)}, {c.entretien_lieu}.</p>
          )}

          <section className="rubrique">
            <h3>1. Identité et coordonnées</h3>
            <dl className="tableau-dossier">
              <div><dt>Nom et prénoms</dt><dd>{c.nom}</dd></div>
              <div><dt>Date de naissance</dt><dd>{jourAn(c.date_naissance)} ({c.age} ans)</dd></div>
              <div><dt>Téléphone</dt><dd className="tnum">
                {telAffiche(c.telephone)}
                <span className="dossier-liens">
                  <a href={`tel:+225${c.telephone}`}>Appeler</a>
                  <a href={lienWa} target="_blank" rel="noreferrer">WhatsApp</a>
                </span>
              </dd></div>
              <div><dt>Commune / quartier</dt><dd>{c.quartier}</dd></div>
              <div><dt>Ville</dt><dd>{c.ville}</dd></div>
              <div><dt>Dépôt du dossier</dt><dd>{dateHeure(c.cree_le)}</dd></div>
            </dl>
          </section>

          <section className="rubrique">
            <h3>2. Profil</h3>
            <dl className="tableau-dossier">
              <div><dt>Activités souhaitées</dt><dd>{c.activites.map(libelleType).join(', ')}</dd></div>
              <div><dt>Mission demandée</dt><dd>{c.mission_souhaitee || 'Aucune en particulier'}</dd></div>
              <div><dt>Expérience</dt><dd>{exp}</dd></div>
              {c.experience_detail && <div><dt>Précisions</dt><dd style={{ whiteSpace: 'pre-line' }}>{c.experience_detail}</dd></div>}
              <div><dt>Langues parlées</dt><dd>{c.langues.join(', ') || '—'}</dd></div>
            </dl>
          </section>

          <section className="rubrique">
            <h3>3. Disponibilités</h3>
            <dl className="tableau-dossier">
              <div><dt>Jours</dt><dd>{JOURS.filter((j) => c.jours.includes(j.k)).map((j) => j.l).join(', ') || '—'}</dd></div>
              <div><dt>Moments de la journée</dt><dd>{CRENEAUX.filter((x) => c.creneaux.includes(x.k)).map((x) => x.l).join(', ') || '—'}</dd></div>
            </dl>
          </section>

          <section className="rubrique">
            <h3>4. Évaluation de l’entretien <span className="rubrique-note">{moyenne ? `Moyenne : ${moyenne} / 5` : 'Non évalué'}</span></h3>
            <table className="grille-eval">
              <thead><tr><th>Critère</th>{[1, 2, 3, 4, 5].map((n) => <th key={n} className="tnum">{n}</th>)}</tr></thead>
              <tbody>
                {CRITERES.map((cr) => (
                  <tr key={cr.k}>
                    <td>{cr.l}</td>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <td key={n} className="case">
                        <button className={notes[cr.k] === n ? 'coche' : ''} aria-pressed={notes[cr.k] === n}
                          aria-label={`${cr.l} : ${n} sur 5`} disabled={!peutAgir || occupe} onClick={() => noter(cr.k, n)}>
                          {notes[cr.k] === n ? '×' : ''}
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="hint">Échelle : 1 insuffisant · 2 passable · 3 correct · 4 bien · 5 très bien.</p>
          </section>

          {peutAgir && entretien && (
            <section className="rubrique rubrique-action">
              <h3>Convocation à l’entretien</h3>
              <div className="grid-2">
                <label className="field"><span>Date et heure <span className="requis">*</span></span>
                  <input className="input" type="datetime-local" value={entretien.le} onChange={(e) => setEntretien({ ...entretien, le: e.target.value })} />
                </label>
                <label className="field"><span>Lieu <span className="requis">*</span></span>
                  <input className="input" value={entretien.lieu} onChange={(e) => setEntretien({ ...entretien, lieu: e.target.value })} />
                </label>
              </div>
              <p className="hint">La date et le lieu apparaissent dans le suivi du candidat.</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" disabled={occupe} onClick={async () => {
                  if (!entretien.le) { setErreur('Indiquez la date et l’heure de l’entretien.'); return; }
                  if (await agir('fixer_entretien', { p_candidat: c.id, p_le: new Date(entretien.le).toISOString(), p_lieu: entretien.lieu })) setEntretien(null);
                }}>Enregistrer la convocation</button>
                <button className="btn btn-ghost" onClick={() => setEntretien(null)}>Annuler</button>
              </div>
            </section>
          )}

          {peutAgir && refus !== null && (
            <section className="rubrique rubrique-action">
              <h3>Décision de non-retenue</h3>
              <label className="field"><span>Motif <span className="requis">*</span></span>
                <textarea className="textarea" value={refus} onChange={(e) => setRefus(e.target.value)} />
              </label>
              <p className="hint">Le motif est conservé à l’historique ; il n’est jamais communiqué au candidat.</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-danger" disabled={occupe} onClick={async () => {
                  if (await agir('changer_etape_candidat', { p_candidat: c.id, p_etape: 'refusee', p_motif: refus })) setRefus(null);
                }}>Confirmer la décision</button>
                <button className="btn btn-ghost" onClick={() => setRefus(null)}>Annuler</button>
              </div>
            </section>
          )}

          {avecAff && (
            <section className="rubrique">
              <h3>5. Affectations</h3>
              {affectations.length > 0 ? (
                <table className="historique">
                  <thead><tr><th>Mission</th><th>Période</th><th>Statut</th></tr></thead>
                  <tbody>
                    {affectations.map((a) => (
                      <tr key={a.id}>
                        <td><strong>{a.missions_terrain?.titre}</strong><small>{a.missions_terrain?.lieu}</small></td>
                        <td>{periode(a.missions_terrain?.date_debut, a.missions_terrain?.date_fin)}</td>
                        <td>
                          <select className="select" value={a.statut} disabled={!peutAgir || occupe} aria-label="Statut de l’affectation"
                            onChange={(e) => agir('changer_affectation', { p_affectation: a.id, p_statut: e.target.value })}>
                            {STATUTS_AFFECTATION.map((s) => <option key={s.k} value={s.k}>{s.l}</option>)}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <p className="hint">Aucune affectation.</p>}
              {peutAgir && (c.etape === 'formation' || c.etape === 'validee') && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <select className="select" style={{ flex: 1, minWidth: 220 }} value={missionChoisie} onChange={(e) => setMissionChoisie(e.target.value)} aria-label="Mission à affecter">
                    <option value="">{missions.length ? 'Sélectionner une mission ouverte' : 'Aucune mission ouverte'}</option>
                    {missions.map((m) => <option key={m.id} value={m.id}>{m.titre} · {m.lieu} · {periode(m.date_debut, m.date_fin)}</option>)}
                  </select>
                  <button className="btn btn-primary" disabled={!missionChoisie || occupe} onClick={async () => {
                    if (await agir('affecter_candidat', { p_candidat: c.id, p_mission: missionChoisie })) setMissionChoisie('');
                  }}>Affecter</button>
                </div>
              )}
            </section>
          )}

          {photosCampagnes.length > 0 && (
            <section className="rubrique">
              <h3>{avecAff ? '6' : '5'}. Photos des campagnes <span className="rubrique-note">{photosCampagnes.length} photo{photosCampagnes.length > 1 ? 's' : ''}</span></h3>
              <ul className="planche planche-compacte">
                {photosCampagnes.map((p) => {
                  const a = affectations.find((x) => x.mission_id === p.mission_id);
                  return (
                    <li key={p.id}>
                      <a href={liensCampagnes[p.chemin]} target="_blank" rel="noreferrer" className="planche-img">
                        {liensCampagnes[p.chemin] ? <img src={liensCampagnes[p.chemin]} alt={p.legende || 'Photo de campagne'} loading="lazy" /> : null}
                      </a>
                      <div className="planche-infos">
                        <span className="planche-num">{a?.missions_terrain?.titre}</span>
                        {p.legende && <span className="hint">{p.legende}</span>}
                        <span className="hint">{p.publique ? 'Publiée sur le site' : 'Privée'}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <p className="hint">Photos déposées sur les missions où ce dossier est affecté (Missions et partenaires, colonne Photos).</p>
            </section>
          )}

          <section className="rubrique">
            <h3>{5 + (avecAff ? 1 : 0) + (photosCampagnes.length > 0 ? 1 : 0)}. Historique du dossier</h3>
            <table className="historique">
              <thead><tr><th>Date</th><th>Opération</th><th>Agent</th></tr></thead>
              <tbody>
                {journal.map((j) => (
                  <tr key={j.id}>
                    <td className="tnum" style={{ whiteSpace: 'nowrap' }}>{court(j.le)}</td>
                    <td>
                      {ACTIONS[j.action] || j.action}
                      {j.action === 'etape' && <> : {libelleEtape(j.de)} → {libelleEtape(j.vers)}</>}
                      {j.action === 'affectation' && j.vers && <> : {STATUTS_AFFECTATION.find((s) => s.k === j.vers)?.l}</>}
                      {j.texte && <small>{j.texte}</small>}
                    </td>
                    <td>{j.par === moi.id ? 'Vous' : j.par ? 'Recruteur' : '—'}</td>
                  </tr>
                ))}
                <tr>
                  <td className="tnum" style={{ whiteSpace: 'nowrap' }}>{court(c.cree_le)}</td>
                  <td>Dépôt de la candidature en ligne</td>
                  <td>Candidat(e)</td>
                </tr>
              </tbody>
            </table>
            {peutAgir && (
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="input" value={remarque} onChange={(e) => setRemarque(e.target.value)} placeholder="Observation à ajouter à l’historique" aria-label="Observation" />
                <button className="btn btn-ghost" disabled={!remarque.trim() || occupe} onClick={async () => {
                  if (await agir('noter_remarque_candidat', { p_candidat: c.id, p_texte: remarque })) setRemarque('');
                }}>Ajouter</button>
              </div>
            )}
          </section>
        </div>

        {peutAgir && (
          <div className="panneau-foot dossier-pied">
            {c.etape === 'refusee' ? (
              <button className="btn btn-primary" disabled={occupe} onClick={() => agir('changer_etape_candidat', { p_candidat: c.id, p_etape: 'nouvelle', p_motif: 'Dossier repris' })}>Rouvrir le dossier</button>
            ) : (
              <>
                {refus === null && (
                  <button className="btn btn-danger" onClick={() => { setEntretien(null); setRefus(''); }}>Ne pas retenir</button>
                )}
                {(c.etape === 'preselection' || c.etape === 'entretien') && !entretien && (
                  <button className="btn btn-ghost" onClick={() => { setRefus(null); setEntretien({ le: '', lieu: c.entretien_lieu || '' }); }}>
                    {c.etape === 'entretien' ? 'Modifier la convocation' : 'Convoquer à l’entretien'}
                  </button>
                )}
                {suivante && (
                  <button className="btn btn-primary" disabled={occupe} onClick={() => agir('changer_etape_candidat', { p_candidat: c.id, p_etape: suivante })}>{actionSuivante}</button>
                )}
              </>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
