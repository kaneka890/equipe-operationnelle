import { useEffect, useState } from 'react';
import { supabase, messageErreur } from '../supabase.js';
import { initiales } from '../libelles.js';
import { Marque, IcoTableau, IcoMallette, IcoSortie, IcoAlerte, IcoFleche } from '../Icones.jsx';
import Pipeline from './Pipeline.jsx';
import MissionsAdmin from './MissionsAdmin.jsx';

const ROLES = { admin: 'Administrateur', superviseur: 'Superviseur', direction: 'Direction' };

// Session + profil (rôle) de la personne connectée.
function useMoi() {
  const [etat, setEtat] = useState({ pret: false, session: null, profil: null, erreur: null, lent: false });
  useEffect(() => {
    let vivant = true;
    async function charger(session) {
      if (!session) { if (vivant) setEtat({ pret: true, session: null, profil: null, erreur: null, lent: false }); return; }
      const { data, error } = await supabase.from('profils').select('id, nom, role, actif').eq('id', session.user.id).maybeSingle();
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
        <section className="acces-carte acces-carte-etroite" aria-labelledby="acces-titre">
          <div className="acces-entete">
            <span className="acces-rubrique">Espace recruteurs</span>
            <h1 id="acces-titre">Accès non autorisé</h1>
          </div>
          <div className="acces-form">
            <p style={{ color: 'var(--ink-2)' }}>
              Ce compte n’a pas accès au recrutement. Seuls l’administrateur, les superviseurs et la direction
              de l’Équipe opérationnelle Octoplus CI y entrent.
            </p>
            <button className="btn btn-ghost" onClick={() => supabase.auth.signOut()}>Se déconnecter</button>
          </div>
        </section>
      </CadreAcces>
    );
  }

  const peutAgir = role === 'admin' || role === 'superviseur';
  const page = chemin.startsWith('/espace/missions') ? 'missions' : 'candidatures';

  return (
    <div className="app">
      <aside className="side">
        <a className="brand" href="#/espace" style={{ color: '#fff' }}>
          <span className="brand-mark" style={{ background: '#fff' }}><Marque clair /></span>
          <span>Octoplus CI<small>Équipe opérationnelle · Recrutement</small></span>
        </a>
        <nav aria-label="Espace recruteur">
          <a href="#/espace" aria-current={page === 'candidatures' ? 'page' : undefined}><IcoTableau />Candidatures</a>
          <a href="#/espace/missions" aria-current={page === 'missions' ? 'page' : undefined}><IcoMallette />Missions et partenaires</a>
          <a href="./index.html" target="_blank" rel="noreferrer"><IcoFleche />Voir le site public</a>
        </nav>
        <div className="moi">
          <span className="av">{initiales(profil.nom)}</span>
          <span className="qui"><strong>{profil.nom}</strong><span>{ROLES[role]}</span></span>
          <button aria-label="Se déconnecter" title="Se déconnecter" onClick={() => supabase.auth.signOut()}><IcoSortie /></button>
        </div>
      </aside>
      <main className="main">
        {page === 'missions'
          ? <MissionsAdmin peutAgir={peutAgir} />
          : <Pipeline peutAgir={peutAgir} moi={profil} />}
      </main>
    </div>
  );
}

// Cadre des pages d'accès : bande officielle, en-tête, contenu, pied de page.
function CadreAcces({ children }) {
  return (
    <div className="acces">
      <div className="bande-officielle">
        <div className="container">Portail de recrutement de l’Équipe opérationnelle Octoplus CI · Accès réservé</div>
      </div>
      <header className="acces-tete">
        <div className="container acces-tete-in">
          <a className="brand" href="./index.html" aria-label="Équipe opérationnelle Octoplus CI, site public">
            <span className="brand-mark"><Marque /></span>
            <span>Octoplus CI<small>Équipe opérationnelle</small></span>
          </a>
          <a className="acces-lien" href="./index.html">Site public</a>
        </div>
      </header>
      <main className="acces-corps">{children}</main>
      <footer className="acces-pied">
        <div className="container">© {new Date().getFullYear()} Équipe opérationnelle Octoplus CI · Côte d’Ivoire</div>
      </footer>
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
      <section className="acces-carte" aria-labelledby="acces-titre">
        <div className="acces-entete">
          <span className="acces-rubrique">Espace recruteurs</span>
          <h1 id="acces-titre">Connexion</h1>
        </div>
        <div className="acces-grille">
          <form className="acces-form" onSubmit={entrer} noValidate>
            <label className="field"><span>Adresse e-mail</span>
              <input className="input" type="email" autoComplete="username" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <div className="field">
              <label htmlFor="acces-mdp" className="label">Mot de passe</label>
              <div className="input-group">
                <input id="acces-mdp" className="input" type={voir ? 'text' : 'password'} autoComplete="current-password" value={mdp} onChange={(e) => setMdp(e.target.value)} />
                <button type="button" className="acces-voir" aria-pressed={voir} onClick={() => setVoir(!voir)}>{voir ? 'Masquer' : 'Afficher'}</button>
              </div>
            </div>
            {erreur && <div className="alert alert-danger" role="alert"><IcoAlerte />{erreur}</div>}
            <button className="btn btn-primary btn-lg" disabled={attente}>{attente ? 'Connexion…' : 'Se connecter'}</button>
          </form>
          <aside className="acces-infos" aria-label="Informations">
            <h2>Informations</h2>
            <dl>
              <div><dt>Compte</dt><dd>Le même e-mail et le même mot de passe que l’application Suivi terrain.</dd></div>
              <div><dt>Accès</dt><dd>Administrateur, superviseurs et direction.</dd></div>
              <div><dt>Mot de passe oublié</dt><dd>L’administrateur le réinitialise depuis Suivi terrain.</dd></div>
              <div><dt>Confidentialité</dt><dd>Les dossiers contiennent des données personnelles. Déconnectez-vous après usage sur un poste partagé.</dd></div>
            </dl>
          </aside>
        </div>
      </section>
    </CadreAcces>
  );
}
