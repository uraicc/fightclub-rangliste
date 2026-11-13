# Fightclub Battlerap Rangliste

Mini-Webseite in HTML/CSS/JavaScript zur Berechnung und Anzeige einer Rangliste fuer Fightclub Battles.

## Features

- Liest Battle-Daten aus `../fightclub_matches.csv`
- Berechnet automatisch die Rangliste
  - Sieg = 3 Punkte
  - Unentschieden = 1 Punkt
  - Niederlage = 0 Punkte
- Zeigt zwei Tabellen:
  - `Rangliste`
  - `Alle Battles`
- Dunkles Design im Fightclub-Stil

## Projektstruktur

- `index.html` - Seitenstruktur
- `styles.css` - Design/Styling
- `app.js` - CSV-Parsing, Berechnung, Rendering
- `../fightclub_matches.csv` - Datenquelle

## CSV-Format

Die CSV-Datei muss folgende Header haben:

```csv
datum,name1,name2,runden_name1,runden_name2,ergebnis
```

Beispiel:

```csv
2026-04-01,Ares,Blaze,3,1,1
2026-04-02,Cipher,Drift,2,2,X
```

Hinweis: Die Webseite berechnet das Ergebnis aus den Rundenwerten selbst.

## Lokal starten

Im Projekt-Root (`C:\AI\Cursor`) einen lokalen Server starten:

```powershell
python -m http.server 8080
```

Dann im Browser:

- `http://127.0.0.1:8080/fightclub-mini-web/`



Webseite:

- `https://uraicc.github.io/fightclub-rangliste/`

## kie.ai API (Video / Fightclub-Memes)

Server-seitige Anbindung an [kie.ai](https://docs.kie.ai/market/quickstart) für Video-Generierung (z. B. Chattygerüste-Szene).

### Setup

1. API-Key unter kie.ai anlegen
2. Secret `KIE_API_KEY` in Cursor (App-/Environment-Secrets) setzen — **nicht** in den Chat posten und nicht committen
3. Optional lokal: `.env.example` → `.env` kopieren und Key eintragen

### Nutzung

```bash
# Payload prüfen (ohne API-Call)
npm run kie:dry-run

# Credits
KIE_API_KEY=… npm run kie:credits

# Video mit bis zu 10 Character-Refs (Wan 3.0)
KIE_API_KEY=… node kie/generate-video.mjs --wait \
  --model wan/3-0-video \
  --refs "https://…/traube.png,https://…/fickbert.png,…"
```

Referenz-Reihenfolge für Chattygerüste: Traubensaft → Fickbert → Ghost → Smio → Axepulse → Rebel → Shizzo → D'n Dave.

Hinweise:

- Der Key darf **nie** in Client-JS der GitHub-Pages-Rangliste landen
- Veo `REFERENCE_2_VIDEO` max. 3 Bilder; Wan `reference_image_urls` bis 10
- Docs: https://docs.kie.ai/market/quickstart
