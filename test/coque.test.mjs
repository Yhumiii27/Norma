import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DISTRIBUE } from '../outils/norma.mjs';
import { MAX_HEADER_BUTTONS, matchPages, splitActions } from '../charte/ds/coque-rules.ts';

// Norma 2.0 — coque commune : jetons, classes, composants, placement de la paire langue / affichage.
const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lire = (f) => readFileSync(path.join(racine, f), 'utf8');
const nocturne = lire('charte/nocturne.css');
const coque = lire('charte/coque.css');
const ds = path.join(racine, 'charte/ds');
const tsx = readdirSync(ds).filter((f) => f.endsWith('.tsx') || f.endsWith('.ts'));
const racineVars = new Set([...(/^:root \{([\s\S]*?)\n\}/m.exec(nocturne)[1].matchAll(/--([a-z0-9-]+):/g))].map((m) => m[1]));
const sansCommentaires = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const regle = (sel) => {
  const m = new RegExp(`(?:^|\\n)${sel.replace(/[.[\]()]/g, '\\$&')} \\{([^}]*)\\}`).exec(sansCommentaires(coque));
  assert.ok(m, `règle ${sel} absente de coque.css`);
  return m[1];
};

const JETONS = ['text-micro', 'text-eyebrow', 'text-caption', 'text-small', 'text-control', 'text-ui', 'text-dialog', 'text-brand',
  'text-kpi', 'text-kpi-lg', 'text-title', 'text-title-compact', 'weight-strong', 'tracking-caps', 'shell-sidebar-w', 'shell-drawer-w',
  'shell-main-pad', 'shell-main-pad-compact', 'shell-gap', 'shell-gap-compact', 'control-h', 'touch-target', 'pref-opt-w', 'pref-h',
  'pref-gap', 'panel-w', 'panel-w-wide'];

test('nocturne.css porte les jetons de la coque (échelle des textes, mesures)', () => {
  for (const j of JETONS) assert.ok(racineVars.has(j), `--${j} absent de :root`);
  assert.match(nocturne, /--text-title: 26px;/);
  assert.match(nocturne, /--shell-sidebar-w: 232px;/);
});

