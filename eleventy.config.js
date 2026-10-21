// Eleventy-Konfiguration für werk-kueche.de
import fs from "node:fs";
import path from "node:path";

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/wp-content": "wp-content" });
  eleventyConfig.addPassthroughCopy({ "src/bilder": "bilder" });
  eleventyConfig.addPassthroughCopy({ "src/css": "css" });
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

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    templateFormats: ["html", "md", "njk"],
    htmlTemplateEngine: false,
    markdownTemplateEngine: false,
  };
}
