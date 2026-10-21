# werk-kueche.de

Statische Website (Eleventy 3). Jeder Push auf `main` baut die Seite und lädt sie per FTPS auf den ALL-INKL-Webspace. Commit = veröffentlichen.

## Neuen Artikel anlegen
1. Datei `src/artikel/<slug>.md` (Markdown, HTML erlaubt). Dateiname = Slug = URL (`https://werk-kueche.de/<slug>/`).
2. Kopf (alle Felder Pflicht, `npm run check` prüft das):
   ```yaml
   ---
   titel: "Pizzaofen kaufen: Gas, Holz oder Elektro?"
   slug: pizzaofen-kaufen
   kategorie: pizza-brot        # Slug aus src/_data/kategorien.json
   beschreibung: "Meta-Beschreibung, höchstens 160 Zeichen."
   bild: /bilder/pizzaofen-kaufen.jpg
   bild_alt: "Beschreibung des Bildes"
   datum: 2026-10-24            # Veröffentlichungstag
   ---
   ```
3. Bild nach `src/bilder/` legen (JPG, ca. 1600 px breit, ohne EXIF). Unsplash-Fotos mit Bildnachweis am Artikelende (`<p class="bildnachweis"><small>…</small></p>`).
4. `npm run build && npm run check`, dann committen und pushen.

**Geplante Veröffentlichung:** Ein Artikel mit `datum` in der Zukunft wird nicht gebaut. Der tägliche Lauf (05:00 UTC) bringt ihn an seinem Tag automatisch online. So werden neue Artikel gestaffelt (ca. 2 pro Woche).

## Regeln
- Autor ist das Pseudonym Giacomo Pellini (`src/_data/autoren.json`). Keine erfundenen weiteren Autoren, kein Rückdatieren (`datum` nie in die Vergangenheit setzen).
- Daten werden auf der Seite nicht angezeigt.
- Werbelinks mit Sternchen (*) kennzeichnen und `rel="sponsored nofollow noopener" target="_blank"` setzen. Artikel mit Werbelinks bekommen oben den Hinweis „Dieser Artikel enthält Werbelinks (*)“.
- Keine Restaurantfotos, keine Fotos mit erkennbaren Personen.
- Impressum behält den echten Namen (Pflicht nach § 5 DDG).
- Keine Cookies, keine Tracking-Skripte ohne Rücksprache (sonst Cookie-Banner und neue Datenschutzerklärung nötig).
- Bestehende URLs nie ändern (Pins verlinken darauf). Wenn doch nötig: 301 in `src/static/.htaccess`.

## Aufbau
- `src/artikel/` Artikel, `src/seiten/` Impressum, Datenschutz usw.
- `src/_data/site.json` Name, Menüs, Pinterest-Bestätigung, Startseiten-Kategorien
- `src/_data/kategorien.json` Kategorien (URL `/category/<slug>/`)
- `src/_includes/` Vorlagen, `src/css/style.css` Design (Farben aus dem Logo: #c25a2c, #f6f1e9)
- `src/wp-content/uploads/` Bilder aus der WordPress-Zeit (Pfade bleiben gleich)
- `src/static/` wird 1:1 ins Wurzelverzeichnis kopiert (`.htaccess`, `robots.txt`)
- Feed für Pinterest: `/feed/`, Sitemap: `/sitemap.xml`

## Deploy
GitHub Actions (`.github/workflows/deploy.yml`), Secrets `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`. Der FTP-Zugang ist im KAS auf das Verzeichnis der Website beschränkt.
