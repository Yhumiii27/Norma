#!/usr/bin/env node
// Norma — reste à faire de la solution : contrôle reste-a-faire/<outil>.json (schéma reste-a-faire/SCHEMA.md) et produit
// RESTE-A-FAIRE.md (racine de Norma) et .artifacts/reste-a-faire.html (page autonome, à republier comme artefact).
// Sans dépendance (Node 22+).
//   npm run reste-a-faire [-- --sortie <page.html>]
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ici, '..', '..');
const TEMPLATE = path.join(ici, 'page.template.html');
const PALETTE = path.join(ici, '..', 'pages', 'nocturne-page.css');

export const PRIORITES = { bloquant_production: 'Bloquant production', prochaine_etape: 'Prochaine étape', a_decider: 'À décider', plus_tard: 'Plus tard' };
export const STATUTS = { non_commence: 'non commencé', partiel: 'partiel', bloque_attente_proprietaire: 'attend le responsable produit', bloque_systeme_externe: 'attend un système externe' };
export const ETATS = { a_faire: 'à faire', en_cours: 'en cours', fait: 'fait' };
export const EFFORTS = ['S', 'M', 'L', 'XL'];
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const texte = (v) => typeof v === 'string' && v.trim() !== '';
const chaines = (v) => Array.isArray(v) && v.every((x) => typeof x === 'string');

/** Problems of one tool's file (empty = valid). `codes`: the codes allowed for `outil` (registry + "norma"). */
export function valider(doc, { fichier = '?', codes } = {}) {
  const p = [];
  const ou = (s) => p.push(`${fichier} : ${s}`);
  if (!doc || typeof doc !== 'object') return [`${fichier} : objet attendu.`];
  if (!texte(doc.outil)) ou('« outil » obligatoire.');
  else if (codes && !codes.includes(doc.outil)) ou(`outil « ${doc.outil} » absent du registre.`);
  if (fichier !== '?' && texte(doc.outil) && path.basename(fichier, '.json') !== doc.outil) ou(`le fichier doit s’appeler ${doc.outil}.json.`);
  for (const k of ['generated', 'updated']) if (!DATE.test(doc[k] ?? '')) ou(`« ${k} » : date AAAA-MM-JJ attendue.`);
  const cats = doc.categories;
  if (!cats || typeof cats !== 'object' || Array.isArray(cats) || !Object.values(cats).every(texte)) ou('« categories » : objet { code: libellé } attendu.');
  if (!Array.isArray(doc.history) || !doc.history.every((h) => DATE.test(h?.date ?? '') && texte(h?.text))) ou('« history » : liste de { date, text } attendue.');
  if (!Array.isArray(doc.items)) return [...p, `${fichier} : « items » : liste attendue.`];
  const ids = new Set();
  doc.items.forEach((x, i) => {
    const id = texte(x?.id) ? x.id : `n° ${i + 1}`;
    const e = (s) => ou(`${id} : ${s}`);
    if (!texte(x?.id)) e('« id » obligatoire.');
    else if (ids.has(x.id)) e('id en double.');
    else ids.add(x.id);
    for (const k of ['title', 'description', 'kind']) if (!texte(x?.[k])) e(`« ${k} » obligatoire.`);
    if (cats && !(x?.category in cats)) e(`catégorie « ${x?.category} » absente de « categories ».`);
    if (!(x?.priority in PRIORITES)) e(`priorité « ${x?.priority} » inconnue.`);
    if (!(x?.status in STATUTS)) e(`statut « ${x?.status} » inconnu.`);
    if (typeof x?.waiting_on !== 'string') e('« waiting_on » : texte attendu (vide permis).');
    if (!(x?.effort === null || EFFORTS.includes(x?.effort))) e(`effort « ${x?.effort} » : S, M, L, XL ou null.`);
    if (!chaines(x?.sources) || !x.sources.length) e('« sources » : liste non vide de textes.');
    if (!chaines(x?.evidence)) e('« evidence » : liste de textes (vide permise).');
    const pg = x?.progress;
    if (!pg || !(pg.state in ETATS)) e('« progress.state » : a_faire, en_cours ou fait.');
    else {
      if (!(pg.delivery === null || typeof pg.delivery === 'string')) e('« progress.delivery » : texte ou null.');
      if (typeof pg.note !== 'string') e('« progress.note » : texte attendu (vide permis).');
    }
    if (x?.aliases !== undefined && !chaines(x.aliases)) e('« aliases » : liste de textes.');
    if (x?.details !== undefined && (typeof x.details !== 'object' || x.details === null || Array.isArray(x.details))) e('« details » : objet.');
  });
  return p;
}

