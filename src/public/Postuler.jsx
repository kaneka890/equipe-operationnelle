import { useEffect, useMemo, useState } from 'react';
import { supabase, messageErreur } from '../supabase.js';
import {
  ACTIVITES, JOURS, CRENEAUX, EXPERIENCES, LANGUES_PROPOSEES, telCI, telAffiche, libelleType, periode,
} from '../libelles.js';
import {
  IcoCheck, IcoFleche, IcoRetour, IcoAlerte, IcoCopie, IcoWhatsapp, IcoInfo, ICONE_ACTIVITE, IcoPlus, IcoAppareil,
} from '../Icones.jsx';
import { useMissions } from './Commun.jsx';
import { preparerPhoto, deposerPhoto } from '../photo.js';

const ETAPES = [
  { t: 'Vous', s: 'Pour vous joindre et préparer votre badge.' },
  { t: 'Activités', s: 'Ce que vous aimeriez faire, et les langues que vous parlez.' },
  { t: 'Disponibilités', s: 'Les jours et moments où vous pouvez travailler.' },
  { t: 'Expérience', s: 'Votre parcours, puis vous relisez et envoyez.' },
];

const VIDE = {
  nom: '', telephone: '', ville: 'Abidjan', quartier: '', date_naissance: '',
  activites: [], langues: ['Français'], jours: [], creneaux: [],
  experience: '', experience_detail: '', consentement: false,
};
const CLE_BROUILLON = 'kk-talents-brouillon';

function lireBrouillon() {
  try { return { ...VIDE, ...JSON.parse(sessionStorage.getItem(CLE_BROUILLON) || '{}'), consentement: false }; }
  catch { return VIDE; }
}

function age(dateTexte) {
  if (!dateTexte) return null;
  const d = new Date(dateTexte + 'T12:00:00');
  const n = new Date();
  let a = n.getFullYear() - d.getFullYear();
  if (n.getMonth() < d.getMonth() || (n.getMonth() === d.getMonth() && n.getDate() < d.getDate())) a--;
  return a;
}

const bascule = (liste, v) => (liste.includes(v) ? liste.filter((x) => x !== v) : [...liste, v]);

