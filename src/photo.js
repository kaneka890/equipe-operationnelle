import { supabase } from './supabase.js';

export const ESPACE_PHOTOS = 'candidats-photos';

// Réduit une photo (1000 px au plus long côté) et la convertit en JPEG.
// Une photo de téléphone de 4 Mo devient ~150 Ko : l'envoi passe en 3G.
export async function preparerPhoto(fichier) {
  if (!fichier || !/^image\//.test(fichier.type || 'image/')) {
    throw new Error('Choisissez une image (photo).');
  }
  const img = await chargerImage(fichier);
  const max = 1000;
  const r = Math.min(1, max / Math.max(img.width, img.height));
  const w = Math.round(img.width * r);
  const h = Math.round(img.height * r);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  const blob = await new Promise((ok) => canvas.toBlob(ok, 'image/jpeg', 0.85));
  if (!blob) throw new Error('Cette image ne peut pas être lue. Essayez une autre photo.');
  if (w < 200 || h < 200) throw new Error('La photo est trop petite. Prenez-en une plus nette.');
  return { blob, apercu: URL.createObjectURL(blob) };
}

function chargerImage(fichier) {
  return new Promise((ok, ko) => {
    const url = URL.createObjectURL(fichier);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); ok(img); };
    img.onerror = () => { URL.revokeObjectURL(url); ko(new Error('Cette image ne peut pas être lue. Essayez une autre photo (JPEG ou PNG).')); };
    img.src = url;
  });
}

function identifiant() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  const b = window.crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

// Dépose la photo dans l'espace privé. Renvoie son chemin, à donner à postuler().
export async function deposerPhoto(blob) {
  const chemin = `depot/${identifiant()}.jpg`;
  const { error } = await supabase.storage.from(ESPACE_PHOTOS).upload(chemin, blob, {
    contentType: 'image/jpeg', upsert: false, cacheControl: '3600',
  });
  if (error) throw error;
  return chemin;
}

// Liens temporaires (1 h) pour les recruteurs : { chemin: url }.
export async function liensPhotos(chemins) {
  const liste = [...new Set(chemins.filter(Boolean))];
  if (!liste.length) return {};
  const { data } = await supabase.storage.from(ESPACE_PHOTOS).createSignedUrls(liste, 3600);
  return Object.fromEntries((data || []).filter((d) => d.signedUrl).map((d) => [d.path, d.signedUrl]));
}
