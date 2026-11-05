import { useEffect, useState } from 'react';
import { supabase, messageErreur } from '../supabase.js';
import { initiales } from '../libelles.js';
import { Marque, IcoTableau, IcoMallette, IcoSortie, IcoAlerte, IcoFleche, IcoComptes, IcoCle } from '../Icones.jsx';
import Pipeline from './Pipeline.jsx';
import MissionsAdmin from './MissionsAdmin.jsx';
import Comptes, { ROLES, FormulaireMotDePasse } from './Comptes.jsx';

// Session + profil (rôle) de la personne connectée.
function useMoi() {
  const [etat, setEtat] = useState({ pret: false, session: null, profil: null, erreur: null, lent: false });
  useEffect(() => {
    let vivant = true;
    async function charger(session) {
      if (!session) { if (vivant) setEtat({ pret: true, session: null, profil: null, erreur: null, lent: false }); return; }
      const { data, error } = await supabase.from('profils').select('id, nom, role, actif, mdp_provisoire').eq('id', session.user.id).maybeSingle();
      if (vivant) setEtat({ pret: true, session, profil: data, erreur: error ? messageErreur(error) : null, lent: false });
    }
    supabase.auth.getSession().then(({ data }) => charger(data.session));
    // Ne jamais appeler Supabase directement dans ce rappel : la bibliothèque y tient
    // un verrou (renouvellement de session, toutes les heures) et la page se bloquerait.
    const { data: abo } = supabase.auth.onAuthStateChange((_e, session) => {
      setTimeout(() => charger(session), 0);
    });
    // Si rien ne répond (réseau très lent), on le dit au lieu d'une page vide.
    const minuteur = setTimeout(() => { if (vivant) setEtat((x) => (x.pret ? x : { ...x, lent: true })); }, 8000);
    return () => { vivant = false; clearTimeout(minuteur); abo.subscription.unsubscribe(); };
  }, []);
  return etat;
}

function Attente({ lent }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center', color: 'var(--ink-3)' }}>
        <p>{lent ? 'La connexion met du temps à répondre.' : 'Chargement de l’espace recruteurs…'}</p>
        {lent && <button className="btn btn-primary" onClick={() => window.location.reload()}>Recharger la page</button>}
      </div>
    </div>
  );
}

export default function Espace({ chemin }) {
  const { pret, session, profil, erreur, lent } = useMoi();
  if (!pret) return <Attente lent={lent} />;
  if (session && erreur) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div className="alert alert-danger" role="alert" style={{ maxWidth: 460, flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
          <span><IcoAlerte /> {erreur}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => window.location.reload()}>Réessayer</button>
        </div>
      </div>
    );
  }
  if (!session) return <Connexion />;

  const role = profil?.actif ? profil.role : null;
  if (!ROLES[role]) {
    return (
      <CadreAcces>
        <div className="acces-form">
          <div>
            <h1>Accès non autorisé</h1>
            <p>
              Ce compte n’a pas accès au recrutement. Seuls l’administrateur, les superviseurs et la direction
              de l’Équipe opérationnelle Octoplus CI y entrent.
            </p>
          </div>
          <button className="btn btn-ghost" onClick={() => supabase.auth.signOut({ scope: 'local' })}>Se déconnecter</button>
        </div>
      </CadreAcces>
    );
  }

  // Un mot de passe provisoire est connu de l'administrateur : on n'entre pas avec.
  if (profil.mdp_provisoire) {
    return <CadreAcces><FormulaireMotDePasse impose onFait={() => window.location.reload()} /></CadreAcces>;
  }

  const peutAgir = role === 'admin' || role === 'superviseur';
  const page = chemin.startsWith('/espace/missions') ? 'missions'
    : chemin.startsWith('/espace/comptes') && role === 'admin' ? 'comptes'
    : chemin.startsWith('/espace/mot-de-passe') ? 'mot-de-passe'
    : 'candidatures';

  return (
    <div className="app">
      <aside className="side">
        <a className="brand" href="#/espace" style={{ color: '#fff' }}>
          <span className="brand-mark" style={{ background: '#fff' }}><Marque clair /></span>
          <span>Octoplus CI<small>Équipe opérationnelle</small></span>
        </a>
        <nav aria-label="Espace recruteur">
          <a href="#/espace" aria-current={page === 'candidatures' ? 'page' : undefined}><IcoTableau />Candidatures</a>
          <a href="#/espace/missions" aria-current={page === 'missions' ? 'page' : undefined}><IcoMallette />Missions et partenaires</a>
          {role === 'admin' && <a href="#/espace/comptes" aria-current={page === 'comptes' ? 'page' : undefined}><IcoComptes />Comptes</a>}
          <a href="#/espace/mot-de-passe" aria-current={page === 'mot-de-passe' ? 'page' : undefined}><IcoCle />Mon mot de passe</a>
          <a href="./index.html" target="_blank" rel="noreferrer"><IcoFleche />Voir le site public</a>
        </nav>
        <div className="moi">
          <span className="av">{initiales(profil.nom)}</span>
          <span className="qui"><strong>{profil.nom}</strong><span>{ROLES[role]}</span></span>
          <button aria-label="Se déconnecter" title="Se déconnecter" onClick={() => supabase.auth.signOut({ scope: 'local' })}><IcoSortie /></button>
        </div>
      </aside>
      <main className="main">
        {page === 'missions' && <MissionsAdmin peutAgir={peutAgir} />}
        {page === 'comptes' && <Comptes moi={profil} />}
        {page === 'mot-de-passe' && (
          <>
            <div className="main-head"><div><p className="main-fil">Recrutement / Mon mot de passe</p><h1>Mon mot de passe</h1></div></div>
            <FormulaireMotDePasse />
          </>
        )}
        {page === 'candidatures' && <Pipeline peutAgir={peutAgir} moi={profil} />}
      </main>
    </div>
  );
}

