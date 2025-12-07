import { useEffect, useState } from "react";
import { fetchLeaderboard, type LeaderboardRow } from "../services/gameService";

export default function LeaderboardPage() {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchLeaderboard(50);
        setRows(data);
      } catch (e: any) {
        console.error(e);
        setError("Impossible de charger le classement.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <section className="page">
      <div>
        <h1 className="page-title">Classement — Leaderboard</h1>
        <p className="page-subtitle">Meilleurs joueurs par points accumulés</p>
      </div>

      {loading && <p>Chargement...</p>}
      {error && <p className="text-error">{error}</p>}

      {!loading && !error && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Top joueurs</h3>
            <span className="card-tag">{rows.length} joueur(s)</span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Joueur</th>
                  <th style={{ textAlign: "right" }}>Points</th>
                  <th style={{ textAlign: "center" }}>Parties</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={r.userId}>
                    <td style={{ padding: "0.5rem" }}>{idx + 1}</td>
                    <td style={{ padding: "0.5rem" }}>{r.name}</td>
                    <td style={{ padding: "0.5rem", textAlign: "right", fontWeight: 600 }}>{r.totalScore}</td>
                    <td style={{ padding: "0.5rem", textAlign: "center" }}>{r.gamesCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
