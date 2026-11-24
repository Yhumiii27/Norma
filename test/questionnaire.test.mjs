import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { construire, generer, valider } from '../outils/questionnaire/build.mjs';

const config = { titre: 'Décisions Exemple', sousTitre: 'Exemple · questionnaire', introduction: 'Intro <b>non interprétée</b>.', decide: ['A-1 · déjà décidé'],
  groupes: [['prio', 'À traiter en priorité'], ['data', 'Données à fournir']], sortie: '.artifacts/decisions-exemple.html' };
const questions = [
  { id: 'Q-1', group: 'prio', title: 'Une question ?', context: 'Contexte </script> piégé.', proposal: 'Oui', alts: ['Non'], blocks: 'L1' },
  { id: 'D-1', group: 'data', title: 'Une donnée', context: 'Liste à coller', kind: 'data', placeholder: 'Code ; libellé' },
];
const outil = (qs = questions, cfg = config) => {
  const dir = mkdtempSync(path.join(tmpdir(), 'norma-q-'));
  mkdirSync(path.join(dir, 'scripts/questionnaire'), { recursive: true });
  writeFileSync(path.join(dir, 'scripts/questionnaire/config.json'), JSON.stringify(cfg));
  writeFileSync(path.join(dir, 'scripts/questionnaire/questions.json'), JSON.stringify(qs));
  writeFileSync(path.join(dir, 'norma.config.json'), JSON.stringify({ outil: 'exemple' }));
  return dir;
};

test('génère la page d’un exemple : titre, groupes, questions, aucun repère restant', () => {
  const dir = outil();
  const r = generer(dir);
  assert.equal(r.nombre, 2);
  assert.equal(r.cible, path.join(dir, '.artifacts/decisions-exemple.html'));
  const html = readFileSync(r.cible, 'utf8');
  assert.match(html, /<title>Décisions Exemple<\/title>/);
  assert.match(html, /<li>A-1 · déjà décidé<\/li>/);
  assert.match(html, /Intro &lt;b&gt;non interprétée&lt;\/b&gt;\./);
  assert.match(html, /const GROUPS = \[\["prio","À traiter en priorité"\]/);
  assert.match(html, /collection\('answers'\)/, 'les réponses restent dans la collection answers');
  assert.doesNotMatch(html, /__[A-Z_]+__/);
  assert.doesNotMatch(html, /<\/script> piégé/, 'le texte d’une question ne ferme pas le script');
  assert.match(html, /:root\[data-theme="light"\]/, 'thème clair présent');
});

test('sortie par défaut : .artifacts/decisions-<outil>.html', () => {
  const { sortie, ...sans } = config;
  const r = generer(outil(questions, sans));
  assert.ok(r.cible.endsWith(path.join('.artifacts', 'decisions-exemple.html')));
});

test('refuse un id en double, un groupe inconnu et un champ manquant', () => {
  const qs = [...questions, { ...questions[0] }, { id: 'Q-9', group: 'inconnu', title: 'x', context: 'y', alts: [] }];
  const p = valider(config, qs);
  assert.ok(p.some((l) => l.includes('Q-1 : id en double')));
  assert.ok(p.some((l) => l.includes('groupe « inconnu » absent')));
  assert.ok(p.some((l) => l.includes('Q-9 : « proposal » obligatoire')));
  assert.throws(() => generer(outil(qs)), /id en double/);
});

test('config : titre et groupes obligatoires', () => {
  const p = valider({ groupes: [] }, []);
  assert.ok(p.some((l) => l.includes('« titre » obligatoire')));
  assert.ok(p.some((l) => l.includes('« groupes » obligatoire')));
});

test('construire ne réinterprète pas un repère présent dans le texte d’une question', () => {
  const html = construire(config, [{ ...questions[0], context: '__TITRE__ $& $1' }], new Date('2026-11-24T12:00:00Z'));
  assert.match(html, /"__TITRE__ \$& \$1"/);
  assert.match(html, /mis à jour le 24 novembre 2026/);
});
