import { ACTIVITES } from '../libelles.js';
import { ICONE_ACTIVITE, IcoFleche, IcoCheck } from '../Icones.jsx';
import { useMissions, CarteMission, SansMission } from './Commun.jsx';

const PROFIL = [
  ['Aisance à l’oral', 'et présentation soignée.'],
  ['Ponctualité', 'et sens des responsabilités sur le point de vente.'],
  ['Disponibilité', 'au moins un jour par semaine, à choisir lors de la candidature.'],
  ['Langues locales', 'appréciées en plus du français.'],
  ['Première expérience', 'bienvenue, mais pas obligatoire.'],
];
const OFFRE = [
  ['Rémunération à la journée,', 'annoncée sur chaque mission avant de postuler.'],
  ['Formation produit', 'avant chaque nouvelle mission.'],
  ['Encadrement', 'par un superviseur de l’équipe pendant la mission.'],
  ['Badge de mission', 'établi avec la photo du dossier.'],
  ['Données protégées :', 'elles servent uniquement au recrutement.'],
];
const PROCESSUS = [
  ['Candidature en ligne', 'Formulaire d’environ cinq minutes. Un code de suivi est remis à l’envoi.'],
  ['Pré-sélection', 'Un superviseur étudie le dossier. Les profils retenus sont contactés par téléphone.'],
  ['Entretien', 'Rencontre avec un superviseur, sur convocation. Pièce d’identité à présenter.'],
  ['Formation produit', 'Présentation du produit, du message de la marque et du déroulé de la mission.'],
  ['Première mission', 'Affectation à une mission selon le profil et les disponibilités.'],
];

export default function Accueil() {
  const { chargement, missions } = useMissions();
  const apercu = missions.slice(0, 3);

  return (
    <>
      <section className="hero">
        <div className="container hero-in">
          <div>
            <span className="etiquette"><span className="dot" />Recrutement ouvert · Côte d’Ivoire</span>
            <h1>Recrutement de promotrices et promoteurs terrain</h1>
            <p className="lead">
              L’Équipe opérationnelle Octoplus CI recrute pour les activités de ses partenaires :
              animation en supermarché, vente sur les marchés, dégustation, animation de stand et
              distribution d’échantillons. Les missions sont rémunérées à la journée.
            </p>
            <div className="hero-cta">
              <a className="btn btn-primary btn-lg" href="#/postuler">Déposer ma candidature <IcoFleche taille={18} /></a>
              <a className="btn btn-ghost btn-lg" href="#/missions">Consulter les missions</a>
            </div>
            <p className="hero-note">Déjà candidat ? <a href="#/suivi">Suivre mon dossier</a> avec le code reçu.</p>
          </div>

          <aside className="fiche-poste" aria-labelledby="fiche-titre">
            <h2 id="fiche-titre">Fiche de poste</h2>
            <dl>
              <div><dt>Poste</dt><dd>Promotrice / promoteur terrain</dd></div>
              <div><dt>Lieux</dt><dd>Supermarchés, marchés, points de vente</dd></div>
              <div><dt>Rémunération</dt><dd>À la journée, montant indiqué sur chaque mission</dd></div>
              <div><dt>Horaires</dt><dd>Selon la mission, sur les jours que vous indiquez</dd></div>
              <div><dt>Conditions</dt><dd>18 ans minimum, téléphone avec WhatsApp, pièce d’identité</dd></div>
              <div><dt>Démarrage</dt><dd>Après entretien et formation produit</dd></div>
            </dl>
          </aside>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="kicker">Missions ouvertes</span>
              <h2>Prochaines missions</h2>
            </div>
            <a className="btn btn-ghost" href="#/missions">Toutes les missions <IcoFleche taille={18} /></a>
          </div>
          {chargement ? (
            <div className="missions-grid">{[0, 1, 2].map((i) => <div className="squelette" key={i} />)}</div>
          ) : apercu.length ? (
            <div className="missions-grid">{apercu.map((m) => <CarteMission key={m.id} m={m} />)}</div>
          ) : (
            <SansMission />
          )}
        </div>
      </section>

      <section className="section blanc">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="kicker">Activités</span>
              <h2>Les activités confiées par nos partenaires</h2>
            </div>
            <p>Vous indiquez dans votre candidature celles qui vous intéressent ; les missions vous sont proposées en conséquence.</p>
          </div>
          <div className="activites">
            {ACTIVITES.map((a) => {
              const Ico = ICONE_ACTIVITE[a.k];
              return (
                <div className="activite" key={a.k}>
                  <span className="ico"><Ico taille={20} /></span>
                  <h3>{a.l}</h3>
                  <p>{a.d}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container colonnes">
          <div>
            <span className="kicker">Profil recherché</span>
            <h3>Ce que nous attendons</h3>
            <ul className="liste-filets">
              {PROFIL.map(([a, b]) => <li key={a}><IcoCheck taille={18} /><span><strong>{a}</strong> {b}</span></li>)}
            </ul>
          </div>
          <div>
            <span className="kicker">Conditions</span>
            <h3>Ce que nous offrons</h3>
            <ul className="liste-filets">
              {OFFRE.map(([a, b]) => <li key={a}><IcoCheck taille={18} /><span><strong>{a}</strong> {b}</span></li>)}
            </ul>
          </div>
        </div>
      </section>

      <section className="section blanc">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="kicker">Processus</span>
              <h2>Déroulement du recrutement</h2>
            </div>
          </div>
          <ol className="etapes">
            {PROCESSUS.map(([t, d]) => <li className="etape" key={t}><h3>{t}</h3><p>{d}</p></li>)}
          </ol>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="bandeau">
            <div>
              <h2>Déposer votre candidature</h2>
              <p>Munissez-vous d’une photo récente de vous. La candidature prend environ cinq minutes.</p>
            </div>
            <a className="btn btn-light btn-lg" href="#/postuler">Commencer <IcoFleche taille={18} /></a>
          </div>
        </div>
      </section>
    </>
  );
}