/** Reads every reste-a-faire/*.json of `racine`, in the registry's order then Norma. Throws on any problem. */
export function charger(racine = RACINE) {
  const registre = JSON.parse(readFileSync(path.join(racine, 'registre', 'outils.json'), 'utf8')).outils;
  const codes = [...registre.map((o) => o.code), 'norma'];
  const dir = path.join(racine, 'reste-a-faire');
  const fichiers = readdirSync(dir).filter((f) => f.endsWith('.json'));
  const problemes = [];
  const docs = [];
  for (const f of fichiers) {
    let doc;
    try { doc = JSON.parse(readFileSync(path.join(dir, f), 'utf8')); } catch (e) { problemes.push(`${f} : JSON invalide (${e.message}).`); continue; }
    problemes.push(...valider(doc, { fichier: f, codes }));
    docs.push(doc);
  }
  for (const c of codes) if (!fichiers.includes(`${c}.json`)) problemes.push(`reste-a-faire/${c}.json absent.`);
  if (problemes.length) throw new Error(problemes.join('\n'));
  const nom = (c) => registre.find((o) => o.code === c)?.nom ?? 'Norma (socle)';
  docs.sort((a, b) => codes.indexOf(a.outil) - codes.indexOf(b.outil));
  return docs.map((d) => ({ ...d, nom: nom(d.outil) }));
}

export function comptes(items) {
  const c = { total: items.length, fait: 0, en_cours: 0, a_faire: 0 };
  for (const x of items) c[x.progress.state]++;
  return c;
}

const PORD = Object.keys(PRIORITES);
const md = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
const frDate = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

export function markdown(docs) {
  const L = [];
  const w = (s = '') => L.push(s);
  const tous = docs.flatMap((d) => d.items);
  const t = comptes(tous);
  const maj = docs.map((d) => d.updated).sort().at(-1);
  w('# Reste à faire de la solution EPC2I');
  w();
  w(`Liste commune à tous les outils, tenue dans Norma (\`reste-a-faire/<outil>.json\`, schéma \`reste-a-faire/SCHEMA.md\`), mise à jour le ${frDate(maj)}. Produite par \`npm run reste-a-faire\` avec la page \`.artifacts/reste-a-faire.html\` ; ne pas la modifier à la main.`);
  w();
  w(`**Avancement** : ${t.fait} faits, ${t.en_cours} en cours, ${t.a_faire} à faire, sur ${t.total} points.`);
  w();
  w('## Sommaire');
  w();
  w('| Outil | Fait | En cours | À faire | Total | Bloquant production (restants) | À décider (restants) | Mis à jour |');
  w('|---|---:|---:|---:|---:|---:|---:|---|');
  for (const d of docs) {
    const c = comptes(d.items);
    const ouverts = d.items.filter((x) => x.progress.state !== 'fait');
    w(`| [${d.nom}](#${d.outil}) | ${c.fait} | ${c.en_cours} | ${c.a_faire} | ${c.total} | ${ouverts.filter((x) => x.priority === 'bloquant_production').length} | ${ouverts.filter((x) => x.priority === 'a_decider').length} | ${d.updated} |`);
  }
  w(`| **Total** | **${t.fait}** | **${t.en_cours}** | **${t.a_faire}** | **${t.total}** | | | |`);
  w();
  w('Priorité, statut et effort suivent le schéma commun ; l’échelle d’effort et la règle de reprise de chaque outil sont rappelées dans sa section. Les points faits sont listés sans leur description.');
  for (const d of docs) {
    const c = comptes(d.items);
    w();
    w(`<a id="${d.outil}"></a>`);
    w();
    w(`## ${d.nom}`);
    w();
    const o = d.origine ?? {};
    w(`${c.fait} faits, ${c.en_cours} en cours, ${c.a_faire} à faire. Source : ${o.depot ?? '—'}${o.fichier ? `, \`${o.fichier}\`` : ''}${o.commit ? ` (commit \`${o.commit}\`)` : ''}${o.reprise ? ` ; reprise : ${o.reprise}` : ''}. Effort : ${d.echelle_effort ?? '—'}.`);
    for (const [cat, lib] of Object.entries(d.categories)) {
      const xs = d.items.filter((x) => x.category === cat);
      if (!xs.length) continue;
      const ouverts = xs.filter((x) => x.progress.state !== 'fait').sort((a, b) => PORD.indexOf(a.priority) - PORD.indexOf(b.priority) || a.id.localeCompare(b.id));
      const faits = xs.filter((x) => x.progress.state === 'fait');
      w();
      w(`### ${lib} (${ouverts.length} restants${faits.length ? `, ${faits.length} faits` : ''})`);
      w();
      for (const x of ouverts) {
        const etat = x.progress.state === 'en_cours' ? ` · **en cours${x.progress.delivery ? ` (${x.progress.delivery})` : ''}**` : '';
        w(`- **${x.id} · ${md(x.title)}** — *${PRIORITES[x.priority]} · ${STATUTS[x.status]}${x.effort ? ` · effort ${x.effort}` : ''}*${etat}  `);
        w(`  ${md(x.description)}`);
        const extra = [];
        if (x.progress.note) extra.push(`Avancement : ${md(x.progress.note)}`);
        if (x.waiting_on) extra.push(`Attend : ${md(x.waiting_on)}`);
        extra.push(`Sources : ${md(x.sources.join(', '))}`);
        w(`  *${extra.join(' · ').replace(/\*/g, '\\*')}*`);
      }
      if (faits.length) {
        if (ouverts.length) w();
        w(`Faits : ${faits.map((x) => `${x.id} ${md(x.title)}`).join(' ; ')}.`);
      }
    }
  }
  w();
  w('## Mises à jour');
  w();
  const hist = docs.flatMap((d) => d.history.map((h) => ({ ...h, nom: d.nom }))).sort((a, b) => b.date.localeCompare(a.date));
  for (const h of hist.slice(0, 60)) w(`- ${h.date} — **${h.nom}** : ${md(h.text)}`);
  return L.join('\n').trimEnd() + '\n';
}