export default function Postuler({ missionId }) {
  const [f, setF] = useState(lireBrouillon);
  const [etape, setEtape] = useState(0);
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [code, setCode] = useState(null);
  const [autreLangue, setAutreLangue] = useState('');
  // La photo reste en mémoire (pas dans le brouillon) ; `chemin` = déjà déposée.
  const [photo, setPhoto] = useState(null); // { blob, apercu, chemin }
  const [photoAttente, setPhotoAttente] = useState(false);

  async function choisirPhoto(e) {
    const fichier = e.target.files?.[0];
    e.target.value = '';
    if (!fichier) return;
    setPhotoAttente(true);
    setErreur('');
    try {
      const p = await preparerPhoto(fichier);
      if (photo?.apercu) URL.revokeObjectURL(photo.apercu);
      setPhoto({ ...p, chemin: null });
    } catch (err) {
      setErreur(err.message);
    }
    setPhotoAttente(false);
  }
  const { missions } = useMissions();
  const mission = useMemo(() => missions.find((m) => m.id === missionId), [missions, missionId]);

  useEffect(() => {
    try { sessionStorage.setItem(CLE_BROUILLON, JSON.stringify({ ...f, consentement: false })); } catch { /* navigation privée */ }
  }, [f]);

  const maj = (k, v) => { setF((x) => ({ ...x, [k]: v })); setErreur(''); };

  function verifier(i) {
    if (i === 0) {
      if (!photo) return 'Ajoutez une photo de vous, visage bien visible.';
      if (f.nom.trim().split(/\s+/).length < 2) return 'Indiquez votre nom et votre prénom.';
      if (!telCI(f.telephone)) return 'Le numéro doit avoir 10 chiffres, par exemple 07 00 00 00 00.';
      if (f.ville.trim().length < 2) return 'Indiquez votre ville.';
      if (f.quartier.trim().length < 2) return 'Indiquez votre quartier.';
      const a = age(f.date_naissance);
      if (a == null) return 'Indiquez votre date de naissance.';
      if (a < 18) return 'Il faut avoir au moins 18 ans pour postuler.';
      if (a > 70) return 'La date de naissance ne semble pas juste.';
    }
    if (i === 1) {
      if (!f.activites.length) return 'Choisissez au moins une activité.';
      if (!f.langues.length) return 'Indiquez au moins une langue.';
    }
    if (i === 2) {
      if (!f.jours.length) return 'Choisissez au moins un jour.';
      if (!f.creneaux.length) return 'Choisissez au moins un moment de la journée.';
    }
    if (i === 3) {
      if (!f.experience) return 'Indiquez votre expérience terrain.';
      if (!f.consentement) return 'Cochez la case d’accord pour envoyer votre candidature.';
    }
    return '';
  }

  function suivant(e) {
    e.preventDefault();
    const msg = verifier(etape);
    if (msg) { setErreur(msg); return; }
    if (etape < 3) { setEtape(etape + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    envoyer();
  }

  async function envoyer() {
    setEnvoi(true);
    setErreur('');
    // 1. La photo d'abord. Si l'envoi de la candidature échoue ensuite, on
    //    réessaie avec la même photo déjà déposée.
    let chemin = photo?.chemin;
    if (!chemin) {
      try {
        chemin = await deposerPhoto(photo.blob);
        setPhoto((x) => ({ ...x, chemin }));
      } catch (err) {
        setEnvoi(false);
        setErreur(err?.message && /fetch|network/i.test(err.message)
          ? 'Pas de connexion internet. Vérifiez le réseau puis réessayez.'
          : 'La photo n’a pas pu être envoyée. Réessayez, ou choisissez une autre photo.');
        return;
      }
    }
    const p = {
      ...f,
      nom: f.nom.trim().replace(/\s+/g, ' '),
      telephone: telCI(f.telephone),
      mission_id: mission ? mission.id : null,
      photo_chemin: chemin,
    };
    const { data, error } = await supabase.rpc('postuler', { p });
    setEnvoi(false);
    if (error) {
      // Photo refusée par la base (déjà prise, introuvable) : on la redéposera.
      if (/photo/i.test(error.message || '')) setPhoto((x) => ({ ...x, chemin: null }));
      setErreur(messageErreur(error));
      return;
    }
    try { sessionStorage.removeItem(CLE_BROUILLON); } catch { /* rien */ }
    setCode(data.code);
    window.scrollTo({ top: 0 });
  }

  if (code) return <Confirmation code={code} nom={f.nom} telephone={telCI(f.telephone)} photo={photo?.apercu} />;

  const ajouterLangue = () => {
    const l = autreLangue.trim();
    if (l && l.length <= 30 && !f.langues.includes(l)) maj('langues', [...f.langues, l]);
    setAutreLangue('');
  };
  const languesAffichees = [...new Set([...LANGUES_PROPOSEES, ...f.langues])];

  return (
    <section className="form-page">
      <div className="container form-wrap">
        <aside className="stepper">
          <h1>Ma candidature</h1>
          <p>Environ 5 minutes. Vos réponses restent sur cet appareil jusqu’à l’envoi.</p>
          <ol className="steps-list">
            {ETAPES.map((s, i) => (
              <li key={s.t} className={i === etape ? 'actif' : i < etape ? 'fait' : ''} aria-current={i === etape ? 'step' : undefined}>
                <span className="n">{i < etape ? <IcoCheck taille={14} /> : i + 1}</span>{s.t}
              </li>
            ))}
          </ol>
          <div className="progress-m">
            <span>Étape {etape + 1} sur 4 · {ETAPES[etape].t}</span>
            <div className="track"><i style={{ width: `${((etape + 1) / 4) * 100}%` }} /></div>
          </div>
          {mission && (
            <div className="alert alert-info" style={{ marginTop: 16 }}>
              <IcoInfo />
              <span>Vous postulez pour <strong>{mission.titre}</strong>, {periode(mission.date_debut, mission.date_fin)}.</span>
            </div>
          )}
        </aside>

        <form className="card card-pad form-card" onSubmit={suivant} noValidate>
          <div>
            <h2>{ETAPES[etape].t}</h2>
            <p className="sous">{ETAPES[etape].s}</p>
          </div>

          {etape === 0 && (
            <>
              <div className="photo-pick">
                <span className={`photo-cadre${photo ? ' pleine' : ''}`}>
                  {photo ? <img src={photo.apercu} alt="Votre photo" /> : <IcoAppareil taille={30} />}
                </span>
                <div className="photo-texte">
                  <span className="label">Votre photo</span>
                  <p className="hint">Visage bien visible, de face, à la lumière du jour. Elle sert à votre badge de mission.</p>
                  <label className={`btn btn-sm ${photo ? 'btn-ghost' : 'btn-primary'}`} style={{ alignSelf: 'flex-start' }}>
                    <input type="file" accept="image/*" className="sr" onChange={choisirPhoto} disabled={photoAttente} />
                    <IcoAppareil taille={18} />
                    {photoAttente ? 'Préparation…' : photo ? 'Changer la photo' : 'Prendre ou choisir une photo'}
                  </label>
                </div>
              </div>
              <label className="field"><span>Nom et prénom</span>
                <input className="input" autoComplete="name" value={f.nom} onChange={(e) => maj('nom', e.target.value)} placeholder="Ex. : Awa Traoré" />
              </label>
              <label className="field"><span>Téléphone WhatsApp</span>
                <div className="input-group">
                  <span className="prefix">+225</span>
                  <input className="input" type="tel" inputMode="tel" autoComplete="tel-national" value={f.telephone} onChange={(e) => maj('telephone', e.target.value)} placeholder="07 00 00 00 00" />
                </div>
                <span className="hint">Nous vous contactons sur ce numéro. Il sert aussi à suivre votre dossier.</span>
              </label>
              <div className="grid-2">
                <label className="field"><span>Ville</span>
                  <input className="input" autoComplete="address-level2" value={f.ville} onChange={(e) => maj('ville', e.target.value)} />
                </label>
                <label className="field"><span>Quartier ou commune</span>
                  <input className="input" value={f.quartier} onChange={(e) => maj('quartier', e.target.value)} placeholder="Ex. : Yopougon" />
                </label>
              </div>
              <label className="field"><span>Date de naissance</span>
                <input className="input" type="date" autoComplete="bday" value={f.date_naissance} onChange={(e) => maj('date_naissance', e.target.value)} max={new Date().toISOString().slice(0, 10)} />
              </label>
            </>
          )}

          {etape === 1 && (
            <>
              <div className="field">
                <span className="label">Activités qui vous intéressent</span>
                <div className="choices" role="group" aria-label="Activités">
                  {ACTIVITES.map((a) => {
                    const on = f.activites.includes(a.k);
                    const Ico = ICONE_ACTIVITE[a.k];
                    return (
                      <button type="button" key={a.k} className="choice" aria-pressed={on} onClick={() => maj('activites', bascule(f.activites, a.k))}>
                        <span className="tick">{on && <IcoCheck taille={14} />}</span>
                        <span><strong style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Ico taille={16} />{a.l}</strong><small>{a.d}</small></span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="field">
                <span className="label">Langues parlées</span>
                <div className="chips" role="group" aria-label="Langues">
                  {languesAffichees.map((l) => (
                    <button type="button" key={l} className="chip" aria-pressed={f.langues.includes(l)} onClick={() => maj('langues', bascule(f.langues, l))}>
                      {f.langues.includes(l) && <IcoCheck />}{l}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <input className="input" value={autreLangue} maxLength={30} onChange={(e) => setAutreLangue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); ajouterLangue(); } }}
                    placeholder="Une autre langue ?" aria-label="Ajouter une langue" />
                  <button type="button" className="btn btn-ghost" onClick={ajouterLangue}><IcoPlus taille={18} />Ajouter</button>
                </div>
              </div>
            </>
          )}

          {etape === 2 && (
            <>
              <div className="field">
                <span className="label">Jours où vous pouvez travailler</span>
                <div className="days" role="group" aria-label="Jours">
                  {JOURS.map((j) => (
                    <button type="button" key={j.k} className="day" aria-pressed={f.jours.includes(j.k)} aria-label={j.long} onClick={() => maj('jours', bascule(f.jours, j.k))}>{j.l}</button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => maj('jours', ['ven', 'sam', 'dim'])}>Week-end prolongé</button>
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => maj('jours', JOURS.map((j) => j.k))}>Tous les jours</button>
                </div>
              </div>
              <div className="field">
                <span className="label">Moments de la journée</span>
                <div className="chips" role="group" aria-label="Moments de la journée">
                  {CRENEAUX.map((c) => (
                    <button type="button" key={c.k} className="chip" aria-pressed={f.creneaux.includes(c.k)} onClick={() => maj('creneaux', bascule(f.creneaux, c.k))}>
                      {f.creneaux.includes(c.k) && <IcoCheck />}{c.l}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {etape === 3 && (
            <>
              <div className="field">
                <span className="label">Expérience terrain</span>
                <div className="choices" role="radiogroup" aria-label="Expérience">
                  {EXPERIENCES.map((x) => (
                    <button type="button" role="radio" aria-checked={f.experience === x.k} key={x.k} className="choice radio" aria-pressed={f.experience === x.k} onClick={() => maj('experience', x.k)}>
                      <span className="tick">{f.experience === x.k && <IcoCheck taille={14} />}</span>
                      <span><strong>{x.l}</strong><small>{x.d}</small></span>
                    </button>
                  ))}
                </div>
              </div>
              <label className="field"><span>Marques ou missions déjà faites <span className="hint">(facultatif)</span></span>
                <textarea className="textarea" maxLength={1000} value={f.experience_detail} onChange={(e) => maj('experience_detail', e.target.value)} placeholder="Ex. : dégustation de jus en supermarché, vente de savon au marché…" />
              </label>

              <div className="field">
                <span className="label">Relisez avant d’envoyer</span>
                <dl className="recap">
                  {photo && <div><dt>Photo</dt><dd><img src={photo.apercu} alt="" style={{ width: 56, height: 56, borderRadius: 14, objectFit: 'cover' }} /></dd></div>}
                  <div><dt>Nom</dt><dd>{f.nom}</dd></div>
                  <div><dt>Téléphone</dt><dd className="tnum">{telAffiche(telCI(f.telephone))}</dd></div>
                  <div><dt>Lieu</dt><dd>{f.quartier}, {f.ville}</dd></div>
                  <div><dt>Activités</dt><dd>{f.activites.map(libelleType).join(', ')}</dd></div>
                  <div><dt>Langues</dt><dd>{f.langues.join(', ')}</dd></div>
                  <div><dt>Disponibilités</dt><dd>{JOURS.filter((j) => f.jours.includes(j.k)).map((j) => j.long).join(', ')} · {CRENEAUX.filter((c) => f.creneaux.includes(c.k)).map((c) => c.l.toLowerCase()).join(', ')}</dd></div>
                </dl>
              </div>

              <label className="check">
                <input type="checkbox" checked={f.consentement} onChange={(e) => maj('consentement', e.target.checked)} />
                <span>J’accepte que mes informations servent uniquement au recrutement pour les missions de l’Équipe opérationnelle Octoplus CI et de ses partenaires. Seuls ses recruteurs y ont accès.</span>
              </label>
            </>
          )}

          {erreur && <div className="alert alert-danger" role="alert"><IcoAlerte />{erreur}</div>}

          <div className="form-actions">
            {etape > 0 && (
              <button type="button" className="btn btn-ghost" onClick={() => { setEtape(etape - 1); setErreur(''); }}>
                <IcoRetour taille={18} />Retour
              </button>
            )}
            <button type="submit" className="btn btn-primary btn-lg" disabled={envoi}>
              {etape < 3 ? <>Continuer <IcoFleche taille={18} /></> : envoi ? 'Envoi…' : 'Envoyer ma candidature'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

function Confirmation({ code, nom, telephone, photo }) {
  const [copie, setCopie] = useState(false);
  const prenom = nom.trim().split(/\s+/).slice(-1)[0];
  const lienSuivi = `${window.location.origin}${window.location.pathname}#/suivi?code=${code}`;
  const texte = `Ma candidature Équipe opérationnelle Octoplus CI : code ${code}. Suivi : ${lienSuivi}`;

  async function copier() {
    try { await navigator.clipboard.writeText(code); setCopie(true); setTimeout(() => setCopie(false), 2000); } catch { /* rien */ }
  }

  return (
    <section className="section" style={{ paddingTop: 48 }}>
      <div className="container centre">
        <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <span style={{ position: 'relative', alignSelf: 'flex-start' }}>
            {photo
              ? <img src={photo} alt="" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
              : <span className="succes-ico"><IcoCheck taille={30} /></span>}
            {photo && <span className="succes-ico" style={{ position: 'absolute', right: -6, bottom: -6, width: 28, height: 28, border: '3px solid #fff' }}><IcoCheck taille={14} /></span>}
          </span>
          <div>
            <h1 style={{ fontSize: 'clamp(30px, 5vw, 40px)' }}>Merci {prenom}, c’est envoyé.</h1>
            <p style={{ color: 'var(--ink-3)', marginTop: 10, fontSize: 17 }}>
              Un superviseur étudie votre candidature. Si votre profil est retenu, vous êtes appelé(e)
              au {telAffiche(telephone)} pour un entretien.
            </p>
          </div>
          <div className="field">
            <span className="label">Votre code de suivi</span>
            <div className="code-box">
              <strong className="tnum">{code}</strong>
              <button className="btn btn-ghost btn-sm" onClick={copier}><IcoCopie taille={18} />{copie ? 'Copié' : 'Copier'}</button>
            </div>
            <span className="hint">Gardez-le : avec votre numéro, il permet de suivre votre dossier à tout moment.</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <a className="btn btn-primary" href={`https://wa.me/?text=${encodeURIComponent(texte)}`} target="_blank" rel="noreferrer">
              <IcoWhatsapp taille={18} />Me l’envoyer sur WhatsApp
            </a>
            <a className="btn btn-ghost" href={`#/suivi?code=${code}`}>Suivre mon dossier</a>
          </div>
        </div>
      </div>
    </section>
  );
}
