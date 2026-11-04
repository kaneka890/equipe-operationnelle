import { useEffect, useState } from 'react';
import { supabase, messageErreur } from '../supabase.js';
import { libelleType, periode } from '../libelles.js';
import { liensPhotos, ESPACE_CAMPAGNES } from '../photo.js';
import { IcoAlerte } from '../Icones.jsx';
import { EntetePage } from './Commun.jsx';

// Campagnes réalisées : références présentées avec les photos publiées par les recruteurs.
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
        texte="Activités terrain menées par les promotrices et promoteurs de l’Équipe opérationnelle Octoplus CI pour le compte de ses partenaires."
      />
      <section className="corps-page">
        <div className="container">
          {erreur && <div className="alert alert-danger" style={{ marginBottom: 20 }}><IcoAlerte />{messageErreur(erreur)}</div>}
          {chargement ? (
            <div className="offres"><div className="squelette squelette-offre" /></div>
          ) : !campagnes.length ? (
            <div className="vide">
              <h3>Aucune campagne présentée pour le moment</h3>
              <p>Les campagnes réalisées seront présentées ici, avec leurs photos.</p>
            </div>
          ) : (
            <div className="offres">
              {campagnes.map((c) => (
                <article className="offre" key={c.id}>
                  <div className="offre-tete">
                    <div>
                      <p className="offre-meta">{libelleType(c.type)}<span aria-hidden="true">·</span>{periode(c.date_debut, c.date_fin)}</p>
                      <h3>{c.titre}</h3>
                      <p className="offre-partenaire">{c.partenaire ? `Pour le compte de ${c.partenaire}` : 'Partenaire non communiqué'}</p>
                    </div>
                  </div>
                  <dl className="offre-rubriques rubriques-3">
                    <div><dt>Lieu</dt><dd>{c.lieu}{c.ville ? `, ${c.ville}` : ''}</dd></div>
                    <div><dt>Période</dt><dd>{periode(c.date_debut, c.date_fin)}</dd></div>
                    <div><dt>Promoteurs mobilisés</dt><dd className="tnum">{c.promoteurs || '—'}</dd></div>
                  </dl>
                  <div className="galerie">
                    {(c.photos || []).map((p, i) => (
                      <figure key={p.chemin}>
                        <a href={liens[p.chemin]} target="_blank" rel="noreferrer" className="galerie-img">
                          {liens[p.chemin] ? <img src={liens[p.chemin]} alt={p.legende || `${c.titre}, photo ${i + 1}`} loading="lazy" /> : null}
                        </a>
                        {p.legende && <figcaption>{p.legende}</figcaption>}
                      </figure>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
