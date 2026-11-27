import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_THEME, LEGACY_THEME_COOKIE, THEME_COOKIE, THEME_COOKIES_READ, themeCookie, themeFromCookieHeader, themeFromCookies, themeOf } from '../charte/ds/theme.ts';

// Norma 3.0 — cookie d'affichage de la suite Atrium : `atrium-theme` écrit, ancien nom lu à défaut pendant la transition.
const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ancien = ['e', 'pc2i-theme'].join('');

test('le cookie écrit porte le nouveau nom, jamais l’ancien', () => {
  assert.equal(THEME_COOKIE, 'atrium-theme');
  assert.equal(themeCookie('light'), 'atrium-theme=light; path=/; max-age=31536000; samesite=lax');
  assert.ok(!themeCookie('dark').includes(ancien));
});

test('l’ancien nom reste lu, après le nouveau', () => {
  assert.equal(LEGACY_THEME_COOKIE, ancien);
  assert.deepEqual(THEME_COOKIES_READ, ['atrium-theme', ancien]);
  const jar = (o) => (n) => o[n];
  assert.equal(themeFromCookies(jar({ [ancien]: 'light' })), 'light', 'réglage d’avant le renommage gardé');
  assert.equal(themeFromCookies(jar({ 'atrium-theme': 'dark', [ancien]: 'light' })), 'dark', 'le nouveau l’emporte');
  assert.equal(themeFromCookies(jar({ 'atrium-theme': 'light' })), 'light');
  assert.equal(themeFromCookies(jar({ 'atrium-theme': 'bleu', [ancien]: 'light' })), 'light', 'valeur inconnue : on passe au suivant');
  assert.equal(themeFromCookies(jar({})), DEFAULT_THEME);
  assert.equal(themeOf('light'), 'light');
  assert.equal(themeOf('x'), 'dark');
});

test('lecture depuis un en-tête Cookie brut', () => {
  assert.equal(themeFromCookieHeader(`a=1; ${ancien}=light`), 'light');
  assert.equal(themeFromCookieHeader(`${ancien}=light; atrium-theme=dark`), 'dark');
  assert.equal(themeFromCookieHeader(undefined), 'dark');
});

test('les composants écrivent le cookie par themeCookie et diffusent l’événement de la suite', () => {
  const tools = readFileSync(path.join(racine, 'charte/ds/HeaderTools.tsx'), 'utf8');
  assert.match(tools, /THEME_EVENT = 'atrium-theme'/);
  assert.match(tools, /document\.cookie = themeCookie\(v\)/);
  assert.doesNotMatch(tools, /document\.cookie = `/, 'aucun cookie écrit à la main');
});
