#!/usr/bin/env node
// Page du questionnaire « Tâches et approbations » (proposition de Norma), par le modèle commun de Norma :
//   node propositions/questionnaire-taches/build.mjs [--sortie <page.html>]   (depuis la racine de Norma)
// lit config.json et questions.json de ce dossier, les contrôle (valider) et écrit la page (construire), par défaut
// .artifacts/questionnaire-taches.html. Réponses : base de l'artefact publié, collection `answers`.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { construire, valider } from '../../outils/questionnaire/build.mjs';

const ici = path.dirname(fileURLToPath(import.meta.url));
const racine = path.resolve(ici, '..', '..');
const lire = (f) => JSON.parse(readFileSync(path.join(ici, f), 'utf8'));
const config = lire('config.json');
const questions = lire('questions.json');
const problemes = valider(config, questions);
if (problemes.length) {
  for (const p of problemes) console.error(`✗ ${p}`);
  process.exit(1);
}
const args = process.argv.slice(2);
const i = args.indexOf('--sortie');
const cible = path.resolve(racine, i >= 0 ? args[i + 1] : config.sortie);
mkdirSync(path.dirname(cible), { recursive: true });
writeFileSync(cible, construire(config, questions));
console.log(`${questions.length} questions → ${path.relative(racine, cible)}`);
