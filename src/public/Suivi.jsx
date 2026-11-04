import { useState } from 'react';
import { supabase, messageErreur } from '../supabase.js';
import { ETAPES, telCI, telAffiche, dateHeure, jourAn, periode } from '../libelles.js';
import { IcoCheck, IcoAlerte } from '../Icones.jsx';
import { EntetePage } from './Commun.jsx';

const TEXTES = {
  nouvelle: 'Dossier reçu, en attente d’étude par un superviseur.',
  preselection: 'Profil retenu. Vous serez appelé(e) pour fixer un entretien.',
  entretien: 'Entretien avec un superviseur : présentation, aisance, motivation.',
  formation: 'Formation sur le produit et le message de la marque.',
  validee: 'Intégration à l’équipe terrain et affectation aux missions.',
};

function ASavoir() {
  return (
    <aside className="encadre">
      <header><h2>À savoir</h2></header>
      <ul className="a-savoir">
        <li><strong>Code de suivi</strong>8 caractères, affichés à la fin de la candidature.</li>
        <li><strong>Numéro de téléphone</strong>Celui indiqué dans le formulaire de candidature.</li>
        <li><strong>Étude des dossiers</strong>Au fil des arrivées. Les profils retenus sont contactés par téléphone.</li>
        <li><strong>Pas encore candidat ?</strong><a href="#/postuler">Déposer une candidature</a></li>
      </ul>
    </aside>
  );
}

export default function Suivi({ codeInitial }) {
  const [code, setCode] = useState(codeInitial || '');
  const [tel, setTel] = useState('');
  const [erreur, setErreur] = useState('');
  const [attente, setAttente] = useState(false);
  const [dossier, setDossier] = useState(null);

  async function chercher(e) {
    e.preventDefault();
    setErreur('');
    if (code.trim().length !== 8) { setErreur('Le code de suivi comporte 8 caractères.'); return; }
    if (!telCI(tel)) { setErreur('Le numéro de téléphone doit comporter 10 chiffres.'); return; }
    setAttente(true);
    const { data, error } = await supabase.rpc('ma_candidature', { p_code: code.trim(), p_telephone: telCI(tel) });
    setAttente(false);
    if (error) { setErreur(messageErreur(error)); return; }
    setDossier({ ...data, _code: code.trim(), _tel: telCI(tel) });
  }

  if (dossier) return <Dossier d={dossier} retour={() => setDossier(null)} />;

  return (
    <>
      <EntetePage titre="Suivi de candidature" texte="Consultez l’état de votre dossier avec votre code de suivi et votre numéro de téléphone." />
      <div className="corps-page">
        <div className="container grille-page">
          <form className="encadre" onSubmit={chercher} noValidate>
            <header>
              <h2>Identification du dossier</h2>
              <p>Les deux champs sont obligatoires.</p>
            </header>
            <div className="contenu">
              <div className="grid-2">
                <label className="field"><span>Code de suivi</span>
                  <input className="input tnum" value={code} maxLength={8} autoCapitalize="characters" spellCheck="false"
                    style={{ letterSpacing: '.08em', textTransform: 'uppercase' }}
                    onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Ex. 4F9A2C1B" />
                </label>
                <label className="field"><span>Téléphone</span>
                  <div className="input-group">
                    <span className="prefix">+225</span>
                    <input className="input" type="tel" inputMode="tel" value={tel} onChange={(e) => setTel(e.target.value)} placeholder="07 00 00 00 00" />
                  </div>
                </label>
              </div>
              {erreur && <div className="alert alert-danger" role="alert"><IcoAlerte />{erreur}</div>}
            </div>
            <div className="pied">
              <span>Ces informations ne sont visibles que par vous et les recruteurs.</span>
              <button className="btn btn-primary" disabled={attente}>{attente ? 'Recherche…' : 'Consulter le dossier'}</button>
            </div>
          </form>
          <ASavoir />
        </div>
      </div>
    </>
  );
}

function Dossier({ d, retour }) {
  const refuse = d.etape === 'refusee';
  const idx = ETAPES.findIndex((e) => e.k === d.etape);
  const etapeActuelle = refuse ? 'Non retenue' : (ETAPES[idx]?.court || '—');
  const entretien = !refuse && d.etape === 'entretien' && d.entretien_le;

  return (
    <>
      <EntetePage titre="Suivi de candidature" texte={`Dossier de ${d.nom}.`} />
      <div className="corps-page">
        <div className="container grille-page">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <section className="encadre">
              <header><h2>Dossier</h2></header>
              <dl className="tableau-dossier">
                <div><dt>Candidat(e)</dt><dd>{d.nom}</dd></div>
                <div><dt>Code de suivi</dt><dd className="tnum">{d._code}</dd></div>
                <div><dt>Téléphone</dt><dd className="tnum">{telAffiche(d._tel)}</dd></div>
                <div><dt>Déposé le</dt><dd>{jourAn(d.depose_le)}</dd></div>
                <div><dt>Étape actuelle</dt><dd>{etapeActuelle}</dd></div>
                {entretien && (
                  <>
                    <div><dt>Entretien</dt><dd style={{ textTransform: 'capitalize' }}>{dateHeure(d.entretien_le)}</dd></div>
                    <div><dt>Lieu de l’entretien</dt><dd>{d.entretien_lieu}</dd></div>
                  </>
                )}
                {!refuse && d.mission && (
                  <>
                    <div><dt>Mission</dt><dd>{d.mission.titre}</dd></div>
                    <div><dt>Lieu</dt><dd>{d.mission.lieu}{d.mission.ville ? `, ${d.mission.ville}` : ''}</dd></div>
                    <div><dt>Dates</dt><dd>{periode(d.mission.date_debut, d.mission.date_fin)}{d.mission.horaires ? ` · ${d.mission.horaires}` : ''}</dd></div>
                  </>
                )}
              </dl>
              {entretien && <div className="pied">Se présenter avec une pièce d’identité, 10 minutes avant l’heure.</div>}
            </section>

            {refuse ? (
              <section className="encadre">
                <header><h2>Décision</h2></header>
                <div className="contenu">
                  <p style={{ color: 'var(--ink-2)' }}>
                    Votre candidature n’a pas été retenue. Une nouvelle candidature pourra être déposée
                    90 jours après cette décision.
                  </p>
                </div>
              </section>
            ) : (
              <section className="encadre">
                <header><h2>Avancement</h2></header>
                <div className="contenu">
                  <ol className="timeline">
                    {ETAPES.map((e, i) => {
                      const cls = i < idx || d.etape === 'validee' ? 'fait' : i === idx ? 'encours' : 'attente';
                      return (
                        <li key={e.k} className={cls}>
                          <span className="pt">{cls === 'fait' && <IcoCheck taille={16} />}</span>
                          <div>
                            <h4>{e.court}{cls === 'encours' && <span className="tag tag-em" style={{ marginLeft: 10 }}>En cours</span>}</h4>
                            <p>{TEXTES[e.k]}</p>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              </section>
            )}
            <button className="btn btn-ghost" style={{ alignSelf: 'flex-start' }} onClick={retour}>Consulter un autre dossier</button>
          </div>
          <ASavoir />
        </div>
      </div>
    </>
  );
}
