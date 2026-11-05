import { useCallback, useEffect, useState } from 'react';
import { supabase, messageErreur } from '../supabase.js';
import { IcoAlerte, IcoPlus } from '../Icones.jsx';
import { Modal } from './MissionsAdmin.jsx';

export const ROLES = { admin: 'Administrateur', superviseur: 'Superviseur', direction: 'Direction' };

const DROITS = {
  admin: 'Traite les dossiers et gère les comptes.',
  superviseur: 'Traite les dossiers.',
  direction: 'Consulte les dossiers, sans les modifier.',
};

// Sans lettres ni chiffres qui se confondent à la lecture (l, I, 1, O, 0).
const SIGNES = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function motDePasseProvisoire() {
  const tirage = crypto.getRandomValues(new Uint32Array(12));
  return Array.from(tirage, (n) => SIGNES[n % SIGNES.length]).join('');
}

// Appelle une fonction serveur ; rend le message d'erreur qu'elle a écrit.
async function appeler(fonction, body) {
  const { data, error } = await supabase.functions.invoke(fonction, { body });
  if (!error) return data;
  let message = '';
  try { message = (await error.context.json()).error; } catch { /* réponse sans message */ }
  if (/already.*registered|already exists/i.test(message)) message = 'Cette adresse e-mail a déjà un compte.';
  if (/valid.*email|email.*invalid/i.test(message)) message = 'Cette adresse e-mail n’est pas valide.';
  throw new Error(message || 'L’opération a échoué. Réessayez dans un instant.');
}

