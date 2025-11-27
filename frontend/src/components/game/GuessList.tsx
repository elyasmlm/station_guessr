import type { Guess } from "../../types/game";

interface GuessListProps {
  guesses: Guess[];
}

function GuessList({ guesses }: GuessListProps) {
  if (guesses.length === 0) return null;

  return (
    <section className="card">
      <div className="card-header">
        <h2 className="card-title">Historique des essais</h2>
        <span className="card-tag">{guesses.length} tentative(s)</span>
      </div>
      <ul className="guess-list">
        {guesses.map((g) => (
          <li
            key={g.id}
            className={
              "guess-item" + (g.isCorrect ? " guess-item-correct" : "")
            }
          >
            <span>{g.text}</span>
            <span className="text-muted">
              {g.isCorrect ? "✅ Correct" : "❌ Faux"}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default GuessList;
