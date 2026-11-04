import { ACTIVITES } from '../libelles.js';
import { ICONE_ACTIVITE, IcoFleche, IcoBadge, IcoBouclier, IcoArgent } from '../Icones.jsx';
import { useMissions, CarteMission, SansMission } from './Commun.jsx';

export default function Accueil() {
  const { chargement, missions } = useMissions();
  const apercu = missions.slice(0, 3);

  return (
    <>
      <section className="hero">
        <div className="container hero-in">
          <div>
            <span className="eyebrow">Recrutement ouvert</span>
            <h1>Le terrain, c’est <em>votre</em> scène.</h1>
            <p className="lead">
              L’Équipe opérationnelle recrute des promotrices et promoteurs pour les marques de ses partenaires :
              supermarchés, marchés, animations, dégustations. Des missions rémunérées, près de chez vous,
              aux jours qui vous conviennent.
            </p>
            <div className="hero-cta">
              <a className="btn btn-amber btn-lg" href="#/postuler">Postuler en 5 minutes <IcoFleche taille={18} /></a>
              <a className="btn btn-light btn-lg" href="#/missions">Voir les missions</a>
            </div>
            <div className="hero-facts">
              <div><strong>5 min</strong><span>pour postuler, depuis le téléphone</span></div>
              <div><strong>Sans compte</strong><span>un code suffit pour suivre le dossier</span></div>
              <div><strong>Formation</strong><span>sur chaque produit avant la mission</span></div>
            </div>
          </div>

          <div className="badge-stack" aria-hidden="true">
            <div className="pass pass-2">
              <div className="pass-top">
                <span className="pass-photo">ÉO</span>
                <span className="tag" style={{ background: 'rgba(7,42,32,.12)', color: '#072A20' }}>Open market</span>
              </div>
              <h3>Badge de mission</h3>
              <div className="meta">
                <div><span>Statut</span>Validé(e)</div>
                <div><span>Formation</span>Faite</div>
              </div>
            </div>
            <div className="pass pass-1">
              <div className="pass-top">
                <span className="pass-photo">AT</span>
                <span className="tag tag-em"><span className="dot" />En entretien</span>
              </div>
              <div>
                <h3>Votre dossier</h3>
                <p style={{ fontSize: 14, color: 'var(--ink-3)', marginTop: 4 }}>Suivi en direct, étape par étape</p>
              </div>
              <div className="bar"><i /></div>
              <div className="meta">
                <div><span>Activités</span>Dégustation</div>
                <div><span>Jours</span>Ven · Sam · Dim</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="kicker">Nos activités</span>
              <h2>Cinq façons de représenter une marque</h2>
            </div>
            <p>Choisissez ce qui vous ressemble. Vous pouvez en cocher plusieurs : nous vous proposons les missions qui correspondent.</p>
          </div>
          <div className="activites">
            {ACTIVITES.map((a) => {
              const Ico = ICONE_ACTIVITE[a.k];
              return (
                <div className="activite" key={a.k}>
                  <span className="ico"><Ico taille={24} /></span>
                  <h3>{a.l}</h3>
                  <p>{a.d}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <div>
              <span className="kicker">Missions ouvertes</span>
              <h2>Les prochaines missions</h2>
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

      <section className="section" style={{ background: 'var(--surface)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
        <div className="container">
          <div className="section-head">
            <div>
              <span className="kicker">Comment ça se passe</span>
              <h2>De la candidature à la première mission</h2>
            </div>
          </div>
          <div className="etapes">
            <div className="etape"><h3>Vous postulez</h3><p>Un formulaire court, depuis votre téléphone. Vous recevez un code de suivi.</p></div>
            <div className="etape"><h3>Nous vous appelons</h3><p>Un superviseur étudie votre profil et vous propose un entretien.</p></div>
            <div className="etape"><h3>Vous êtes formé(e)</h3><p>Produit, message, tenue : vous savez exactement quoi dire et quoi faire.</p></div>
            <div className="etape"><h3>Vous êtes sur le terrain</h3><p>Badge, tenue et lieu de mission vous sont remis. Vous êtes payé(e) à la journée.</p></div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="activites" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', marginBottom: 56 }}>
            <div className="activite"><span className="ico"><IcoArgent taille={24} /></span><h3>Rémunéré à la journée</h3><p>Le tarif de chaque mission est affiché avant que vous postuliez.</p></div>
            <div className="activite"><span className="ico"><IcoBadge taille={24} /></span><h3>Encadré sur le terrain</h3><p>Un superviseur de l’équipe vous accompagne pendant chaque mission.</p></div>
            <div className="activite"><span className="ico"><IcoBouclier taille={24} /></span><h3>Vos données protégées</h3><p>Elles servent uniquement au recrutement. Seuls nos recruteurs les voient.</p></div>
          </div>
          <div className="bandeau">
            <div>
              <h2>Prêt(e) à rejoindre l’équipe terrain ?</h2>
              <p>Il faut avoir 18 ans, un téléphone avec WhatsApp, et l’envie d’aller vers les gens.</p>
            </div>
            <a className="btn btn-amber btn-lg" href="#/postuler">Je postule <IcoFleche taille={18} /></a>
          </div>
        </div>
      </section>
    </>
  );
}
