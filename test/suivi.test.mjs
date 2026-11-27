import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { charger } from '../outils/reste-a-faire/build.mjs';
import { ID, chargerDecisions, choixPermis, comptesDecisions, page, validerDecisions } from '../outils/suivi/build.mjs';

// Norma 3.0 — page unique « Suivi Atrium » : reste à faire et décisions de toute la suite.
const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const question = (o = {}) => ({ id: 'arche:Q-1', ref: 'Q-1', outil: 'arche', groupe: 'prio', nature: 'question', titre: 'Une question ?', contexte: 'Contexte',
  proposition: 'Oui', alternatives: ['Non'], bloque: '', statut: 'ouverte', reponse: null, ...o });
const fichier = (questions, o = {}) => ({ outil: 'arche', updated: '2026-11-27', groupes: { prio: 'À traiter en priorité' }, decide: [], questions, ...o });

test('un fichier decisions/ par outil du registre, Norma et l’outil d’ingénierie ; ids uniques dans la suite', () => {
  const docs = chargerDecisions(racine);
  const registre = JSON.parse(readFileSync(path.join(racine, 'registre/outils.json'), 'utf8')).outils.map((o) => o.code);
  assert.deepEqual(docs.map((d) => d.outil).sort(), [...registre, 'ingenium', 'norma'].sort());
  const ids = docs.flatMap((d) => d.questions.map((q) => q.id));
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.match(id, ID, `${id} : identifiant de document de la base`);
});

test('schéma : statut, réponse, choix, groupe, nature contrôlés', () => {
  assert.deepEqual(validerDecisions(fichier([question()]), { codes: ['arche'] }), []);
  const p = validerDecisions(fichier([
    question({ statut: 'fini' }),
    question({ id: 'arche:Q-2', ref: 'Q-2', statut: 'repondue', reponse: { choix: 'alt3', note: '', date: '2026-11-27', source: 'x' } }),
    question({ id: 'arche:Q-3', ref: 'Q-3', groupe: 'z', nature: 'autre' }),
    question({ id: 'arche:Q-4', ref: 'Q-4', reponse: { choix: 'default' } }),
    question({ id: 'arche:Q-5', ref: 'Q-6' }),
  ]), { codes: ['arche'] });
  for (const attendu of ['statut « fini »', 'choix « alt3 »', 'groupe « z »', '« nature »', 'reponse » à null', '<outil>:<ref>']) assert.ok(p.some((l) => l.includes(attendu)), attendu);
  assert.ok(validerDecisions(fichier([question(), question()]), { codes: ['arche'] }).some((l) => l.includes('id en double')));
  assert.ok(validerDecisions(fichier([question({ id: 'arche:Q 1', ref: 'Q 1' })]), { codes: ['arche'] }).some((l) => l.includes('« id »')));
  const donnee = question({ nature: 'donnee', proposition: undefined, alternatives: undefined, statut: 'repondue', reponse: { choix: 'donnee', note: '', date: '2026-11-27', source: 's' } });
  assert.ok(validerDecisions(fichier([donnee]), { codes: ['arche'] }).some((l) => l.includes('porte la donnée')));
  assert.deepEqual(choixPermis(question()), ['default', 'alt1', 'other', 'discuss']);
});

test('un fichier invalide ou manquant arrête la génération', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'norma-suivi-'));
  cpSync(path.join(racine, 'registre'), path.join(dir, 'registre'), { recursive: true });
  cpSync(path.join(racine, 'decisions'), path.join(dir, 'decisions'), { recursive: true });
  writeFileSync(path.join(dir, 'decisions/vector.json'), '{');
  assert.throws(() => chargerDecisions(dir), /vector.json : JSON invalide/);
});

test('les réponses déjà données dans les anciens questionnaires sont reprises', () => {
  const docs = chargerDecisions(racine);
  const by = Object.fromEntries(docs.map((d) => [d.outil, comptesDecisions(d.questions)]));
  for (const o of ['arche', 'crucible', 'modulus']) assert.ok(by[o].repondue > 0, o);
  const p2 = docs.find((d) => d.outil === 'crucible').questions.find((q) => q.ref === 'P-2');
  assert.equal(p2.reponse.choix, 'other');
  assert.equal(p2.reponse.source, 'questionnaire crucible');
});

test('la page : toutes les questions et tous les points, réponses dans la collection answers, sans repère ni fermeture de script', () => {
  const raf = charger(racine);
  const dec = chargerDecisions(racine);
  const html = page(raf, dec);
  assert.match(html, /<title>Suivi Atrium<\/title>/);
  assert.doesNotMatch(html, /__[A-Z]+__/);
  const qs = /const QUESTIONS = (.*);\n/.exec(html)[1];
  assert.doesNotMatch(qs, /<\//);
  assert.equal(JSON.parse(qs).length, dec.reduce((s, d) => s + d.questions.length, 0));
  assert.equal(JSON.parse(/const ITEMS = (.*);\n/.exec(html)[1]).length, raf.reduce((s, d) => s + d.items.length, 0));
  assert.match(html, /collection\('answers'\)/);
  assert.match(html, /use\('user'\)/);
  assert.match(html, /:root\[data-theme="light"\]/);
  assert.ok(html.length < 2 * 1024 * 1024, `page sous 2 Mo (${html.length} octets)`);
});

test('aucune appellation de l’ancienne suite ni de l’entreprise dans les fichiers de Norma', () => {
  const ancien = new RegExp(['ep', 'c ?2 ?i|\\bEP', 'C\\b'].join(''), 'i');
  const tous = JSON.stringify(chargerDecisions(racine)) + JSON.stringify(charger(racine));
  assert.doesNotMatch(tous, ancien);
  for (const f of ['REGLES.md', 'README.md', 'CLAUDE.md', 'CHANGELOG.md', 'registre/outils.json', 'charte/README.md', 'charte/COQUE.md', 'outils/suivi/page.template.html', 'outils/questionnaire/page.template.html', 'decisions/SCHEMA.md'])
    assert.doesNotMatch(readFileSync(path.join(racine, f), 'utf8'), ancien, f);
});
