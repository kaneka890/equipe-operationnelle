// Les valeurs rangées dans la base et leurs libellés à l'écran.
// Les clés doivent rester celles de recrutement.sql.

export const ACTIVITES = [
  { k: 'supermarche', l: 'Supermarché', d: 'Mise en avant et conseil en rayon' },
  { k: 'open_market', l: 'Open market', d: 'Vente et animation au marché' },
  { k: 'animation', l: 'Animation', d: 'Stand de marque, jeux, micro' },
  { k: 'degustation', l: 'Dégustation', d: 'Faire goûter, expliquer, convaincre' },
  { k: 'distribution', l: 'Distribution', d: 'Échantillons en boutique et en rue' },
];
export const TYPES_MISSION = [...ACTIVITES, { k: 'autre', l: 'Autre', d: '' }];
export const libelleType = (k) => TYPES_MISSION.find((t) => t.k === k)?.l ?? k;

export const JOURS = [
  { k: 'lun', l: 'Lun', long: 'Lundi' },
  { k: 'mar', l: 'Mar', long: 'Mardi' },
  { k: 'mer', l: 'Mer', long: 'Mercredi' },
  { k: 'jeu', l: 'Jeu', long: 'Jeudi' },
  { k: 'ven', l: 'Ven', long: 'Vendredi' },
  { k: 'sam', l: 'Sam', long: 'Samedi' },
  { k: 'dim', l: 'Dim', long: 'Dimanche' },
];
export const CRENEAUX = [
  { k: 'matin', l: 'Matin' },
  { k: 'apres_midi', l: 'Après-midi' },
  { k: 'soir', l: 'Soir' },
];
export const EXPERIENCES = [
  { k: 'aucune', l: 'Je débute', d: 'Aucune mission terrain pour l’instant' },
  { k: 'moins_6_mois', l: 'Moins de 6 mois', d: 'Quelques missions déjà faites' },
  { k: 'plus_6_mois', l: 'Plus de 6 mois', d: 'Habitué(e) du terrain' },
];
export const LANGUES_PROPOSEES = ['Français', 'Anglais', 'Dioula', 'Baoulé', 'Bété', 'Sénoufo'];

export const ETAPES = [
  { k: 'nouvelle', l: 'Nouvelles', court: 'Reçue', action: 'Pré-sélectionner' },
  { k: 'preselection', l: 'Pré-sélection', court: 'Pré-sélection', action: 'Passer à l’entretien' },
  { k: 'entretien', l: 'Entretien', court: 'Entretien', action: 'Envoyer en formation' },
  { k: 'formation', l: 'Formation', court: 'Formation', action: 'Valider' },
  { k: 'validee', l: 'Validés', court: 'Validé(e)', action: null },
];
export const libelleEtape = (k) =>
  k === 'refusee' ? 'Refusé(e)' : ETAPES.find((e) => e.k === k)?.court ?? k;
export const etapeSuivante = (k) => {
  const i = ETAPES.findIndex((e) => e.k === k);
  return i >= 0 && i < ETAPES.length - 1 ? ETAPES[i + 1].k : null;
};

export const CRITERES = [
  { k: 'presentation', l: 'Présentation' },
  { k: 'oral', l: 'Aisance à l’oral' },
  { k: 'dynamisme', l: 'Dynamisme' },
  { k: 'produit', l: 'Connaissance produit' },
];

export const STATUTS_MISSION = [
  { k: 'brouillon', l: 'Brouillon' },
  { k: 'ouverte', l: 'Ouverte' },
  { k: 'pourvue', l: 'Pourvue' },
  { k: 'terminee', l: 'Terminée' },
  { k: 'annulee', l: 'Annulée' },
];
export const STATUTS_AFFECTATION = [
  { k: 'prevue', l: 'Prévue' },
  { k: 'confirmee', l: 'Confirmée' },
  { k: 'realisee', l: 'Réalisée' },
  { k: 'absent', l: 'Absent(e)' },
  { k: 'annulee', l: 'Annulée' },
];

// ----- Mise en forme -----
const fmtJour = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' });
const fmtJourAn = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
const fmtDateHeure = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
});
const fmtCourt = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

const enDate = (d) => (d instanceof Date ? d : new Date(String(d).length === 10 ? d + 'T12:00:00' : d));

export const jour = (d) => (d ? fmtJour.format(enDate(d)) : '');
export const jourAn = (d) => (d ? fmtJourAn.format(enDate(d)) : '');
export const dateHeure = (d) => (d ? fmtDateHeure.format(enDate(d)) : '');
export const court = (d) => (d ? fmtCourt.format(enDate(d)) : '');
export function periode(d1, d2) {
  if (!d1) return '';
  if (!d2 || d1 === d2) return jourAn(d1);
  return `du ${jour(d1)} au ${jourAn(d2)}`;
}
export const fcfa = (n) =>
  n == null ? 'À définir' : `${Number(n).toLocaleString('fr-FR').replace(/ | /g, ' ')} FCFA`;

// Numéro ivoirien à 10 chiffres, comme _tel_ci() dans la base.
export function telCI(v) {
  const d = String(v || '').replace(/\D/g, '');
  if (/^\d{10}$/.test(d)) return d;
  if (/^225\d{10}$/.test(d)) return d.slice(3);
  if (/^00225\d{10}$/.test(d)) return d.slice(5);
  return null;
}
export const telAffiche = (t) => (t ? t.replace(/(\d{2})(?=\d)/g, '$1 ').trim() : '');
export const initiales = (nom) =>
  String(nom || '?').trim().split(/\s+/).slice(0, 2).map((m) => m[0]).join('').toUpperCase();
