import { createClient } from '@supabase/supabase-js';

// Base Kaba-Kaba (Suivi terrain). La clé est la clé PUBLIQUE, déjà dans
// l'appli Android : elle n'ouvre rien par elle-même, ce sont les règles de la
// base (recrutement.sql) qui décident de ce que chacun peut lire ou faire.
const URL = 'https://ckecrttqdlqhwvlcphpv.supabase.co';
const CLE_PUBLIQUE =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZWNydHRxZGxxaHd2bGNwaHB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4OTA4NjMsImV4cCI6MjA5OTQ2Njg2M30.M2wJ3nfOcSpeUoFSA_BetaBdJQGVZztPyE1JUTP2aMM';

export const supabase = createClient(URL, CLE_PUBLIQUE, {
  auth: { persistSession: true, storageKey: 'kk-talents-auth' },
});

// Message lisible pour une erreur de la base. Les refus métier (23514) et de
// droits (42501) portent déjà une phrase en français.
export function messageErreur(err) {
  if (!err) return '';
  if (err.code === '23514' || err.code === '42501') return err.message;
  if (/Failed to fetch|NetworkError|network/i.test(err.message || '')) {
    return 'Pas de connexion internet. Vérifiez le réseau puis réessayez.';
  }
  if (/Invalid login credentials/i.test(err.message || '')) {
    return 'E-mail ou mot de passe incorrect.';
  }
  return 'Une erreur est survenue. Réessayez dans un instant.';
}
