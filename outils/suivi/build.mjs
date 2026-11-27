#!/usr/bin/env node
// Norma — suivi de la suite Atrium : une seule page pour le reste à faire et les décisions du responsable produit.
// Contrôle reste-a-faire/<outil>.json (outils/reste-a-faire/build.mjs) et decisions/<outil>.json (schéma decisions/SCHEMA.md),
// puis écrit RESTE-A-FAIRE.md et .artifacts/suivi.html (page autonome, publiée à l'adresse d'artefact de la suite, avec les
// capacités db et user : les réponses vont dans la collection `answers`, un document par question).
// Sans dépendance (Node 22+).
//   npm run suivi [-- --sortie <page.html>]
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ETATS, PRIORITES, STATUTS, charger, comptes, markdown } from '../reste-a-faire/build.mjs';

const ici = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ici, '..', '..');
const TEMPLATE = path.join(ici, 'page.template.html');
const PALETTE = path.join(ici, '..', 'pages', 'nocturne-page.css');

/** Outils pas encore au registre, qui ont déjà des questions (cadrage). Vide depuis 3.1.0 : Ingenium est au registre. */
export const OUTILS_A_VENIR = {};
export const STATUTS_DECISION = { ouverte: 'à décider', repondue: 'répondue', decidee: 'décidée' };
export const NATURES = ['question', 'donnee'];
const DATE = /^\d{4}-\d{2}-\d{2}$/;
/** Un identifiant de question est aussi l'identifiant d'un document de la base de l'artefact. */
export const ID = /^[a-z]+:[A-Za-z0-9_.~@+-]{1,120}$/;
const texte = (v) => typeof v === 'string' && v.trim() !== '';
const chaines = (v) => Array.isArray(v) && v.every((x) => typeof x === 'string');

/** Choix permis pour une question (`default`, `alt1`…`altN`, `other`, `discuss`), `donnee` pour une donnée. */
export function choixPermis(q) {
  if (q?.nature === 'donnee') return ['donnee'];
  return ['default', ...(q?.alternatives ?? []).map((_, i) => `alt${i + 1}`), 'other', 'discuss'];
}

/** Problèmes d'un fichier decisions/<outil>.json (vide = valide). `codes` : codes permis ; `vus` : ids déjà lus. */
export function validerDecisions(doc, { fichier = '?', codes, vus = new Set() } = {}) {
  const p = [];
  const ou = (s) => p.push(`${fichier} : ${s}`);
  if (!doc || typeof doc !== 'object') return [`${fichier} : objet attendu.`];
  if (!texte(doc.outil)) ou('« outil » obligatoire.');
  else if (codes && !codes.includes(doc.outil)) ou(`outil « ${doc.outil} » inconnu (registre, norma ou outil à venir).`);
  if (fichier !== '?' && texte(doc.outil) && path.basename(fichier, '.json') !== doc.outil) ou(`le fichier doit s’appeler ${doc.outil}.json.`);
  if (!DATE.test(doc.updated ?? '')) ou('« updated » : date AAAA-MM-JJ attendue.');
  const g = doc.groupes;
  if (!g || typeof g !== 'object' || Array.isArray(g) || !Object.values(g).every(texte)) ou('« groupes » : objet { code: libellé } attendu.');
  if (!chaines(doc.decide)) ou('« decide » : liste de textes attendue (vide permise).');
  if (doc.nom !== undefined && !texte(doc.nom)) ou('« nom » : texte non vide.');
  if (!Array.isArray(doc.questions)) return [...p, `${fichier} : « questions » : liste attendue.`];
  doc.questions.forEach((q, i) => {
    const id = texte(q?.id) ? q.id : `n° ${i + 1}`;
    const e = (s) => ou(`${id} : ${s}`);
    if (!texte(q?.id) || !ID.test(q.id)) e('« id » : <outil>:<réf> (lettres, chiffres, _ . ~ @ + -).');
    else if (vus.has(q.id)) e('id en double dans la suite.');
    else vus.add(q.id);
    if (q?.outil !== doc.outil) e(`« outil » doit valoir « ${doc.outil} ».`);
    if (texte(q?.id) && q.id !== `${q.outil}:${q.ref}`) e('« id » doit valoir <outil>:<ref>.');
    if (g && !(q?.groupe in g)) e(`groupe « ${q?.groupe} » absent de « groupes ».`);
    if (!NATURES.includes(q?.nature)) e('« nature » : question ou donnee.');
    for (const k of ['titre', 'contexte']) if (!texte(q?.[k])) e(`« ${k} » obligatoire.`);
    if (q?.nature === 'question') {
      if (!texte(q.proposition)) e('« proposition » obligatoire (réponse par défaut).');
      if (!chaines(q.alternatives)) e('« alternatives » : liste de textes (vide permise).');
    }
    if (typeof q?.bloque !== 'string') e('« bloque » : texte (vide permis).');
    if (!(q?.statut in STATUTS_DECISION)) e(`statut « ${q?.statut} » : ouverte, repondue ou decidee.`);
    else if (q.statut === 'ouverte') { if (q.reponse !== null) e('une question ouverte a « reponse » à null.'); }
    else {
      const r = q.reponse;
      if (!r || typeof r !== 'object') e('« reponse » obligatoire pour une question répondue ou décidée.');
      else {
        if (!choixPermis(q).includes(r.choix)) e(`choix « ${r.choix} » : ${choixPermis(q).join(', ')}.`);
        if (typeof r.note !== 'string') e('« reponse.note » : texte (vide permis).');
        if (q.nature === 'donnee' && !texte(r.note)) e('une donnée répondue porte la donnée dans « reponse.note ».');
        if (!DATE.test(r.date ?? '')) e('« reponse.date » : AAAA-MM-JJ.');
        if (!texte(r.source)) e('« reponse.source » obligatoire.');
      }
    }
  });
  return p;
}

