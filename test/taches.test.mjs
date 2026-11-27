import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DISTRIBUE } from '../outils/norma.mjs';
import { BASE_ENTRIES, MAX_TOOL_ENTRIES, TOOL_BASE, TOOL_NAMES, activeEntry, baseNav, baseNavProblems } from '../charte/ds/base-nav.ts';
import {
  KANBAN_COLUMNS, PUB_TACHES_COLUMNS, TASK_ACTIONS, TASK_STATES, baseCounts, byDay, canActHere, decisionsHere, dedupe, dueBucket,
  filterApprovals, groupTasks, isLate, kanban, monthWeeks, moveAction, rowProblems, shiftPeriod, shownTitle, sortTasks, typesOf,
  weekDays,
} from '../charte/ds/task-rules.ts';
import { TACHES_FR } from '../charte/ds/taches-fr.ts';

// Norma 2.4 — tronc commun des menus, « Mes tâches », « Mes approbations », contrat pub_taches v1.
const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lire = (f) => readFileSync(path.join(racine, f), 'utf8');
const { outils } = JSON.parse(lire('registre/outils.json'));

const TODAY = '2026-11-25'; // un mercredi
const row = (o = {}) => ({
  outil: 'arche', tache_id: 'step:1', nature: 'approbation', type: 'step', type_libelle: 'Étape de circuit', titre: 'G2 — visa',
  personne_id: 'p1', etat: 'a_faire', echeance: '2026-11-28', priorite: 'normale', actions: ['ouvrir', 'approuver', 'refuser'],
  decision_a_distance: true, sensible: false, lien: 'https://arche.example/capex/CPX-1', version: '3', maj_le: '2026-11-24T10:00:00Z',
  ...o,
});

test('tronc commun : Accueil, Mes tâches, Mes approbations d’abord, dans cet ordre, dans chaque outil du registre', () => {
  assert.deepEqual(BASE_ENTRIES.map((e) => e.fr), ['Accueil', 'Mes tâches', 'Mes approbations']);
  assert.deepEqual(BASE_ENTRIES.map((e) => e.icon), ['House', 'CheckSquare', 'Stamp']);
  for (const { code, nom } of outils) {
    const b = TOOL_BASE[code];
    assert.ok(b, `TOOL_BASE sans ${code}`);
    assert.equal(TOOL_NAMES[code], nom);
    assert.ok(b.home.length > 20, `${code} : accueil typé à décrire`);
    assert.ok(b.extras.length >= 1 && b.extras.length <= MAX_TOOL_ENTRIES, `${code} : une ou deux entrées métier`);
    const items = baseNav(code);
    assert.deepEqual(baseNavProblems(items), [], code);
    assert.deepEqual(items.slice(0, 3).map((i) => i.id), ['home', 'tasks', 'approvals']);
  }
  assert.equal(Object.keys(TOOL_BASE).length, outils.length);
});

test('tronc commun : chemins gardés par l’outil, pastilles, entrée active, contrôle du bloc', () => {
  const items = baseNav('vigie', { paths: { tasks: '/a-faire' }, counts: { tasks: 4, approvals: 0 }, hidden: ['actions'] });
  assert.equal(items[1].href, '/a-faire');
  assert.equal(items[1].badge, 4);
  assert.equal(items[2].badge, undefined, 'pas de pastille à zéro');
  assert.ok(!items.some((i) => i.id === 'actions'));
  assert.equal(activeEntry(items, '/'), 'home');
  assert.equal(activeEntry(items, '/a-faire/12'), 'tasks');
  assert.equal(activeEntry(items, '/evenements'), 'events');
  assert.equal(activeEntry(items, '/autre'), null);
  assert.ok(baseNavProblems([{ id: 'tasks', common: true }, { id: 'home', common: true }]).length >= 2);
  assert.ok(baseNavProblems([...baseNav('arche'), { id: 'x', common: false }]).some((p) => p.includes('au plus 2')));
  assert.throws(() => baseNav('inconnu'), /outil inconnu/);
});

test('contrat pub_taches v1 : colonnes de contrats/taches-v1.md, dans le même ordre que task-rules.ts', () => {
  const doc = lire('contrats/taches-v1.md');
  const section = doc.slice(doc.indexOf('## 2.'), doc.indexOf('## 3.'));
  const cols = [...section.matchAll(/^\| `([a-z_]+)` \|/gm)].map((m) => m[1]);
  assert.deepEqual(cols, [...PUB_TACHES_COLUMNS]);
  for (const s of TASK_STATES) assert.ok(section.includes(`\`${s}\``), `état ${s} non documenté`);
  for (const a of TASK_ACTIONS) assert.ok(section.includes(`\`${a}\``), `action ${a} non documentée`);
  for (const m of ['GET /api/v1/taches/{tache_id}', 'POST /api/v1/taches/{tache_id}/decision', 'matrix.pub_taches', 'matrix.pub_taches_sources', 'RFC 8693'])
    assert.ok(doc.includes(m), `contrat sans ${m}`);
  assert.match(lire('REGLES.md'), /contrats\/taches-v1\.md/);
  assert.ok(DISTRIBUE.includes('contrats'), 'les contrats sont distribués aux outils');
});