export function page(docs) {
  const safe = (v) => JSON.stringify(v).replace(/</g, '\\u003c');
  const outils = docs.map((d) => ({ code: d.outil, nom: d.nom, updated: d.updated, categories: d.categories, echelle: d.echelle_effort ?? '', origine: d.origine ?? {} }));
  const items = docs.flatMap((d) => d.items.map((x) => ({
    o: d.outil, id: x.id, t: x.title, d: x.description, c: x.category, p: x.priority, s: x.status, e: x.effort, w: x.waiting_on,
    g: x.progress.state, l: x.progress.delivery ?? '', n: x.progress.note, src: x.sources, a: x.aliases ?? [],
  })));
  const hist = docs.flatMap((d) => d.history.map((h) => ({ date: h.date, text: h.text, nom: d.nom }))).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 40);
  const maj = docs.map((d) => d.updated).sort().at(-1);
  const valeurs = {
    __NOCTURNE__: readFileSync(PALETTE, 'utf8'),
    __OUTILS__: safe(outils), __ITEMS__: safe(items), __HISTORIQUE__: safe(hist),
    __LIBELLES__: safe({ priorites: PRIORITES, statuts: STATUTS, etats: ETATS }),
    __UPDATED__: frDate(maj),
  };
  return readFileSync(TEMPLATE, 'utf8').replace(/__[A-Z]+__/g, (k) => (k in valeurs ? valeurs[k] : k));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const i = args.indexOf('--sortie');
  try {
    const docs = charger();
    writeFileSync(path.join(RACINE, 'RESTE-A-FAIRE.md'), markdown(docs));
    const cible = path.resolve(i >= 0 ? args[i + 1] : path.join(RACINE, '.artifacts', 'reste-a-faire.html'));
    mkdirSync(path.dirname(cible), { recursive: true });
    writeFileSync(cible, page(docs));
    const t = comptes(docs.flatMap((d) => d.items));
    console.log(`${docs.length} listes, ${t.total} points (${t.fait} faits, ${t.en_cours} en cours, ${t.a_faire} à faire) → RESTE-A-FAIRE.md, ${path.relative(RACINE, cible)}`);
  } catch (e) {
    for (const l of String(e.message).split('\n')) console.error(`✗ ${l}`);
    process.exit(1);
  }
}