/** Lit decisions/*.json de `racine` : un fichier par outil du registre, Norma et les outils à venir. Lève au moindre écart. */
export function chargerDecisions(racine = RACINE) {
  const registre = JSON.parse(readFileSync(path.join(racine, 'registre', 'outils.json'), 'utf8')).outils;
  const codes = [...registre.map((o) => o.code), 'norma', ...Object.keys(OUTILS_A_VENIR)];
  const dir = path.join(racine, 'decisions');
  const fichiers = readdirSync(dir).filter((f) => f.endsWith('.json'));
  const problemes = [];
  const docs = [];
  const vus = new Set();
  for (const f of fichiers) {
    let doc;
    try { doc = JSON.parse(readFileSync(path.join(dir, f), 'utf8')); } catch (e) { problemes.push(`${f} : JSON invalide (${e.message}).`); continue; }
    problemes.push(...validerDecisions(doc, { fichier: f, codes, vus }));
    docs.push(doc);
  }
  for (const c of codes) if (!fichiers.includes(`${c}.json`)) problemes.push(`decisions/${c}.json absent.`);
  if (problemes.length) throw new Error(problemes.join('\n'));
  const nom = (c) => registre.find((o) => o.code === c)?.nom ?? OUTILS_A_VENIR[c] ?? 'Suite et socle (Norma)';
  docs.sort((a, b) => codes.indexOf(a.outil) - codes.indexOf(b.outil));
  return docs.map((d) => ({ ...d, nom: d.nom ?? nom(d.outil) }));
}

export function comptesDecisions(questions) {
  const c = { total: questions.length, ouverte: 0, repondue: 0, decidee: 0 };
  for (const q of questions) c[q.statut]++;
  return c;
}

const frDate = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

/** La page « Suivi Atrium » (HTML autonome). */
export function page(raf, decisions) {
  const safe = (v) => JSON.stringify(v).replace(/</g, '\\u003c');
  const codes = [...new Set([...decisions.map((d) => d.outil), ...raf.map((d) => d.outil)])];
  const nomDe = Object.fromEntries([...raf, ...decisions].map((d) => [d.outil, d.nom]));
  const outils = codes.map((c) => {
    const r = raf.find((d) => d.outil === c);
    const dd = decisions.find((d) => d.outil === c);
    return { code: c, nom: nomDe[c], updated: r?.updated ?? dd?.updated ?? '', categories: r?.categories ?? {}, echelle: r?.echelle_effort ?? '', origine: r?.origine ?? {},
      groupes: dd?.groupes ?? {}, decide: dd?.decide ?? [], dorigine: dd?.origine ?? null };
  });
  const items = raf.flatMap((d) => d.items.map((x) => ({
    o: d.outil, id: x.id, t: x.title, d: x.description, c: x.category, p: x.priority, s: x.status, e: x.effort, w: x.waiting_on,
    g: x.progress.state, l: x.progress.delivery ?? '', n: x.progress.note, src: x.sources, a: x.aliases ?? [],
  })));
  const questions = decisions.flatMap((d) => d.questions.map((q) => ({
    id: q.id, ref: q.ref, o: q.outil, gr: q.groupe, k: q.nature, t: q.titre, c: q.contexte, p: q.proposition ?? '', alts: q.alternatives ?? [],
    h: q.aide ?? '', b: q.bloque, st: q.statut, r: q.reponse,
  })));
  const hist = raf.flatMap((d) => d.history.map((h) => ({ date: h.date, text: h.text, nom: d.nom }))).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 40);
  const maj = [...raf.map((d) => d.updated), ...decisions.map((d) => d.updated)].sort().at(-1);
  const valeurs = {
    __NOCTURNE__: readFileSync(PALETTE, 'utf8'),
    __OUTILS__: safe(outils), __ITEMS__: safe(items), __QUESTIONS__: safe(questions), __HISTORIQUE__: safe(hist),
    __LIBELLES__: safe({ priorites: PRIORITES, statuts: STATUTS, etats: ETATS, decisions: STATUTS_DECISION }),
    __UPDATED__: frDate(maj),
  };
  return readFileSync(TEMPLATE, 'utf8').replace(/__[A-Z]+__/g, (k) => (k in valeurs ? valeurs[k] : k));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const i = args.indexOf('--sortie');
  try {
    const raf = charger();
    const decisions = chargerDecisions();
    writeFileSync(path.join(RACINE, 'RESTE-A-FAIRE.md'), markdown(raf));
    const cible = path.resolve(i >= 0 ? args[i + 1] : path.join(RACINE, '.artifacts', 'suivi.html'));
    mkdirSync(path.dirname(cible), { recursive: true });
    writeFileSync(cible, page(raf, decisions));
    const t = comptes(raf.flatMap((d) => d.items));
    const q = comptesDecisions(decisions.flatMap((d) => d.questions));
    console.log(`${raf.length} listes, ${t.total} points (${t.fait} faits, ${t.en_cours} en cours, ${t.a_faire} à faire) ; ${q.total} questions (${q.ouverte} à décider, ${q.repondue} répondues, ${q.decidee} décidées) → RESTE-A-FAIRE.md, ${path.relative(RACINE, cible)}`);
  } catch (e) {
    for (const l of String(e.message).split('\n')) console.error(`✗ ${l}`);
    process.exit(1);
  }
}
