import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { copier, verifier, versionDe } from '../outils/norma.mjs';

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outil = (deps = {}, code = 'modulus') => {
  const dir = mkdtempSync(path.join(tmpdir(), 'norma-'));
  writeFileSync(path.join(dir, 'norma.config.json'), JSON.stringify({ outil: code }));
  writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ dependencies: deps }));
  copier(racine, dir);
  return dir;
};

test('une copie fraîche et des dépendances de la suite passent', () => {
  assert.deepEqual(verifier(outil({ next: '16.4.6', react: '19.3.0', '@types/node': '22', zod: '^4.6.7' })), []);
});

test('une copie modifiée, ajoutée ou supprimée est refusée', () => {
  const dir = outil();
  appendFileSync(path.join(dir, 'norma/REGLES.md'), '\nrègle locale\n');
  writeFileSync(path.join(dir, 'norma/charte/local.css'), '');
  const p = verifier(dir);
  assert.ok(p.some((l) => l.startsWith('norma/REGLES.md : modifié')));
  assert.ok(p.some((l) => l.startsWith('norma/charte/local.css : fichier ajouté')));
});

test('dépendance interdite, sous le minimum ou non déclarée ; dérogation par outil', () => {
  const p = verifier(outil({ next: '16.4.2', '@electric-sql/pglite': '^0.5.8', 'left-pad': '1.0.0' }));
  assert.ok(p.some((l) => l.startsWith('next@16.4.2 : minimum 16.4.6')));
  assert.ok(p.some((l) => l.startsWith('@electric-sql/pglite : interdite')));
  assert.ok(p.some((l) => l.startsWith('left-pad : à déclarer')));
  assert.deepEqual(verifier(outil({ '@electric-sql/pglite': '^0.5.8' }, 'codex')), []);
});

test('outil absent du registre', () => {
  assert.ok(verifier(outil({}, 'inconnu')).some((l) => l.includes('absent du registre')));
});

test('versionDe lit les formes courantes', () => {
  assert.deepEqual(versionDe('^16.4.6'), [16, 4, 6]);
  assert.deepEqual(versionDe('~0.45.3'), [0, 45, 3]);
  assert.equal(versionDe('github:x/y'), null);
});

test('le registre et les dépendances sont du JSON valide, codes uniques', () => {
  const r = JSON.parse(readFileSync(path.join(racine, 'registre/outils.json'), 'utf8'));
  const codes = r.outils.map((o) => o.code);
  assert.equal(new Set(codes).size, codes.length);
  const ports = r.outils.flatMap((o) => Object.values(o.ports));
  assert.equal(new Set(ports).size, ports.length, 'un port n’appartient qu’à un outil');
  JSON.parse(readFileSync(path.join(racine, 'dependances.json'), 'utf8'));
});
