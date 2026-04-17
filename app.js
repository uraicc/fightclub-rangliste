const CSV_PATH = "./fightclub_matches.csv";

const statusEl = document.getElementById("status");
const csvPathEl = document.getElementById("csvPath");
const reloadBtn = document.getElementById("reloadBtn");
const rankingBody = document.querySelector("#rankingTable tbody");
const matchesBody = document.querySelector("#matchesTable tbody");

csvPathEl.textContent = CSV_PATH;

function parseCsv(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const rows = [];
  const dataLines = lines.slice(1);
  for (const line of dataLines) {
    const cols = line.split(",");
    if (cols.length < 6) continue;

    rows.push({
      datum: cols[0]?.trim() ?? "",
      name1: cols[1]?.trim() ?? "",
      name2: cols[2]?.trim() ?? "",
      runden_name1: Number(cols[3] ?? 0),
      runden_name2: Number(cols[4] ?? 0),
      ergebnis: cols[5]?.trim() ?? "",
    });
  }
  return rows;
}

function calculateRanking(matches) {
  const table = new Map();
  const get = (name) => {
    if (!table.has(name)) {
      table.set(name, {
        name,
        spiele: 0,
        siege: 0,
        unentschieden: 0,
        niederlagen: 0,
        punkte: 0,
      });
    }
    return table.get(name);
  };

  for (const m of matches) {
    const p1 = get(m.name1);
    const p2 = get(m.name2);
    p1.spiele += 1;
    p2.spiele += 1;

    if (m.runden_name1 > m.runden_name2) {
      p1.siege += 1;
      p2.niederlagen += 1;
      p1.punkte += 3;
    } else if (m.runden_name2 > m.runden_name1) {
      p2.siege += 1;
      p1.niederlagen += 1;
      p2.punkte += 3;
    } else {
      p1.unentschieden += 1;
      p2.unentschieden += 1;
      p1.punkte += 1;
      p2.punkte += 1;
    }
  }

  return [...table.values()].sort(
    (a, b) => b.punkte - a.punkte || a.name.localeCompare(b.name, "de")
  );
}

function renderRanking(ranking) {
  rankingBody.innerHTML = "";
  if (!ranking.length) {
    rankingBody.innerHTML =
      '<tr><td colspan="7">Keine Daten vorhanden.</td></tr>';
    return;
  }

  ranking.forEach((row, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${row.name}</td>
      <td>${row.spiele}</td>
      <td>${row.siege}</td>
      <td>${row.unentschieden}</td>
      <td>${row.niederlagen}</td>
      <td><strong>${row.punkte}</strong></td>
    `;
    rankingBody.appendChild(tr);
  });
}

function renderMatches(matches) {
  matchesBody.innerHTML = "";
  if (!matches.length) {
    matchesBody.innerHTML =
      '<tr><td colspan="6">Keine Eintraege vorhanden.</td></tr>';
    return;
  }

  for (const m of matches) {
    const result =
      m.runden_name1 > m.runden_name2
        ? "1"
        : m.runden_name1 < m.runden_name2
          ? "2"
          : "X";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${m.datum}</td>
      <td>${m.name1}</td>
      <td>${m.name2}</td>
      <td>${m.runden_name1}</td>
      <td>${m.runden_name2}</td>
      <td>${result}</td>
    `;
    matchesBody.appendChild(tr);
  }
}

async function loadAndRender() {
  statusEl.textContent = "Lade CSV...";
  try {
    const res = await fetch(CSV_PATH, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const matches = parseCsv(text);
    const ranking = calculateRanking(matches);

    renderRanking(ranking);
    renderMatches(matches);
    statusEl.textContent = `${matches.length} Battles geladen.`;
  } catch (err) {
    statusEl.textContent = `Fehler beim Laden: ${err.message}. Starte die Seite ueber einen lokalen Server.`;
    renderRanking([]);
    renderMatches([]);
  }
}

reloadBtn.addEventListener("click", loadAndRender);
loadAndRender();
