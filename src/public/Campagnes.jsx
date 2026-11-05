import { useEffect, useState } from 'react';
import { supabase, messageErreur } from '../supabase.js';
import { ACTIVITES, libelleType, periode } from '../libelles.js';
import { liensPhotos, ESPACE_CAMPAGNES } from '../photo.js';
import { IcoAlerte } from '../Icones.jsx';
import { EntetePage } from './Commun.jsx';

const ref = (id) => String(id || '').replace(/-/g, '').slice(0, 6).toUpperCase();

// Campagnes réalisées : un registre récapitulatif, puis le dossier photographique
// de chaque campagne (photos publiées par les recruteurs).
export default function Campagnes() {
  const [etat, setEtat] = useState({ chargement: true, campagnes: [], erreur: null });
  const [liens, setLiens] = useState({});

  useEffect(() => {
    let vivant = true;
    supabase.rpc('campagnes_realisees').then(async ({ data, error }) => {
      if (!vivant) return;
      setEtat({ chargement: false, campagnes: data || [], erreur: error });
      const chemins = (data || []).flatMap((c) => (c.photos || []).map((p) => p.chemin));
      const l = await liensPhotos(chemins, ESPACE_CAMPAGNES);
      if (vivant) setLiens(l);
    });
    return () => { vivant = false; };
  }, []);

  const { chargement, campagnes, erreur } = etat;

  return (
    <>
      <EntetePage
        titre="Campagnes réalisées"
        texte="Registre des activités terrain conduites par les promotrices et promoteurs de l’Équipe opérationnelle Octoplus CI pour le compte de ses partenaires."
      />
      <div className="corps-page">
        <div className="container grille-page">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }}>
            {erreur && <div className="alert alert-danger"><IcoAlerte />{messageErreur(erreur)}</div>}

            <section className="encadre">
              <header>
                <h2>Registre des campagnes</h2>
                <p>{chargement ? 'Chargement…' : !campagnes.length ? 'Aucune campagne présentée' : `${campagnes.length} campagne${campagnes.length > 1 ? 's' : ''} présentée${campagnes.length > 1 ? 's' : ''}`}</p>
              </header>
              <div className="registre-table-wrap">
                <table className="registre-table registre-public">
                  <thead>
                    <tr><th>Réf.</th><th>Période</th><th>Activité</th><th>Campagne</th><th>Lieu</th><th>Promoteurs</th></tr>
                  </thead>
                  <tbody>
                    {!chargement && !campagnes.length && (
                      <tr><td colSpan={6} className="registre-vide">Aucune campagne enregistrée à ce jour.</td></tr>
                    )}
                    {campagnes.map((c) => (
                      <tr key={c.id} onClick={() => document.getElementById(`c-${c.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                        <td className="mono">{ref(c.id)}</td>
                        <td className="tnum" style={{ whiteSpace: 'nowrap' }}>{periode(c.date_debut, c.date_fin)}</td>
                        <td>{libelleType(c.type)}</td>
                        <td><strong style={{ color: 'var(--ink)' }}>{c.titre}</strong><br /><span className="hint">{c.partenaire ? `Pour le compte de ${c.partenaire}` : 'Partenaire non communiqué'}</span></td>
                        <td>{c.lieu}{c.ville ? `, ${c.ville}` : ''}</td>
                        <td className="tnum">{c.promoteurs || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {campagnes.map((c) => (
              <section className="encadre" key={c.id} id={`c-${c.id}`} style={{ scrollMarginTop: 90 }}>
                <header>
                  <p className="offre-meta" style={{ marginBottom: 4 }}>Réf. {ref(c.id)}<span aria-hidden="true">·</span>{libelleType(c.type)}</p>
                  <h2>{c.titre}</h2>
                  <p>{c.partenaire ? `Pour le compte de ${c.partenaire}` : 'Partenaire non communiqué'} · {c.lieu}{c.ville ? `, ${c.ville}` : ''} · {periode(c.date_debut, c.date_fin)}</p>
                </header>
                <div className="galerie" style={{ borderTop: 0 }}>
                  {(c.photos || []).map((p, i) => (
                    <figure key={p.chemin}>
                      <a href={liens[p.chemin]} target="_blank" rel="noreferrer" className="galerie-img">
                        {liens[p.chemin] ? <img src={liens[p.chemin]} alt={p.legende || `${c.titre}, photo ${i + 1}`} loading="lazy" /> : null}
                      </a>
                      <figcaption><span className="tnum">Fig. {i + 1}</span>{p.legende ? ` — ${p.legende}` : ''}</figcaption>
                    </figure>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <aside className="encadre">
            <header><h2>Informations</h2></header>
            <ul className="a-savoir">
              <li><strong>Champ des activités</strong>{ACTIVITES.map((a) => a.l).join(', ')}.</li>
              <li><strong>Contenu du registre</strong>Campagnes commencées ou achevées dont les photographies ont été versées au dossier.</li>
              <li><strong>Photographies</strong>Publiées avec l’accord des personnes concernées. Le nom d’un partenaire n’est mentionné qu’avec son autorisation.</li>
              <li><strong>Rejoindre l’équipe</strong><a href="#/postuler">Accéder au formulaire de candidature</a></li>
            </ul>
          </aside>
        </div>
      </div>
    </>
  );
}