test('ligne de pub_taches : domaines, échéance, lien absolu, une tâche sensible jamais décidée à distance', () => {
  assert.deepEqual(rowProblems(row()), []);
  const p = rowProblems(row({ etat: 'ouverte', nature: 'echeance', lien: '/relatif', echeance: '28/11', sensible: true, resultat: 'approuvee' }));
  for (const m of ['etat hors domaine', 'nature hors domaine', 'lien : adresse absolue', 'echeance : AAAA-MM-JJ', 'sensible', 'resultat sans etat faite'])
    assert.ok(p.some((l) => l.includes(m)), m);
});

test('dédoublonnage par (outil, tache_id), la plus récente gardée ; compteurs des pastilles', () => {
  const a = row({ maj_le: '2026-11-24T10:00:00Z' });
  const b = row({ maj_le: '2026-11-25T10:00:00Z', titre: 'récente' });
  const c = row({ outil: 'codex', nature: 'tache', tache_id: 'rev:1' });
  const d = row({ tache_id: 'x', etat: 'faite', resultat: 'approuvee' });
  assert.deepEqual(dedupe([a, b, c]).map((r) => r.titre), ['récente', 'G2 — visa']);
  assert.deepEqual(baseCounts([a, b, c, d]), { tasks: 1, approvals: 1 });
});

test('échéances : retard, aujourd’hui, cette semaine (lundi–dimanche), plus tard, sans échéance, terminées', () => {
  const b = (echeance, etat = 'a_faire') => dueBucket({ echeance, etat }, TODAY);
  assert.equal(b('2026-11-24'), 'retard');
  assert.equal(b(TODAY), 'aujourdhui');
  assert.equal(b('2026-11-29'), 'semaine');
  assert.equal(b('2026-11-30'), 'plus_tard');
  assert.equal(b(null), 'sans_echeance');
  assert.equal(b('2026-11-01', 'faite'), 'terminee');
  assert.ok(isLate({ echeance: '2026-11-24', etat: 'en_cours' }, TODAY));
  assert.ok(!isLate({ echeance: '2026-11-24', etat: 'faite' }, TODAY));
});

test('liste : tri stable, sans échéance en dernier ; groupes dans l’ordre fixe', () => {
  const rs = [row({ tache_id: 'a', echeance: null }), row({ tache_id: 'b', echeance: '2026-12-10' }), row({ tache_id: 'c', echeance: '2026-11-20' })];
  assert.deepEqual(sortTasks(rs).map((r) => r.tache_id), ['c', 'b', 'a']);
  assert.deepEqual(sortTasks(rs, 'echeance', 'desc').map((r) => r.tache_id), ['b', 'c', 'a']);
  assert.deepEqual(groupTasks(rs, 'echeance', TODAY).map((g) => g.key), ['retard', 'plus_tard', 'sans_echeance']);
  assert.deepEqual(groupTasks([row({ etat: 'en_cours' }), row({ tache_id: 'z' })], 'etat', TODAY).map((g) => g.key), ['a_faire', 'en_cours']);
});

test('kanban : quatre colonnes, déplacement seulement par une action ouverte par l’outil propriétaire', () => {
  assert.deepEqual([...KANBAN_COLUMNS], ['a_faire', 'en_cours', 'en_attente', 'faite']);
  const cols = kanban([row({ etat: 'annulee' }), row({ tache_id: 'b', etat: 'en_cours' })]);
  assert.deepEqual(cols.map((c) => c.items.length), [0, 1, 0, 0], 'une tâche annulée n’est pas au tableau');
  const t = row({ nature: 'tache', actions: ['ouvrir', 'demarrer'] });
  assert.equal(moveAction(t, 'en_cours', { tool: 'arche' }), 'demarrer');
  assert.equal(moveAction(t, 'faite', { tool: 'arche' }), null, 'transition non ouverte');
  assert.equal(moveAction(t, 'en_cours', { tool: 'keystone' }), null, 'autre outil, phase 2 inactive');
  assert.equal(moveAction(t, 'en_cours', { tool: 'keystone', remote: true }), 'demarrer');
  assert.equal(moveAction({ ...t, decision_a_distance: false }, 'en_cours', { tool: 'keystone', remote: true }), null);
});