test('coque.css ne prend que des variables définies, jamais une couleur en dur', () => {
  const css = sansCommentaires(coque);
  const locales = new Set(['kpi-min']);
  for (const [, v] of css.matchAll(/var\(--([a-z0-9-]+)/g)) assert.ok(racineVars.has(v) || locales.has(v), `--${v} inconnue`);
  assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b/i, 'couleur hexadécimale en dur');
  assert.doesNotMatch(css, /\brgba?\(|\bhsla?\(/i, 'couleur rgb / hsl en dur');
});

test('chaque classe coque-… posée par un composant existe dans coque.css', () => {
  const definies = new Set([...sansCommentaires(coque).matchAll(/\.(coque-[a-z0-9-]+)/g)].map((m) => m[1]));
  for (const f of tsx) {
    const src = readFileSync(path.join(ds, f), 'utf8');
    for (const [, c] of src.matchAll(/['" ](coque-[a-z0-9-]+)['" ]/g)) {
      if (c === 'coque-sidebar' || c === 'coque-nav-toggle') continue; // identifiants d'éléments, pas des classes
      assert.ok(definies.has(c), `${f} : classe ${c} absente de coque.css`);
    }
  }
});

test('index.ts exporte la coque commune, chaque fichier existe', () => {
  const index = readFileSync(path.join(ds, 'index.ts'), 'utf8');
  for (const nom of ['AppShell', 'MobileTopBar', 'Sidebar', 'PageSearch', 'NavEntry', 'NavSection', 'PageHeader', 'HeaderActions',
    'HeaderTools', 'PrefsStack', 'LangSwitch', 'ThemeSwitch', 'StatusDate', 'FilterBar', 'FilterChips', 'KpiGrid', 'KpiTile', 'EmptyState', 'SidePanel'])
    assert.match(index, new RegExp(`\\b${nom}\\b`), `${nom} non exporté`);
  for (const [, f] of index.matchAll(/from '\.\/([A-Za-z-]+)'/g))
    assert.ok(existsSync(path.join(ds, `${f}.tsx`)) || existsSync(path.join(ds, `${f}.ts`)), `${f} absent`);
});

test('langue et affichage : deux sélecteurs empilés, de même taille, langue au-dessus', () => {
  assert.match(regle('.coque-prefs'), /flex-direction: column;/);
  assert.match(regle('.coque-prefs'), /align-items: stretch;/);
  assert.match(regle('.coque-pref'), /height: var\(--pref-h\);/);
  const opt = regle('.coque-pref-opt');
  assert.match(opt, /width: var\(--pref-opt-w\);/);
  assert.match(opt, /flex: none;/);
  const src = readFileSync(path.join(ds, 'HeaderTools.tsx'), 'utf8');
  const stack = /export function PrefsStack[\s\S]*?\n}\n/.exec(src)[0];
  assert.ok(stack.indexOf('<LangSwitch') < stack.indexOf('<ThemeSwitch'), 'la langue doit être au-dessus de l’affichage');
  // Deux options chacun (FR | EN, sombre | clair) : même largeur totale.
  assert.equal([.../export function LangSwitch[\s\S]*?\n}\n/.exec(src)[0].matchAll(/\{ value: '/g)].length, 2);
  assert.equal([.../export function ThemeSwitch[\s\S]*?\n}\n/.exec(src)[0].matchAll(/\{ value: '/g)].length, 2);
  // Toujours le dernier élément : de l'en-tête de page et de la barre supérieure.
  const tools = /export function HeaderTools[\s\S]*?\n}\n/.exec(src)[0];
  assert.match(tools, /\{prefs\}\s*<\/>/);
  const top = readFileSync(path.join(ds, 'AppShell.tsx'), 'utf8');
  assert.match(top, /\{tools\}\s*\{prefs\}\s*<\/div>/);
  // ≤ 1024 px : la paire quitte l'en-tête de page pour la barre supérieure.
  assert.match(coque, /@media \(max-width: 1024px\) \{[\s\S]*?\.coque-header \.coque-prefs \{ display: none; \}/);
});

test('en-tête de page : ordre fixe titre · recherche · actions · outils · langue / affichage', () => {
  const all = readFileSync(path.join(ds, 'PageHeader.tsx'), 'utf8');
  const src = all.slice(all.indexOf('<header className="coque-header">'));
  const ordre = ['coque-header-left', 'coque-header-search', '<HeaderActions', '<HeaderTools'].map((m) => src.indexOf(m));
  assert.ok(ordre.every((i) => i >= 0));
  assert.deepEqual([...ordre].sort((a, b) => a - b), ordre);
});

test('actions : trois boutons au plus, l’action principale toujours bouton et la plus à droite', () => {
  assert.equal(MAX_HEADER_BUTTONS, 3);
  assert.deepEqual(splitActions(['a', 'b'], 'P'), { menu: [], buttons: ['a', 'b', 'P'] });
  assert.deepEqual(splitActions(['a', 'b', 'c'], 'P'), { menu: ['a', 'b', 'c'], buttons: ['P'] });
  assert.deepEqual(splitActions(['a', 'b', 'c', 'd'], null), { menu: ['a', 'b', 'c'], buttons: ['d'] });
  assert.deepEqual(splitActions([], null), { menu: [], buttons: [] });
});

test('recherche de pages ⌘K : tous les mots, sans accents ni casse', () => {
  const pages = [{ label: 'Échéances', section: 'Pilotage' }, { label: 'Budget', section: 'CAPEX' }, { label: 'Tableau de bord' }];
  assert.deepEqual(matchPages(pages, 'echeance').map((p) => p.label), ['Échéances']);
  assert.deepEqual(matchPages(pages, 'capex bud').map((p) => p.label), ['Budget']);
  assert.deepEqual(matchPages(pages, '  '), []);
});

test('la coque est distribuée aux outils et documentée', () => {
  assert.ok(DISTRIBUE.includes('charte'));
  const doc = lire('charte/COQUE.md');
  for (const nom of ['AppShell', 'Sidebar', 'PageHeader', 'HeaderTools', 'PrefsStack', 'FilterBar', 'SidePanel', 'coque.css'])
    assert.ok(doc.includes(nom), `COQUE.md ne cite pas ${nom}`);
  assert.match(lire('REGLES.md'), /COQUE\.md/);
  assert.ok(existsSync(path.join(racine, 'charte/AUDIT-2026-11-24.md')));
});

// Norma 2.2 — retours des outils pendant l'alignement.
const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const palette = (bloc) => Object.fromEntries([...bloc.matchAll(/--(color-[a-z0-9-]+):\s*(#[0-9a-f]{6})\b/gi)].map((m) => [m[1], m[2]]));
const sombre = palette(/^:root \{([\s\S]*?)\n\}/m.exec(nocturne)[1]);
const clair = { ...sombre, ...palette(/:root\[data-theme="light"\] \{([\s\S]*?)\n\}/.exec(nocturne)[1]) };

test('en-tête passé à la ligne : seconde ligne à droite, bloc du titre à gauche', () => {
  const h = regle('.coque-header');
  assert.match(h, /flex-wrap: wrap;/);
  assert.match(h, /justify-content: flex-end;/);
  assert.match(regle('.coque-header-left'), /margin-right: auto;/);
});

test('indication ⌘K : contraste AA (4,5:1) sur la surface et le fond, affichages sombre et clair', () => {
  const kbd = regle('.coque-kbd');
  const [, jeton] = /\bcolor: var\(--(color-[a-z0-9-]+)\)/.exec(kbd);
  for (const [nom, t] of Object.entries({ sombre, clair })) {
    for (const fond of ['color-surface', 'color-bg']) {
      assert.ok(t[jeton] && t[fond], `--${jeton} et --${fond} définies (${nom})`);
      const r = ratio(t[jeton], t[fond]);
      assert.ok(r >= 4.5, `⌘K --${jeton} sur --${fond} (${nom}) : ${r.toFixed(2)}:1`);
    }
  }
});

test('≤ 1024 px : une seule cloche visible quand la barre supérieure la porte', () => {
  assert.match(coque, /@media \(max-width: 1024px\) \{[\s\S]*?\.coque:has\(\.coque-topbar \.coque-bell\) \.coque-header \.coque-bell \{ display: none; \}/);
  const doc = lire('charte/COQUE.md');
  assert.match(doc, /Une seule cloche visible/);
  assert.match(doc, /justify-content: flex-end/);
});
