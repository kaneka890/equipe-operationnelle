import { useState } from 'react';
import { supabase, messageErreur } from '../supabase.js';
import { ETAPES, telCI, dateHeure, jourAn, periode } from '../libelles.js';
import { IcoCheck, IcoAlerte, IcoLieu, IcoCalendrier, IcoFleche } from '../Icones.jsx';

const TEXTES = {
  nouvelle: 'Votre candidature est arrivée. Un superviseur va l’étudier.',
  preselection: 'Votre profil est retenu. Nous vous appelons pour fixer un entretien.',
  entretien: 'Rencontre avec un superviseur : présentation, aisance, motivation.',
  formation: 'Formation sur le produit et le message de la marque.',
  validee: 'Vous faites partie de l’équipe terrain. Une mission vous attend.',
};

export default function Suivi({ codeInitial }) {
  const [code, setCode] = useState(codeInitial || '');
  const [tel, setTel] = useState('');
  const [erreur, setErreur] = useState('');
  const [attente, setAttente] = useState(false);
  const [dossier, setDossier] = useState(null);

  async function chercher(e) {
    e.preventDefault();
    setErreur('');
    if (code.trim().length !== 8) { setErreur('Le code a 8 caractères. Vous l’avez reçu après votre candidature.'); return; }
    if (!telCI(tel)) { setErreur('Le numéro doit avoir 10 chiffres.'); return; }
    setAttente(true);
    const { data, error } = await supabase.rpc('ma_candidature', { p_code: code.trim(), p_telephone: telCI(tel) });
    setAttente(false);
    if (error) { setErreur(messageErreur(error)); return; }
    setDossier(data);
  }

  if (dossier) return <Dossier d={dossier} retour={() => setDossier(null)} />;

  return (
    <section className="section" style={{ paddingTop: 48 }}>
      <div className="container centre">
        <span className="kicker">Suivi de candidature</span>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 46px)' }}>Où en est mon dossier ?</h1>
        <p style={{ color: 'var(--ink-3)', margin: '12px 0 28px', fontSize: 17 }}>
          Entrez le code reçu après votre candidature et votre numéro de téléphone.
        </p>
        <form className="card card-pad" onSubmit={chercher} style={{ display: 'flex', flexDirection: 'column', gap: 18 }} noValidate>
          <label className="field"><span>Code de suivi</span>
            <input className="input tnum" value={code} maxLength={8} autoCapitalize="characters" spellCheck="false"
              style={{ letterSpacing: '.18em', fontWeight: 600, textTransform: 'uppercase' }}
              onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Ex. : 4F9A2C1B" />
          </label>
          <label className="field"><span>Téléphone</span>
            <div className="input-group">
              <span className="prefix">+225</span>
              <input className="input" type="tel" inputMode="tel" value={tel} onChange={(e) => setTel(e.target.value)} placeholder="07 00 00 00 00" />
            </div>
          </label>
          {erreur && <div className="alert alert-danger" role="alert"><IcoAlerte />{erreur}</div>}
          <button className="btn btn-primary btn-lg" disabled={attente}>{attente ? 'Recherche…' : <>Voir mon dossier <IcoFleche taille={18} /></>}</button>
        </form>
        <p style={{ marginTop: 18, fontSize: 14.5, color: 'var(--ink-3)' }}>
          Pas encore de candidature ? <a href="#/postuler">Postuler maintenant</a>
        </p>
      </div>
    </section>
  );
}

function Dossier({ d, retour }) {
  const prenom = String(d.nom || '').trim().split(/\s+/).slice(-1)[0];
  const refuse = d.etape === 'refusee';
  const idx = ETAPES.findIndex((e) => e.k === d.etape);

  return (
    <section className="section" style={{ paddingTop: 48 }}>
      <div className="container centre" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <span className="kicker">Dossier déposé le {jourAn(d.depose_le)}</span>
          <h1 style={{ fontSize: 'clamp(30px, 5vw, 42px)' }}>Bonjour {prenom}</h1>
        </div>

        {refuse && (
          <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h2 style={{ fontSize: 22 }}>Votre candidature n’a pas été retenue cette fois.</h2>
            <p style={{ color: 'var(--ink-3)' }}>
              Merci pour votre intérêt. Les besoins changent avec chaque mission : vous pourrez postuler de nouveau
              90 jours après cette réponse.
            </p>
          </div>
        )}

        {!refuse && d.etape === 'entretien' && d.entretien_le && (
          <div className="card card-pad" style={{ background: 'var(--em-900)', color: '#fff', borderColor: 'var(--em-900)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span className="eyebrow">Votre entretien</span>
            <h2 style={{ fontSize: 26, textTransform: 'capitalize' }}>{dateHeure(d.entretien_le)}</h2>
            <p style={{ display: 'flex', gap: 8, color: '#CFE3DA' }}><IcoLieu />{d.entretien_lieu}</p>
            <p style={{ color: '#CFE3DA', fontSize: 14.5 }}>Venez avec votre pièce d’identité, 10 minutes en avance.</p>
          </div>
        )}

        {!refuse && d.mission && (
          <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 10, borderColor: 'var(--amber)' }}>
            <span className="tag tag-amber" style={{ alignSelf: 'flex-start' }}>Votre mission</span>
            <h2 style={{ fontSize: 24 }}>{d.mission.titre}</h2>
            <p style={{ display: 'flex', gap: 8, color: 'var(--ink-2)' }}><IcoLieu />{d.mission.lieu}{d.mission.ville ? `, ${d.mission.ville}` : ''}</p>
            <p style={{ display: 'flex', gap: 8, color: 'var(--ink-2)' }}><IcoCalendrier />{periode(d.mission.date_debut, d.mission.date_fin)}{d.mission.horaires ? ` · ${d.mission.horaires}` : ''}</p>
          </div>
        )}

        {!refuse && (
          <div className="card card-pad">
            <h2 style={{ fontSize: 20, marginBottom: 22 }}>Les étapes</h2>
            <ol className="timeline">
              {ETAPES.map((e, i) => {
                const cls = i < idx || d.etape === 'validee' ? 'fait' : i === idx ? 'encours' : 'attente';
                return (
                  <li key={e.k} className={cls}>
                    <span className="pt">{cls === 'fait' && <IcoCheck taille={16} />}</span>
                    <div>
                      <h4>{e.court}{cls === 'encours' && <span className="tag tag-amber" style={{ marginLeft: 10 }}>En cours</span>}</h4>
                      <p>{TEXTES[e.k]}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        <button className="btn btn-ghost" style={{ alignSelf: 'flex-start' }} onClick={retour}>Consulter un autre dossier</button>
      </div>
    </section>
  );
}
