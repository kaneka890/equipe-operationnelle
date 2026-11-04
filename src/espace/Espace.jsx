import { useEffect, useState } from 'react';
import { supabase, messageErreur } from '../supabase.js';
import { initiales } from '../libelles.js';
import { Marque, IcoTableau, IcoMallette, IcoSortie, IcoAlerte, IcoFleche } from '../Icones.jsx';
import Pipeline from './Pipeline.jsx';
import MissionsAdmin from './MissionsAdmin.jsx';

const ROLES = { admin: 'Administrateur', superviseur: 'Superviseur', direction: 'Direction' };

// Session + profil (rôle) de la personne connectée.
function useMoi() {
  const [etat, setEtat] = useState({ pret: false, session: null, profil: null });
  useEffect(() => {
    let vivant = true;
    async function charger(session) {
      if (!session) { if (vivant) setEtat({ pret: true, session: null, profil: null }); return; }
      const { data } = await supabase.from('profils').select('id, nom, role, actif').eq('id', session.user.id).maybeSingle();
      if (vivant) setEtat({ pret: true, session, profil: data });
    }
    supabase.auth.getSession().then(({ data }) => charger(data.session));
    const { data: abo } = supabase.auth.onAuthStateChange((_e, session) => charger(session));
    return () => { vivant = false; abo.subscription.unsubscribe(); };
  }, []);
  return etat;
}

export default function Espace({ chemin }) {
  const { pret, session, profil } = useMoi();
  if (!pret) return <div style={{ minHeight: '100vh' }} />;
  if (!session) return <Connexion />;

  const role = profil?.actif ? profil.role : null;
  if (!ROLES[role]) {
    return (
      <div className="login-form" style={{ minHeight: '100vh' }}>
        <div className="card card-pad" style={{ width: 'min(460px, 100%)', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h1 style={{ fontSize: 26 }}>Accès réservé aux recruteurs</h1>
          <p style={{ color: 'var(--ink-3)' }}>
            Ce compte n’a pas accès au recrutement. Seuls l’administrateur, les superviseurs et la direction
            de l’Équipe opérationnelle y entrent.
          </p>
          <button className="btn btn-ghost" onClick={() => supabase.auth.signOut()}>Se déconnecter</button>
        </div>
      </div>
    );
  }

  const peutAgir = role === 'admin' || role === 'superviseur';
  const page = chemin.startsWith('/espace/missions') ? 'missions' : 'candidatures';

  return (
    <div className="app">
      <aside className="side">
        <a className="brand" href="#/espace" style={{ color: '#fff' }}>
          <span className="brand-mark" style={{ background: '#fff' }}><Marque clair /></span>
          <span>Équipe opérationnelle<small>Recrutement</small></span>
        </a>
        <nav aria-label="Espace recruteur">
          <a href="#/espace" aria-current={page === 'candidatures' ? 'page' : undefined}><IcoTableau />Candidatures</a>
          <a href="#/espace/missions" aria-current={page === 'missions' ? 'page' : undefined}><IcoMallette />Missions et partenaires</a>
          <a href="#/" target="_blank" rel="noreferrer"><IcoFleche />Voir le site public</a>
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

function Connexion() {
  const [email, setEmail] = useState('');
  const [mdp, setMdp] = useState('');
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
    <div className="login">
      <div className="login-art">
        <a className="brand" href="#/" style={{ color: '#fff' }}>
          <span className="brand-mark" style={{ background: '#fff' }}><Marque clair /></span>
          <span>Équipe opérationnelle<small>Recrutement</small></span>
        </a>
        <div>
          <span className="eyebrow">Espace recruteur</span>
          <h2 style={{ marginTop: 18 }}>Chaque candidature, de l’arrivée à la mission.</h2>
          <p>Pré-sélection, entretien noté, formation, affectation aux missions des partenaires : tout au même endroit, avec l’historique de chaque dossier.</p>
        </div>
        <p style={{ fontSize: 13.5 }}>Même compte que l’application Suivi terrain.</p>
      </div>
      <div className="login-form">
        <form onSubmit={entrer} noValidate>
          <div>
            <h1>Connexion</h1>
            <p style={{ color: 'var(--ink-3)', marginTop: 8 }}>Avec votre e-mail et votre mot de passe Suivi terrain.</p>
          </div>
          <label className="field"><span>E-mail</span>
            <input className="input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="field"><span>Mot de passe</span>
            <input className="input" type="password" autoComplete="current-password" value={mdp} onChange={(e) => setMdp(e.target.value)} />
          </label>
          {erreur && <div className="alert alert-danger" role="alert"><IcoAlerte />{erreur}</div>}
          <button className="btn btn-primary btn-lg" disabled={attente}>{attente ? 'Connexion…' : 'Se connecter'}</button>
          <a href="#/" style={{ fontSize: 14.5 }}>Retour au site public</a>
        </form>
      </div>
    </div>
  );
}
