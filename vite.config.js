import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Chemins relatifs : le site marche tel quel sur GitHub Pages ou ailleurs.
export default defineConfig({
  plugins: [react()],
  base: './',
});