// Comptes qui entrent dans l'espace recruteurs. Réservé à l'administrateur.
export default function Comptes({ moi }) {
  const [liste, setListe] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [creation, setCreation] = useState(false);
  const [provisoire, setProvisoire] = useState(null); // { nom, email, mdp } à remettre

  const charger = useCallback(async () => {
    const { data, error } = await supabase.from('profils')
      .select('id, nom, telephone, role, actif, mdp_provisoire')
      .in('role', Object.keys(ROLES))
      .order('actif', { ascending: false })
      .order('nom');
    setChargement(false);
    if (error) { setErreur(messageErreur(error)); return; }
    setListe(data || []);
  }, []);

  useEffect(() => { charger(); }, [charger]);

  async function reinitialiser(c) {
    if (!window.confirm(`Réinitialiser le mot de passe de ${c.nom} ? Son mot de passe actuel cessera de fonctionner, y compris dans Suivi terrain.`)) return;
    setErreur('');
    try {
      const mdp = motDePasseProvisoire();
      await appeler('gerer-utilisateur', { action: 'motdepasse', userId: c.id, password: mdp });
      const { error } = await supabase.from('profils').update({ mdp_provisoire: true }).eq('id', c.id);
      if (error) throw error;
      setProvisoire({ nom: c.nom, mdp });
      charger();
    } catch (e) { setErreur(e.code ? messageErreur(e) : e.message); }
  }

  async function basculer(c) {
    if (c.actif && !window.confirm(`Désactiver le compte de ${c.nom} ? Cette personne n’aura plus accès à l’espace recruteurs ni à Suivi terrain.`)) return;
    setErreur('');
    const { error } = await supabase.from('profils').update({ actif: !c.actif }).eq('id', c.id);
    if (error) { setErreur(messageErreur(error)); return; }
    charger();
  }

  return (
    <>
      <div className="main-head">
        <div>
          <p className="main-fil">Recrutement / Comptes</p>
          <h1>Comptes</h1>
          <p>Un compte par personne, à son nom. Le journal des dossiers indique qui a fait quoi.</p>
        </div>
        <div className="toolbar">
          <button className="btn btn-primary" onClick={() => setCreation(true)}><IcoPlus taille={18} />Nouveau compte</button>
        </div>
      </div>

      {erreur && <div className="alert alert-danger" role="alert" style={{ marginBottom: 16 }}><IcoAlerte />{erreur}</div>}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr><th>Nom</th><th>Téléphone</th><th>Rôle</th><th>État</th><th><span className="sr">Actions</span></th></tr>
          </thead>
          <tbody>
            {liste.map((c) => (
              <tr key={c.id}>
                <td><strong>{c.nom}</strong>{c.id === moi.id && <span style={{ color: 'var(--ink-3)' }}> (vous)</span>}</td>
                <td className="tnum">{c.telephone || '—'}</td>
                <td>{ROLES[c.role]}</td>
                <td>{!c.actif ? 'Désactivé' : c.mdp_provisoire ? 'Mot de passe à choisir' : 'Actif'}</td>
                <td>
                  {c.id !== moi.id && (
                    <div className="comptes-actions">
                      {c.actif && <button className="btn btn-ghost btn-sm" onClick={() => reinitialiser(c)}>Réinitialiser le mot de passe</button>}
                      <button className="btn btn-ghost btn-sm" onClick={() => basculer(c)}>{c.actif ? 'Désactiver' : 'Réactiver'}</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {!chargement && !liste.length && <tr><td colSpan={5} style={{ color: 'var(--ink-3)' }}>Aucun compte.</td></tr>}
          </tbody>
        </table>
      </div>

      {creation && (
        <ModalCompte
          onFermer={() => setCreation(false)}
          onFait={(remise) => { setCreation(false); setProvisoire(remise); charger(); }}
        />
      )}
      {provisoire && <ModalRemise remise={provisoire} onFermer={() => setProvisoire(null)} />}
    </>
  );
}

function ModalCompte({ onFermer, onFait }) {
  const [f, setF] = useState({ nom: '', email: '', telephone: '', role: 'admin' });
  const [erreur, setErreur] = useState('');
  const [attente, setAttente] = useState(false);
  const champ = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function creer() {
    setErreur('');
    const nom = f.nom.trim();
    const email = f.email.trim().toLowerCase();
    if (nom.length < 3) { setErreur('Saisissez le prénom et le nom de la personne.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErreur('Saisissez une adresse e-mail valide.'); return; }
    setAttente(true);
    try {
      const mdp = motDePasseProvisoire();
      // Le serveur ne crée pas d'administrateur directement : le compte naît
      // « direction » (sans droit d'écriture), puis reçoit son rôle.
      const { profil } = await appeler('creer-commercial', {
        email, password: mdp, nom, telephone: f.telephone.trim(),
        role: f.role === 'admin' ? 'direction' : f.role,
      });
      const { error } = await supabase.from('profils').update({ role: f.role, mdp_provisoire: true }).eq('id', profil.id);
      if (error) throw error;
      onFait({ nom, email, mdp });
    } catch (e) {
      setAttente(false);
      setErreur(e.code ? messageErreur(e) : e.message);
    }
  }

  return (
    <Modal titre="Nouveau compte" onFermer={onFermer} pied={
      <>
        <button className="btn btn-ghost" onClick={onFermer}>Annuler</button>
        <button className="btn btn-primary" disabled={attente} onClick={creer}>{attente ? 'Création…' : 'Créer le compte'}</button>
      </>
    }>
      <label className="field"><span>Prénom et nom</span>
        <input className="input" value={f.nom} onChange={champ('nom')} autoFocus />
      </label>
      <label className="field"><span>Adresse e-mail personnelle</span>
        <input className="input" type="email" value={f.email} onChange={champ('email')} autoComplete="off" />
      </label>
      <label className="field"><span>Téléphone (facultatif)</span>
        <input className="input" type="tel" value={f.telephone} onChange={champ('telephone')} autoComplete="off" />
      </label>
      <label className="field"><span>Rôle</span>
        <select className="select" value={f.role} onChange={champ('role')}>
          {Object.entries(ROLES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <span className="hint">{DROITS[f.role]}</span>
      </label>
      {erreur && <div className="alert alert-danger" role="alert"><IcoAlerte />{erreur}</div>}
    </Modal>
  );
}

// Le mot de passe provisoire n'est montré qu'une fois : il n'est gardé nulle part.
function ModalRemise({ remise, onFermer }) {
  const [copie, setCopie] = useState(false);
  async function copier() {
    try { await navigator.clipboard.writeText(remise.mdp); setCopie(true); } catch { setCopie(false); }
  }
  return (
    <Modal titre="Identifiants à remettre" onFermer={onFermer} pied={
      <button className="btn btn-primary" onClick={onFermer}>Terminé</button>
    }>
      <p>Remettez ces identifiants à <strong>{remise.nom}</strong> en personne. Ce mot de passe ne sera plus affiché.</p>
      <table className="comptes-remise">
        <tbody>
          {remise.email && <tr><th>E-mail</th><td>{remise.email}</td></tr>}
          <tr><th>Mot de passe provisoire</th><td className="comptes-mdp">{remise.mdp}</td></tr>
        </tbody>
      </table>
      <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }} onClick={copier}>{copie ? 'Copié' : 'Copier le mot de passe'}</button>
      <p style={{ color: 'var(--ink-3)', fontSize: 14 }}>À sa connexion à l’espace recruteurs, cette personne devra choisir son propre mot de passe.</p>
    </Modal>
  );
}

// Choix du mot de passe personnel : imposé après un mot de passe provisoire,
// et ouvert à tous depuis le menu.
export function FormulaireMotDePasse({ impose, onFait }) {
  const [mdp, setMdp] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [erreur, setErreur] = useState('');
  const [attente, setAttente] = useState(false);
  const [fait, setFait] = useState(false);

  async function enregistrer(e) {
    e.preventDefault();
    setErreur('');
    setFait(false);
    if (mdp.length < 8) { setErreur('Le mot de passe doit faire au moins 8 caractères.'); return; }
    if (mdp !== confirmation) { setErreur('Les deux saisies ne sont pas identiques.'); return; }
    setAttente(true);
    const { error } = await supabase.auth.updateUser({ password: mdp });
    if (error) {
      setAttente(false);
      setErreur(/different from the old/i.test(error.message)
        ? 'Choisissez un mot de passe différent du précédent.' : messageErreur(error));
      return;
    }
    const { error: e2 } = await supabase.rpc('mot_de_passe_personnel_choisi');
    setAttente(false);
    if (e2) { setErreur(messageErreur(e2)); return; }
    setMdp(''); setConfirmation('');
    setFait(true);
    onFait?.();
  }

  return (
    <form className="acces-form" onSubmit={enregistrer} noValidate>
      {impose && (
        <div>
          <h1>Choisissez votre mot de passe</h1>
          <p>Votre mot de passe actuel est provisoire. Choisissez-en un que vous seul(e) connaissez.</p>
        </div>
      )}
      <label className="field"><span>Nouveau mot de passe</span>
        <input className="input" type="password" autoComplete="new-password" value={mdp} onChange={(e) => setMdp(e.target.value)} />
        <span className="hint">8 caractères au moins. Il servira aussi dans Suivi terrain.</span>
      </label>
      <label className="field"><span>Confirmation</span>
        <input className="input" type="password" autoComplete="new-password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} />
      </label>
      {erreur && <div className="alert alert-danger" role="alert"><IcoAlerte />{erreur}</div>}
      {fait && <div className="alert alert-info" role="status">Votre mot de passe est enregistré.</div>}
      <button className="btn btn-primary btn-lg" disabled={attente}>{attente ? 'Enregistrement…' : 'Enregistrer le mot de passe'}</button>
    </form>
  );
}
