import type { RecordedGame } from "../../types/game";

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
        <table className="table">
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
                <td>{game.date}</td>
                <td>{game.stationName}</td>
                <td>{game.attempts}</td>
                <td>{game.extraLines}</td>
                <td>{game.cityRevealed ? "Oui" : "Non"}</td>
                <td style={{ fontWeight: 600 }}>{game.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default GamesHistoryTable;
