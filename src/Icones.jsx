// Icônes au trait, couleur du texte. Décoratives par défaut (aria-hidden).
const base = {
  width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
  strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true,
};
const I = (chemins) => function Icone({ taille = 20, ...p }) {
  return <svg {...base} width={taille} height={taille} {...p}>{chemins}</svg>;
};

export const IcoFleche = I(<><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></>);
export const IcoRetour = I(<><path d="M19 12H5" /><path d="M11 18l-6-6 6-6" /></>);
export const IcoCheck = I(<path d="M5 12.5l4.5 4.5L19 7.5" />);
export const IcoX = I(<><path d="M6 6l12 12" /><path d="M18 6L6 18" /></>);
export const IcoLieu = I(<><path d="M12 21s-7-6.1-7-11.5A7 7 0 0 1 19 9.5C19 14.9 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>);
export const IcoCalendrier = I(<><rect x="3.5" y="5" width="17" height="15" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>);
export const IcoHorloge = I(<><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>);
export const IcoGens = I(<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M21.5 20a6.5 6.5 0 0 0-4-6" /></>);
export const IcoPanier = I(<><path d="M3 4h2l2.2 11h11l2-8H6.2" /><circle cx="9" cy="19.5" r="1.3" /><circle cx="17" cy="19.5" r="1.3" /></>);
export const IcoMarche = I(<><path d="M3 10l2-6h14l2 6" /><path d="M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" /><path d="M5 12.5V20h14v-7.5" /><path d="M10 20v-5h4v5" /></>);
export const IcoMicro = I(<><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" /></>);
export const IcoTasse = I(<><path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9z" /><path d="M16 10.5h1.5a2.5 2.5 0 0 1 0 5H16" /><path d="M8 3.5c0 1.5 1 1.5 1 3M12 3.5c0 1.5 1 1.5 1 3" /></>);
export const IcoColis = I(<><path d="M21 8l-9-5-9 5 9 5 9-5z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" /></>);
export const IcoArgent = I(<><rect x="2.5" y="6" width="19" height="12" rx="2.5" /><circle cx="12" cy="12" r="2.6" /><path d="M6 9.5v.01M18 14.5v.01" /></>);
export const IcoBadge = I(<><rect x="4.5" y="3" width="15" height="18" rx="3" /><circle cx="12" cy="10" r="2.8" /><path d="M8 17a4.5 4.5 0 0 1 8 0" /></>);
export const IcoBouclier = I(<><path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V6L12 3z" /><path d="M9 12l2 2 4-4" /></>);
export const IcoAlerte = I(<><circle cx="12" cy="12" r="8.5" /><path d="M12 8v4.5M12 16v.01" /></>);
export const IcoInfo = I(<><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8v.01" /></>);
export const IcoCopie = I(<><rect x="8.5" y="8.5" width="11" height="11" rx="2.5" /><path d="M15.5 8.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7.5a2 2 0 0 0 2 2h2.5" /></>);
export const IcoWhatsapp = I(<><path d="M4 20l1.3-3.9A8 8 0 1 1 8 18.8L4 20z" /><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .8a3.4 3.4 0 0 1-1.8-1.8l.8-1-1-2L9 9.5z" /></>);
export const IcoRecherche = I(<><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" /></>);
export const IcoTableau = I(<><rect x="3.5" y="4" width="17" height="16" rx="2.5" /><path d="M9.5 4v16M15 4v16" /></>);
export const IcoMallette = I(<><rect x="3" y="7" width="18" height="13" rx="2.5" /><path d="M8.5 7V5.5A1.5 1.5 0 0 1 10 4h4a1.5 1.5 0 0 1 1.5 1.5V7M3 12.5h18" /></>);
export const IcoSortie = I(<><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" /><path d="M10 16l-4-4 4-4M6 12h10" /></>);
export const IcoPlus = I(<><path d="M12 5v14M5 12h14" /></>);
export const IcoAppareil = I(<><path d="M4 8.5A2.5 2.5 0 0 1 6.5 6H8l1.5-2h5L16 6h1.5A2.5 2.5 0 0 1 20 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-9z" /><circle cx="12" cy="12.5" r="3.5" /></>);
export const IcoEtoile = I(<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9L12 3.5z" />);

export function Marque({ clair }) {
  return (
    <svg width="22" height="22" viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="10" stroke={clair ? '#0B3B2E' : '#F2B544'} strokeWidth="3.4" fill="none" strokeDasharray="48 15" strokeLinecap="round" transform="rotate(-50 16 16)" />
      <circle cx="16" cy="16" r="3.6" fill={clair ? '#0B3B2E' : '#F2B544'} />
    </svg>
  );
}

export const ICONE_ACTIVITE = {
  supermarche: IcoPanier, open_market: IcoMarche, animation: IcoMicro,
  degustation: IcoTasse, distribution: IcoColis, autre: IcoMallette,
};
