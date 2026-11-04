import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// Chemins relatifs : le site marche tel quel sur GitHub Pages ou ailleurs.
// Deux pages séparées : le site des candidats (index.html) et l'espace des
// recruteurs (recruteurs.html), qui n'a aucun lien depuis le site public.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    rollupOptions: {
      input: {
        public: resolve(__dirname, 'index.html'),
        recruteurs: resolve(__dirname, 'recruteurs.html'),
      },
    },
  },
});
