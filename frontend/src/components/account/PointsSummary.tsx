import type { RecordedGame } from "../../types/game";

interface PointsSummaryProps {
  history: RecordedGame[];
}

function PointsSummary({ history }: PointsSummaryProps) {
  const gamesCount = history.length;
  const totalPoints = history.reduce((sum, g) => sum + g.score, 0);
  const bestScore =
    gamesCount === 0 ? 0 : history.reduce((max, g) => Math.max(max, g.score), 0);
  const avgScore =
    gamesCount === 0 ? 0 : Math.round(totalPoints / gamesCount);

  return (
    <section className="card">
      <div className="card-header">
        <h2 className="card-title">Points accumulés</h2>
      </div>
      {gamesCount === 0 ? (
        <p className="text-muted">
          Tu n&apos;as pas encore de parties enregistrées. Joue une partie pour
          commencer à gagner des points.
        </p>
      ) : (
        <ul className="text-muted">
          <li>
            <strong>Total :</strong> {totalPoints} points
          </li>
          <li>
            <strong>Nombre de parties :</strong> {gamesCount}
          </li>
          <li>
            <strong>Meilleur score :</strong> {bestScore}
          </li>
          <li>
            <strong>Score moyen :</strong> {avgScore}
          </li>
        </ul>
      )}
    </section>
  );
}

export default PointsSummary;
