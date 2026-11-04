import { useEffect, useState } from 'react'; // useState/useEffect : useMissions
import { supabase } from '../supabase.js';
import { libelleType, periode, fcfa } from '../libelles.js';
import { Marque } from '../Icones.jsx';

export function Topbar({ chemin }) {
  const courant = (c) => (chemin === c ? 'page' : undefined);
  return (
    <header className="topbar">
      <div className="container topbar-in">
        <a className="brand" href="#/" aria-label="Équipe opérationnelle Octoplus CI, accueil">
          <span className="brand-mark"><Marque /></span>
          <span>Octoplus CI<small>Équipe opérationnelle</small></span>
        </a>
        <nav className="nav" aria-label="Navigation">
          <a className="lien" href="#/missions" aria-current={courant('/missions')}>Missions</a>
          <a className="lien" href="#/suivi" aria-current={courant('/suivi')}>Suivre ma candidature</a>
          <a className="btn btn-sm btn-primary" href="#/postuler">Postuler</a>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-in">
        <span>© {new Date().getFullYear()} Équipe opérationnelle Octoplus CI · Recrutement des promotrices et promoteurs terrain</span>
        <a href="#/suivi">Suivre ma candidature</a>
      </div>
    </footer>
  );
}

// Les missions ouvertes, lues par la fonction publique de la base.
export function useMissions() {
  const [etat, setEtat] = useState({ chargement: true, missions: [], erreur: null });
  useEffect(() => {
    let vivant = true;
    supabase.rpc('missions_ouvertes').then(({ data, error }) => {
      if (!vivant) return;
      setEtat({ chargement: false, missions: data || [], erreur: error });
    });
    return () => { vivant = false; };
  }, []);
  return etat;
}

// Une mission présentée comme un avis de recrutement : rubriques en tableau, sans décor.
export function CarteMission({ m }) {
  const restantes = m.places_restantes;
  const ref = String(m.id || '').replace(/-/g, '').slice(0, 6).toUpperCase();
  return (
    <article className="offre">
      <div className="offre-tete">
        <div>
          <p className="offre-meta">{libelleType(m.type)}<span aria-hidden="true">·</span>Réf. {ref}</p>
          <h3>{m.titre}</h3>
          <p className="offre-partenaire">{m.partenaire ? `Pour le compte de ${m.partenaire}` : 'Partenaire communiqué à l’entretien'}</p>
          {m.description && <p className="offre-desc">{m.description}</p>}
        </div>
        <a className="btn btn-primary offre-btn" href={`#/postuler?mission=${m.id}`}>Postuler à cette mission</a>
      </div>
      <dl className="offre-rubriques">
        <div><dt>Lieu</dt><dd>{m.lieu}{m.ville ? `, ${m.ville}` : ''}</dd></div>
        <div><dt>Période</dt><dd>{periode(m.date_debut, m.date_fin)}</dd></div>
        <div><dt>Horaires</dt><dd>{m.horaires || 'Précisés à l’entretien'}</dd></div>
        <div><dt>Rémunération</dt><dd className="tnum">{m.tarif_jour != null ? `${fcfa(m.tarif_jour)} par jour` : 'Précisée à l’entretien'}</dd></div>
        <div><dt>Postes à pourvoir</dt><dd className="tnum">{restantes}</dd></div>
      </dl>
    </article>
  );
}

export function SansMission() {
  return (
    <div className="vide">
      <h3>Aucune mission ouverte pour le moment</h3>
      <p>Les candidatures restent recevables : les profils sont contactés dès qu’une mission correspond à leurs activités et disponibilités.</p>
      <a className="btn btn-primary" href="#/postuler">Déposer ma candidature</a>
    </div>
  );
}

// En-tête des pages intérieures : fil d'Ariane, titre et une phrase.
export function EntetePage({ titre, texte, children }) {
  return (
    <div className="entete-page">
      <div className="container">
        <nav className="fil" aria-label="Fil d’Ariane">
          <a href="#/">Accueil</a><span aria-hidden="true">/</span><span>{titre}</span>
        </nav>
        <h1>{titre}</h1>
        {texte && <p>{texte}</p>}
        {children}
      </div>
    </div>
  );
}
