// Prüft den fertigen Build in _site: Pflichtangaben in Artikeln und interne Links.
import fs from "node:fs";
import path from "node:path";

const SITE = "_site";
const fehler = [];

const kategorien = JSON.parse(fs.readFileSync("src/_data/kategorien.json", "utf8")).map((k) => k.slug);
for (const datei of fs.readdirSync("src/artikel").filter((f) => f.endsWith(".html") || f.endsWith(".md"))) {
  const text = fs.readFileSync(path.join("src/artikel", datei), "utf8");
  const kopf = text.split("---")[1] || "";
  for (const feld of ["titel", "slug", "kategorie", "beschreibung", "bild", "bild_alt", "datum"]) {
    if (!new RegExp(`^${feld}:\\s*\\S`, "m").test(kopf)) fehler.push(`${datei}: Feld "${feld}" fehlt`);
  }
  const slug = kopf.match(/^slug:\s*(\S+)/m)?.[1];
  if (slug && slug + path.extname(datei) !== datei) fehler.push(`${datei}: Dateiname muss ${slug}${path.extname(datei)} heißen`);
  const kat = kopf.match(/^kategorie:\s*(\S+)/m)?.[1];
  if (kat && !kategorien.includes(kat)) fehler.push(`${datei}: unbekannte Kategorie "${kat}"`);
  const bild = kopf.match(/^bild:\s*(\S+)/m)?.[1];
  if (bild && !fs.existsSync(path.join("src", bild))) fehler.push(`${datei}: Bild ${bild} fehlt`);
  const beschreibung = kopf.match(/^beschreibung:\s*"?(.*?)"?$/m)?.[1] || "";
  if (beschreibung.length > 160) fehler.push(`${datei}: Beschreibung länger als 160 Zeichen (${beschreibung.length})`);
}

function alleHtml(ordner) {
  return fs.readdirSync(ordner, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(ordner, e.name);
    if (e.isDirectory()) return e.name === "wp-content" ? [] : alleHtml(p);
    return e.name.endsWith(".html") ? [p] : [];
  });
}
for (const datei of alleHtml(SITE)) {
  const html = fs.readFileSync(datei, "utf8");
  for (const [, ziel] of html.matchAll(/(?:href|src)="(\/[^"#?]*)/g)) {
    const p = path.join(SITE, decodeURI(ziel));
    const ok = fs.existsSync(p) && (fs.statSync(p).isFile() || fs.existsSync(path.join(p, "index.html")) || fs.existsSync(path.join(p, "index.xml")));
    if (!ok) fehler.push(`${datei}: Link ins Leere ${ziel}`);
  }
}

if (fehler.length) {
  console.error(fehler.join("\n"));
  process.exit(1);
}
console.log("Prüfung ok");
