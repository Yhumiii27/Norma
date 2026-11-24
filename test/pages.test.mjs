import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Contrastes AA (4,5:1) de la palette des pages autonomes, dans les deux thèmes.
const css = readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../outils/pages/nocturne-page.css'), 'utf8');
const bloc = (re) => Object.fromEntries([...re.exec(css)[1].matchAll(/--([a-z-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2]]));
const themes = { sombre: bloc(/^:root \{([\s\S]*?)\}/m), clair: bloc(/:root\[data-theme="light"\] \{([\s\S]*?)\}/) };
const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const PAIRES = [['text', 'bg'], ['text', 'surface'], ['muted', 'bg'], ['muted', 'surface'], ['muted', 'raise'], ['accent', 'surface'],
  ['accent', 'bg'], ['accent', 'accent-soft'], ['accent-ink', 'accent'], ['ok', 'ok-soft'], ['warn', 'warn-soft'], ['bad', 'bad-soft'], ['warn', 'surface']];

for (const [nom, t] of Object.entries(themes)) {
  test(`palette des pages, thème ${nom} : contrastes AA`, () => {
    for (const [a, b] of PAIRES) {
      assert.ok(t[a] && t[b], `--${a} et --${b} définies`);
      assert.ok(ratio(t[a], t[b]) >= 4.5, `--${a} sur --${b} : ${ratio(t[a], t[b]).toFixed(2)}:1`);
    }
  });
}

test('le thème clair suit aussi la préférence du système', () => {
  assert.match(css, /@media \(prefers-color-scheme: light\) \{ :root:not\(\[data-theme="dark"\]\)/);
});
