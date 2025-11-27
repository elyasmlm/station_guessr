import "dotenv/config";
import { pool } from "../config/db";
import { getAllStations } from "../services/game.service";


interface Station {
  name: string;
  city: string;
  arrondissement: number | null;
  lines: string[];
}

// Mélange Fisher–Yates
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function main() {
  console.log("🔹 Récupération des stations éligibles...");
  const stations = (await getAllStations()) as Station[];

  if (!stations.length) {
    console.log("Aucune station éligible trouvée, abandon.");
    process.exit(0);
  }

  console.log(`➡️ ${stations.length} stations trouvées.`);
  const shuffled = shuffle(stations);

  // On part de la dernière date déjà présente en BDD
  console.log("🔹 Lecture de la dernière date dans la table daily_games...");
  const [rowsRaw] = await pool.query("SELECT MAX(date) AS last_date FROM daily_games");
  const rows = rowsRaw as { last_date: Date | null }[];

  let startDate = new Date();
  startDate.setHours(0, 0, 0, 0);

  const lastDate = rows[0]?.last_date || null;

  if (lastDate) {
    const d = new Date(lastDate);
    d.setDate(d.getDate() + 1); // on commence au jour suivant
    startDate = d;
    console.log(
      `Dernière partie existante : ${lastDate.toISOString().slice(
        0,
        10
      )} → nouvelle génération à partir du ${startDate
        .toISOString()
        .slice(0, 10)}`
    );
  } else {
    console.log(
      `Aucune partie existante, création à partir d'aujourd'hui (${startDate
        .toISOString()
        .slice(0, 10)})`
    );
  }

  console.log("🔹 Insertion des parties journalières...");
  let created = 0;

  for (let i = 0; i < shuffled.length; i++) {
    const station = shuffled[i];

    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10); // YYYY-MM-DD

    // ⚠️ Adapte les noms de colonnes si nécessaire pour coller à ta table `games`
    await pool.execute(
    `
    INSERT IGNORE INTO daily_games (date, station_name, city, arrondissement, lines_json, created_at)
    VALUES (?, ?, ?, ?, ?, NOW())
    `,
    [
        dateStr,
        station.name,
        station.city,
        station.arrondissement ?? null,
        JSON.stringify(station.lines ?? [])

    ]
    );


    created++;
  }

  console.log(`✅ Parties générées pour ${created} jours.`);
  await pool.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Erreur lors de la génération des parties :", err);
  process.exit(1);
});
