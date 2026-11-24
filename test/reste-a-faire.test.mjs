import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { charger, comptes, markdown, page, valider } from '../outils/reste-a-faire/build.mjs';

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const point = (o = {}) => ({ id: 'X-1', title: 'Titre', description: 'Desc', category: 'c', kind: 'fonction', priority: 'prochaine_etape', status: 'non_commence',
  waiting_on: '', effort: 'M', sources: ['doc.md'], evidence: [], progress: { state: 'a_faire', delivery: null, note: '' }, ...o });
const doc = (items, o = {}) => ({ outil: 'keystone', generated: '2026-11-24', updated: '2026-11-24', categories: { c: 'Catégorie' }, history: [{ date: '2026-11-24', text: 'x' }], items, ...o });

test('les fichiers de reste-a-faire/ respectent le schéma, un par outil du registre et Norma', () => {
  const docs = charger(racine);
  const registre = JSON.parse(readFileSync(path.join(racine, 'registre/outils.json'), 'utf8')).outils.map((o) => o.code);
  assert.deepEqual(docs.map((d) => d.outil).sort(), [...registre, 'norma'].sort());
  for (const d of docs) assert.ok(d.items.length > 0, `${d.outil} : au moins un point`);
});

test('ids uniques par outil, et un id en double est refusé', () => {
  for (const d of charger(racine)) assert.equal(new Set(d.items.map((x) => x.id)).size, d.items.length, d.outil);
  assert.ok(valider(doc([point(), point()])).some((l) => l.includes('X-1 : id en double')));
});

test('schéma : priorité, statut, état, effort, catégorie et sources contrôlés', () => {
  const p = valider(doc([point({ priority: 'urgent', status: 'x', effort: 'XXL', category: 'z', sources: [], progress: { state: 'fini' } })]), { codes: ['keystone'] });
  for (const attendu of ['priorité « urgent »', 'statut « x »', 'effort « XXL »', 'catégorie « z »', '« sources »', '« progress.state »']) assert.ok(p.some((l) => l.includes(attendu)), attendu);
  assert.ok(valider(doc([point()], { outil: 'inconnu' }), { codes: ['keystone'] }).some((l) => l.includes('absent du registre')));
  assert.ok(valider(doc([point()]), { fichier: 'codex.json' }).some((l) => l.includes('keystone.json')));
  assert.deepEqual(valider(doc([point({ effort: null, aliases: ['a'], details: { k: 1 } })]), { codes: ['keystone'] }), []);
});

test('comptes fait / en cours / à faire', () => {
  const xs = [point(), point({ id: 'X-2', progress: { state: 'fait', delivery: 'L1', note: '' } }), point({ id: 'X-3', progress: { state: 'en_cours', delivery: null, note: 'n' } })];
  assert.deepEqual(comptes(xs), { total: 3, fait: 1, en_cours: 1, a_faire: 1 });
  const md = markdown([{ ...doc(xs), nom: 'Keystone' }]);
  assert.match(md, /\| \[Keystone\]\(#keystone\) \| 1 \| 1 \| 1 \| 3 \|/);
  assert.match(md, /Faits : X-2 Titre\./);
});

test('un fichier manquant ou invalide arrête la génération', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'norma-raf-'));
  cpSync(path.join(racine, 'registre'), path.join(dir, 'registre'), { recursive: true });
  cpSync(path.join(racine, 'reste-a-faire'), path.join(dir, 'reste-a-faire'), { recursive: true });
  writeFileSync(path.join(dir, 'reste-a-faire/modulus.json'), '{');
  assert.throws(() => charger(dir), /modulus.json : JSON invalide/);
});

test('la page embarque tous les points, sans repère restant ni fermeture de script', () => {
  const docs = charger(racine);
  const html = page(docs);
  assert.doesNotMatch(html, /__[A-Z]+__/);
  const n = docs.reduce((s, d) => s + d.items.length, 0);
  const items = JSON.parse(/const ITEMS = (.*);\n/.exec(html)[1]);
  assert.equal(items.length, n);
  assert.doesNotMatch(/const ITEMS = (.*);\n/.exec(html)[1], /<\//);
  assert.match(html, /:root\[data-theme="light"\]/);
});
