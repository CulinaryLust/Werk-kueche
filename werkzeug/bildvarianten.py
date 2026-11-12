"""Kleinere Varianten der Artikelbilder für Handys erzeugen (name-768xH.jpg, name-1024xH.jpg).

Aufruf: python3 werkzeug/bildvarianten.py src/bilder/<slug>.jpg  (ohne Argument: alle Bilder in src/bilder)
Die Seite nutzt die Varianten automatisch (srcset, Kacheln). Fehlen sie, wird das Original geladen.
"""
import glob, os, re, sys
from PIL import Image

dateien = sys.argv[1:] or [f for f in glob.glob("src/bilder/*.jpg") if not re.search(r"-\d+x\d+\.jpg$", f)]
for datei in dateien:
    name, endung = os.path.splitext(datei)
    bild = Image.open(datei).convert("RGB")
    for breite in (768, 1024):
        if bild.width <= breite:
            continue
        hoehe = round(bild.height * breite / bild.width)
        ziel = f"{name}-{breite}x{hoehe}{endung}"
        bild.resize((breite, hoehe), Image.LANCZOS).save(ziel, "JPEG", quality=80, optimize=True, progressive=True)
        print(ziel, os.path.getsize(ziel) // 1024, "KB")