// Cadre des pages d'accès : colonne d'identité à gauche, contenu à droite.
function CadreAcces({ children }) {
  return (
    <div className="acces">
      <aside className="acces-identite">
        <svg className="acces-filigrane" viewBox="0 0 32 32" aria-hidden="true">
          <circle cx="16" cy="16" r="10" stroke="currentColor" strokeWidth="3.4" fill="none" strokeDasharray="48 15" strokeLinecap="round" transform="rotate(-50 16 16)" />
          <circle cx="16" cy="16" r="3.6" fill="currentColor" />
        </svg>
        <a className="brand" href="./index.html" aria-label="Équipe opérationnelle Octoplus CI, site public">
          <span className="brand-mark"><Marque clair /></span>
          <span>Octoplus CI<small>Équipe opérationnelle</small></span>
        </a>
        <div className="acces-presentation">
          <h2>Espace recruteurs</h2>
          <dl>
            <div><dt>Candidatures</dt><dd>Registre, entretiens, décisions</dd></div>
            <div><dt>Missions</dt><dd>Partenaires, postes, affectations</dd></div>
            <div><dt>Campagnes</dt><dd>Photographies et publication</dd></div>
          </dl>
        </div>
        <p className="acces-mention">Accès réservé à l’administrateur, aux superviseurs et à la direction. Dossiers confidentiels.</p>
      </aside>
      <main className="acces-contenu">
        <a className="acces-lien" href="./index.html">Site public</a>
        <div className="acces-centre">{children}</div>
        <p className="acces-pied">© {new Date().getFullYear()} Équipe opérationnelle Octoplus CI · Côte d’Ivoire</p>
      </main>
    </div>
  );
}

function Connexion() {
  const [email, setEmail] = useState('');
  const [mdp, setMdp] = useState('');
  const [voir, setVoir] = useState(false);
  const [erreur, setErreur] = useState('');
  const [attente, setAttente] = useState(false);

  async function entrer(e) {
    e.preventDefault();
    setErreur('');
    if (!email.trim() || !mdp) { setErreur('Saisissez votre e-mail et votre mot de passe.'); return; }
    setAttente(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: mdp });
    setAttente(false);
    if (error) setErreur(messageErreur(error));
  }

  return (
    <CadreAcces>
      <form className="acces-form" onSubmit={entrer} noValidate>
        <div>
          <h1>Connexion</h1>
          <p>Identifiez-vous avec votre compte personnel.</p>
        </div>
        <label className="field"><span>Adresse e-mail</span>
          {/* Pas de saisie automatique au doigt : le clavier cacherait la page. */}
          <input className="input" type="email" autoComplete="username" autoFocus={window.matchMedia('(hover: hover)').matches} value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <div className="field">
          <label htmlFor="acces-mdp" className="label">Mot de passe</label>
          <div className="acces-mdp">
            <input id="acces-mdp" className="input" type={voir ? 'text' : 'password'} autoComplete="current-password" value={mdp} onChange={(e) => setMdp(e.target.value)} />
            <button type="button" aria-pressed={voir} onClick={() => setVoir(!voir)}>{voir ? 'Masquer' : 'Afficher'}</button>
          </div>
        </div>
        {erreur && <div className="alert alert-danger" role="alert"><IcoAlerte />{erreur}</div>}
        <button className="btn btn-primary btn-lg" disabled={attente}>{attente ? 'Connexion…' : 'Se connecter'}</button>
        <p className="acces-note">Mot de passe oublié : un administrateur le réinitialise depuis la rubrique Comptes.</p>
      </form>
    </CadreAcces>
  );
}
