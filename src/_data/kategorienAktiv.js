// Kategorien, die mindestens einen veröffentlichten Artikel haben (Datum heute oder früher).
// Leere Kategorien bekommen so weder eine Seite noch einen Menüpunkt, bis ihr erster Artikel online ist.
import fs from "node:fs";
import path from "node:path";

export default function () {
  const heute = new Date().toISOString().slice(0, 10);
  const ordner = "src/artikel";
  const aktiv = new Set();
  for (const datei of fs.readdirSync(ordner).filter((f) => f.endsWith(".md") || f.endsWith(".html"))) {
    const kopf = fs.readFileSync(path.join(ordner, datei), "utf8").split("---")[1] || "";
    const kat = kopf.match(/^kategorie:\s*(\S+)/m)?.[1];
    const datum = kopf.match(/^datum:\s*(\S+)/m)?.[1];
    if (kat && datum && datum <= heute) aktiv.add(kat);
  }
  const alle = JSON.parse(fs.readFileSync("src/_data/kategorien.json", "utf8"));
  return alle.filter((k) => aktiv.has(k.slug));
}
