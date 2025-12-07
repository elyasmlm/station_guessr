import type { RecordedGame } from "../../types/game";

function formatDateDisplay(dateStr: string) {
  // expected input: YYYY-MM-DD (see types)
  if (!dateStr) return "-";
  const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return dateStr;
  const [, year, month, day] = m;
  return `${day}-${month}-${year}`;
}

interface GamesHistoryTableProps {
  history: RecordedGame[];
}

function GamesHistoryTable({ history }: GamesHistoryTableProps) {
  if (history.length === 0) {
    return <p className="text-muted">Tu n'as encore aucune partie enregistrée.</p>;
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Historique des parties</h3>
        <span className="card-tag">{history.length} partie(s)</span>
      </div>
      <div style={{ maxHeight: "360px", overflow: "auto" }}>
        <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Station</th>
              <th>Essais</th>
              <th>Lignes +</th>
              <th>Ville dévoilée</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {history.map((game) => (
              <tr key={game.id}>
                <td style={{ whiteSpace: "nowrap", padding: "0.5rem" }}>
                  {formatDateDisplay(game.date)}
                </td>
                <td style={{ maxWidth: 320, padding: "0.5rem", wordBreak: "break-word" }}>
                  {game.stationName || "—"}
                </td>
                <td style={{ textAlign: "center", padding: "0.5rem" }}>{game.attempts}</td>
                <td style={{ textAlign: "center", padding: "0.5rem" }}>
                  {typeof game.extraLines === "number" && game.extraLines > 0
                    ? `+${game.extraLines} ${game.extraLines === 1 ? "ligne" : "lignes"}`
                    : "—"}
                </td>
                <td style={{ textAlign: "center", padding: "0.5rem" }}>
                  {game.cityRevealed ? "Oui" : "Non"}
                </td>
                <td style={{ fontWeight: 600, textAlign: "right", padding: "0.5rem" }}>{game.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default GamesHistoryTable;
