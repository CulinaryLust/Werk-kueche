// Gemeinsame Daten für alle Artikel in diesem Ordner.
const heute = () => new Date().toISOString().slice(0, 10);
const datumText = (d) => (d instanceof Date ? d.toISOString().slice(0, 10) : String(d));
const geplant = (data) => datumText(data.datum) > heute();

export default {
  layout: "artikel.njk",
  tags: ["artikel"],
  autor: "giacomo",
  eleventyComputed: {
    // Artikel mit Datum in der Zukunft werden erst ab diesem Tag veröffentlicht.
    permalink: (data) => (geplant(data) ? false : `/${data.slug}/`),
    eleventyExcludeFromCollections: (data) => geplant(data),
  },
};