test('approbations : boutons seulement si la décision est possible ici ; filtres outil, type, échéance', () => {
  const r = row();
  assert.deepEqual(decisionsHere(r, { tool: 'arche' }), ['approuver', 'refuser']);
  assert.deepEqual(decisionsHere(r, { tool: 'codex' }), [], 'phase 1 : lien profond seulement');
  assert.deepEqual(decisionsHere(r, { tool: 'codex', remote: true }), ['approuver', 'refuser']);
  assert.deepEqual(decisionsHere({ ...r, decision_a_distance: false }, { tool: 'codex', remote: true }), []);
  assert.deepEqual(decisionsHere({ ...r, sensible: true, decision_a_distance: false }, { tool: 'arche' }), ['approuver', 'refuser'], 'l’outil propriétaire décide chez lui');
  assert.ok(!canActHere({ outil: 'cursus', sensible: true, decision_a_distance: true }, { tool: 'arche', remote: true }));
  assert.equal(shownTitle({ outil: 'cursus', sensible: true, titre: 'Absence de X', type_libelle: 'Demande d’absence' }, 'arche'), 'Demande d’absence');
  const rs = [
    r, row({ outil: 'codex', tache_id: 'c', type: 'circuit', type_libelle: 'Circuit', echeance: '2026-11-20' }),
    row({ tache_id: 'old', etat: 'faite', resultat: 'approuvee', maj_le: '2026-11-01T00:00:00Z' }),
    row({ tache_id: 'recent', etat: 'faite', resultat: 'refusee', maj_le: '2026-11-23T00:00:00Z' }),
    row({ tache_id: 't', nature: 'tache' }),
  ];
  assert.deepEqual(filterApprovals(rs, {}, TODAY).map((x) => x.tache_id), ['c', 'recent', 'step:1']);
  assert.deepEqual(filterApprovals(rs, { outil: 'codex' }, TODAY).map((x) => x.tache_id), ['c']);
  assert.deepEqual(filterApprovals(rs, { due: 'retard' }, TODAY).map((x) => x.tache_id), ['c']);
  assert.deepEqual(filterApprovals(rs, { type: 'arche:step' }, TODAY).map((x) => x.tache_id), ['recent', 'step:1']);
  assert.deepEqual(typesOf(rs).map((x) => x.value), ['codex:circuit', 'arche:step']);
});

test('calendrier : semaines complètes du lundi au dimanche, semaine, période suivante, tâches par jour', () => {
  const w = monthWeeks('2026-11-25');
  assert.equal(w[0][0], '2026-10-26');
  assert.equal(w.at(-1)[6], '2026-12-06');
  assert.ok(w.every((s) => s.length === 7));
  assert.deepEqual(weekDays(TODAY)[0], '2026-11-23');
  assert.equal(shiftPeriod('2026-01-31', 'mois', 1), '2026-02-01');
  assert.equal(shiftPeriod(TODAY, 'semaine', -1), '2026-11-16');
  const m = byDay([row(), row({ tache_id: 'n', echeance: null }), row({ tache_id: 'x', etat: 'annulee' })]);
  assert.deepEqual([...m.keys()], ['2026-11-28']);
  assert.equal(m.get('2026-11-28').length, 1);
});

test('chaque chaîne source des composants a son entrée française (taches-fr.ts), différente sauf noms propres', () => {
  const src = ['BaseNav.tsx', 'MyTasks.tsx', 'MyApprovals.tsx', 'TaskParts.tsx'].map((f) => lire(`charte/ds/${f}`)).join('\n');
  const sources = new Set([
    ...[...src.matchAll(/\bt\('([^']+)'\)/g)].map((m) => m[1]),
    ...[...src.matchAll(/\bt\([^)]*\?\s*'([^']+)'\s*:\s*'([^']+)'\)/g)].flatMap((m) => [m[1], m[2]]),
    ...[...src.matchAll(/label: '([^']+)'/g)].map((m) => m[1]),
    ...[...src.matchAll(/: Record<[A-Za-z]+, string> = \{([^}]+)\}/g)].flatMap((m) => [...m[1].matchAll(/: '([^']+)'/g)].map((x) => x[1])),
    ...BASE_ENTRIES.map((e) => e.label),
    ...Object.values(TOOL_BASE).flatMap((b) => b.extras.map((e) => e.label)),
  ]);
  for (const s of sources) assert.ok(s in TACHES_FR, `« ${s} » sans traduction française`);
  for (const e of [...BASE_ENTRIES, ...Object.values(TOOL_BASE).flatMap((b) => b.extras)]) assert.equal(TACHES_FR[e.label], e.fr, e.label);
});

test('COQUE.md documente le tronc commun et chaque outil ; index.ts exporte les composants', () => {
  const doc = lire('charte/COQUE.md');
  assert.match(doc, /## 2 bis\. Tronc commun des menus/);
  for (const { nom } of outils) assert.ok(doc.includes(`| ${nom} |`), `COQUE.md sans ligne ${nom}`);
  const index = lire('charte/ds/index.ts');
  for (const n of ['BaseNav', 'MyTasks', 'MyApprovals', 'TaskSource', 'baseNav', 'TACHES_FR']) assert.match(index, new RegExp(`\\b${n}\\b`));
});
