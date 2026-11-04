// Met le site en ligne : construit `dist/` et l'envoie sur la branche
// `gh-pages` du dépôt, que GitHub Pages publie.
//   npm run publier
// Le code source reste sur `main` ; `gh-pages` ne contient que le site construit.
import { execSync } from 'node:child_process';
import { writeFileSync, rmSync } from 'node:fs';

const sh = (cmd, cwd) => execSync(cmd, { stdio: 'inherit', cwd });
const lire = (cmd) => execSync(cmd).toString().trim();

const depot = lire('git remote get-url origin');
const version = lire('git rev-parse --short HEAD');

sh('npm run build');
writeFileSync('dist/.nojekyll', '');           // pas de traitement Jekyll
rmSync('dist/.git', { recursive: true, force: true });
sh('git init -q -b gh-pages', 'dist');
sh('git add -A', 'dist');
sh(`git commit -q -m "Site construit depuis ${version}"`, 'dist');
sh(`git push -q -f ${depot} gh-pages`, 'dist');
rmSync('dist/.git', { recursive: true, force: true });
console.log(`\nEn ligne (sous 1 à 2 minutes) : version ${version}`);
