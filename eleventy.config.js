// Eleventy-Konfiguration für werk-kueche.de
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/wp-content": "wp-content" });
  eleventyConfig.addPassthroughCopy({ "src/bilder": "bilder" });
  eleventyConfig.addPassthroughCopy({ "src/css": "css" });
  eleventyConfig.addPassthroughCopy({ "src/fonts": "fonts" });
  eleventyConfig.addPassthroughCopy({ "src/static": "/" });

  const datumText = (d) => (d instanceof Date ? d.toISOString().slice(0, 10) : String(d));

  // Neueste zuerst
  eleventyConfig.addCollection("artikelNeu", (api) =>
    api.getFilteredByTag("artikel").sort((a, b) => datumText(b.data.datum).localeCompare(datumText(a.data.datum)) || a.data.titel.localeCompare(b.data.titel))
  );

  eleventyConfig.addFilter("inKategorien", (liste, slugs) => liste.filter((a) => [].concat(slugs).includes(a.data.kategorie)));
  eleventyConfig.addFilter("ohne", (liste, url) => liste.filter((a) => a.url !== url));
  eleventyConfig.addFilter("finde", (liste, schluessel, wert) => liste.find((x) => x[schluessel] === wert));
  eleventyConfig.addFilter("head", (liste, n) => liste.slice(0, n));
  // Version der CSS-Datei für den Link, damit Browser nach jeder Änderung die neue Datei laden
  eleventyConfig.addFilter("version", (pfad) =>
    pfad + "?v=" + crypto.createHash("md5").update(fs.readFileSync(path.join("src", pfad))).digest("hex").slice(0, 8));
  eleventyConfig.addFilter("jahr", () => new Date().getFullYear());
  // Kleinere Bildvariante für Kacheln, falls vorhanden (WordPress-Größen wie -768x512.jpg)
  eleventyConfig.addFilter("karte", (pfad) => {
    const datei = path.join("src", pfad);
    const ordner = path.dirname(datei);
    const name = path.basename(datei, path.extname(datei));
    if (!fs.existsSync(ordner)) return pfad;
    const variante = fs.readdirSync(ordner).find((f) => f.startsWith(name + "-768x"));
    return variante ? path.posix.join(path.dirname(pfad), variante) : pfad;
  });
  eleventyConfig.addFilter("isoDatum", datumText);
  eleventyConfig.addFilter("rfcDatum", (d) => new Date(datumText(d) + "T08:00:00Z").toUTCString());
  eleventyConfig.addFilter("auszug", (html, woerter = 25) => {
    const text = String(html).replace(/<p class="bildnachweis">[\s\S]*?<\/p>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const w = text.split(" ");
    return w.length > woerter ? w.slice(0, woerter).join(" ") + " …" : text;
  });
  eleventyConfig.addFilter("xml", (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"));
  eleventyConfig.addFilter("absolut", (pfad, basis) => new URL(pfad, basis).href);
  eleventyConfig.addFilter("lesezeit", (html) => {
    const woerter = String(html).replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(woerter / 220));
  });

  // Artikel aufwerten, ohne den Quelltext der Artikel anzufassen:
  // Anker an den Zwischenüberschriften, Inhaltsverzeichnis, Sprungknopf zu den Empfehlungen,
  // Werbehinweis als Kasten, Listen mit Werbelinks als Produktkarten mit Knopf.
  const nurText = (s) => s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim();
  const anker = (s) =>
    nurText(s).toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
      .normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "abschnitt";
  eleventyConfig.addTransform("artikelExtras", function (html) {
    if (!this.page.inputPath.includes("/artikel/") || !String(this.page.outputPath).endsWith(".html")) return html;
    const start = html.indexOf('<div class="text">');
    const ende = html.indexOf('<aside class="autorbox">');
    if (start < 0 || ende < start) return html;
    let text = html.slice(start, ende);

    const vergeben = new Set();
    const inhalt = [];
    text = text.replace(/<h2>([\s\S]*?)<\/h2>/g, (m, innen) => {
      let id = anker(innen);
      for (let i = 2; vergeben.has(id); i++) id = `${anker(innen)}-${i}`;
      vergeben.add(id);
      inhalt.push({ id, titel: nurText(innen) });
      return `<h2 id="${id}">${innen}</h2>`;
    });

    text = text.replace(/<p><em>(Hinweis: Dieser Artikel enthält Werbelinks[\s\S]*?)<\/em><\/p>/, '<p class="werbehinweis">$1</p>');

    let empfehlungen = null;
    text = text.replace(/<ul>((?:(?!<\/?ul>)[\s\S])*?)<\/ul>/g, (m, innen, pos) => {
      const punkte = innen.match(/<li>[\s\S]*?<\/li>/g) || [];
      if (punkte.length < 2 || !punkte.every((li) => /rel="sponsored/.test(li))) return m;
      const h2 = text.lastIndexOf('<h2 id="', pos);
      if (!empfehlungen && h2 >= 0) empfehlungen = text.slice(h2 + 8, text.indexOf('"', h2 + 8));
      const karten = punkte.map((li) =>
        li.replace(/^<li>(<a [^>]*rel="sponsored[^>]*>)(.+?) bei ([^<]+)<\/a>\*<\/li>$/, (_, a, produkt, shop) =>
          `<li>${a}<span class="produkt">${produkt}</span><span class="knopf">Bei ${shop} ansehen*</span></a></li>`)
      );
      return `<ul class="produktliste">${karten.join("")}</ul>`;
    });

    // Gibt es Modellkarten, zeigt der Sprungknopf auf den Vergleich statt auf die Linkliste am Ende
    const modelle = text.indexOf('<div class="modelle">');
    if (modelle >= 0) {
      const h2 = text.lastIndexOf('<h2 id="', modelle);
      if (h2 >= 0) empfehlungen = text.slice(h2 + 8, text.indexOf('"', h2 + 8));
    }

    let box = "";
    if (empfehlungen && html.includes('<article class="artikel kaufberatung">')) box += `<a class="knopf-gross" href="#${empfehlungen}">Direkt zu den Empfehlungen ↓</a>`;
    if (inhalt.length >= 4) {
      box += `<details><summary>Inhalt</summary><ol>${inhalt.map((h) => `<li><a href="#${h.id}">${h.titel}</a></li>`).join("")}</ol></details>`;
    }
    if (box) {
      box = `<nav class="sprungbox" aria-label="Inhalt">${box}</nav>`;
      const hinweisEnde = text.indexOf("</p>", text.indexOf('class="werbehinweis"'));
      const nach = text.includes('class="werbehinweis"') ? hinweisEnde + 4 : '<div class="text">'.length;
      text = text.slice(0, nach) + box + text.slice(nach);
    }
    return html.slice(0, start) + text + html.slice(ende);
  });

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    templateFormats: ["html", "md", "njk"],
    htmlTemplateEngine: false,
    markdownTemplateEngine: false,
  };
}
