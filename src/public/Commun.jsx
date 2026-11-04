import { useEffect, useState } from 'react'; // useState/useEffect : useMissions
import { supabase } from '../supabase.js';
import { libelleType, periode, fcfa } from '../libelles.js';
import {
  Marque, IcoLieu, IcoCalendrier, IcoHorloge, IcoGens, IcoFleche, ICONE_ACTIVITE,
} from '../Icones.jsx';

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

export function CarteMission({ m }) {
  const Ico = ICONE_ACTIVITE[m.type] || ICONE_ACTIVITE.autre;
  const restantes = m.places_restantes;
  return (
    <article className="mission">
      <div className="mission-top">
        <span className="tag tag-amber"><Ico taille={14} />{libelleType(m.type)}</span>
        <span className={`tag ${restantes <= 2 ? 'tag-danger' : 'tag-em'}`}>
          <span className="dot" />{restantes} {restantes > 1 ? 'places' : 'place'}
        </span>
      </div>
      <div>
        <h3>{m.titre}</h3>
        <p className="partenaire">{m.partenaire ? `Pour ${m.partenaire}` : 'Partenaire communiqué à l’entretien'}</p>
      </div>
      <dl>
        <div><dt>Lieu</dt><IcoLieu taille={18} /><dd>{m.lieu}{m.ville ? `, ${m.ville}` : ''}</dd></div>
        <div><dt>Dates</dt><IcoCalendrier taille={18} /><dd>{periode(m.date_debut, m.date_fin)}</dd></div>
        {m.horaires && <div><dt>Horaires</dt><IcoHorloge taille={18} /><dd>{m.horaires}</dd></div>}
      </dl>
      <div className="mission-foot">
        <div className="tarif tnum">{m.tarif_jour != null ? fcfa(m.tarif_jour) : 'Rémunération'}<small>{m.tarif_jour != null ? 'par jour' : 'précisée à l’entretien'}</small></div>
        <a className="btn btn-primary" href={`#/postuler?mission=${m.id}`}>Postuler <IcoFleche taille={18} /></a>
      </div>
    </article>
  );
}

export function SansMission() {
  return (
    <div className="vide">
      <span className="succes-ico" style={{ background: 'var(--em-50)', color: 'var(--em-700)' }}><IcoGens taille={26} /></span>
      <h3>Aucune mission ouverte pour le moment</h3>
      <p>Déposez votre candidature quand même : nous vous appelons dès qu’une mission correspond à votre profil et à vos disponibilités.</p>
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
