import { useEffect, useMemo, useState } from "react";
import { fetchGameByDate, fetchAvailableDates } from "../services/gameService";
import type { TodayGame, Guess } from "../types/game";
import StationLinesPanel from "../components/game/StationLinesPanel";
import GuessInput from "../components/game/GuessInput";
import GuessList from "../components/game/GuessList";
import { isSameStation } from "../utils/stations";
import { computeScore, type ScoreBreakdown } from "../utils/scoring";
import "../styles/history.css";

function HistoryPage() {
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [datesLoading, setDatesLoading] = useState(true);
  const [datesError, setDatesError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<string>("");

  const [game, setGame] = useState<TodayGame | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [nextGuessId, setNextGuessId] = useState(1);
  const [isSolved, setIsSolved] = useState(false);

  const [revealedLinesCount, setRevealedLinesCount] = useState(0);
  const [lastRevealAttemptsCount, setLastRevealAttemptsCount] = useState(0);
  const [cityRevealed, setCityRevealed] = useState(false);

  // -----------------------------
  // CHARGEMENT DES DATES DISPONIBLES
  // -----------------------------
  useEffect(() => {
    const loadDates = async () => {
      try {
        setDatesLoading(true);
        setDatesError(null);

        const dates = await fetchAvailableDates();
        setAvailableDates(dates);

        // Choix automatique de la première date (la plus récente)
        if (dates.length > 0) {
          setSelectedDate((prev) => {
          if (dates.includes(prev)) return prev;
          return dates[0] ?? "";
        });
        }
      } catch (e: any) {
        console.error(e);
        setDatesError("Impossible de charger les dates disponibles.");
      } finally {
        setDatesLoading(false);
      }
    };

    void loadDates();
  }, []);

  // -----------------------------
  // CHARGEMENT D'UNE PARTIE DÉTERMINÉE
  // -----------------------------
  useEffect(() => {
    if (datesLoading) return;
    if (!selectedDate) return;
    if (availableDates.length === 0) return;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await fetchGameByDate(selectedDate);
        setGame(data);

        // reset état
        setGuesses([]);
        setNextGuessId(1);
        setIsSolved(false);
        setCityRevealed(false);

        const baseLines = Math.min(2, data.station.lines.length);
        setRevealedLinesCount(baseLines);
        setLastRevealAttemptsCount(0);
      } catch (e: any) {
        console.error(e);
        setError("Impossible de charger la partie pour cette date.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [selectedDate, datesLoading, availableDates]);


  // -----------------------------
  // LOGIQUE DU JEU
  // -----------------------------

  const baseLines = useMemo(() => {
    if (!game) return 0;
    return Math.min(2, game.station.lines.length);
  }, [game]);

  const attempts = guesses.length;

  const canRevealLine = useMemo(() => {
    if (!game) return false;
    if (revealedLinesCount >= game.station.lines.length) return false;

    if (revealedLinesCount <= baseLines) {
      return attempts >= 3;
    }
    return attempts - lastRevealAttemptsCount >= 3;
  }, [attempts, game, revealedLinesCount, lastRevealAttemptsCount, baseLines]);

  const canRevealCity = useMemo(() => {
    if (!game) return false;
    if (cityRevealed) return false;
    return attempts >= 10;
  }, [attempts, game, cityRevealed]);

  const handleSubmitGuess = (guessText: string) => {
    if (!game || isSolved) return;

    const isCorrect = isSameStation(guessText, game.station.name);

    const newGuess: Guess = {
      id: nextGuessId,
      text: guessText,
      isCorrect,
    };

    setGuesses((prev) => [...prev, newGuess]);
    setNextGuessId((id) => id + 1);

    if (isCorrect) setIsSolved(true);
  };

  const handleRevealLine = () => {
    if (!game || !canRevealLine) return;
    setRevealedLinesCount((count) =>
      Math.min(count + 1, game.station.lines.length)
    );
    setLastRevealAttemptsCount(guesses.length);
  };

  const handleRevealCity = () => {
    if (!canRevealCity) return;
    setCityRevealed(true);
  };

  const revealedLines = useMemo(() => {
    if (!game) return [];
    return game.station.lines.slice(0, revealedLinesCount);
  }, [game, revealedLinesCount]);

  const extraLinesUsed = Math.max(0, revealedLinesCount - baseLines);

  const score: ScoreBreakdown | null = useMemo(() => {
    if (!game) return null;
    return computeScore({
      attempts,
      extraLines: extraLinesUsed,
      cityRevealed,
    });
  }, [game, attempts, extraLinesUsed, cityRevealed]);

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <section className="page">
      <div>
        <h1 className="page-title">Anciens jours</h1>
        <p className="page-subtitle">
          Rejoue les parties précédentes, avec les mêmes règles et indices.
        </p>
      </div>

      <div className="history-layout">
        {/* Sidebar dates */}
        <aside className="history-sidebar">
          <section className="card card-soft">
            <div className="card-header">
              <h2 className="card-title">Sélection de la date</h2>
              <span className="card-tag">Dates disponibles</span>
            </div>

            <div className="history-sidebar-inner">
              {datesLoading && (
                <p className="text-muted">Chargement des dates...</p>
              )}

              {datesError && (
                <p className="text-error">{datesError}</p>
              )}

              {!datesLoading && !datesError && availableDates.length === 0 && (
                <p className="text-muted">Aucune date disponible.</p>
              )}

              {!datesLoading && availableDates.length > 0 && (
                <ul className="history-date-list">
                  {availableDates.map((date) => {
                    const isActive = date === selectedDate;
                    return (
                      <li key={date} className="history-date-item">
                        <button
                          type="button"
                          onClick={() => setSelectedDate(date)}
                          className={
                            "history-date-button" +
                            (isActive ? " history-date-button--active" : "")
                          }
                        >
                          {date}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>
        </aside>

        {/* Partie principale */}
        <div className="history-right">
          {loading && (
            <p>Chargement de la partie du {selectedDate}...</p>
          )}

          {error && <p className="text-error">{error}</p>}

          {!loading && !error && !game && selectedDate && (
            <p>Aucune partie disponible pour cette date.</p>
          )}

          {!loading && !error && game && (
            <>
              <div className="history-right-header">
                <h2 className="page-title" style={{ fontSize: "1.2rem" }}>
                  Partie du {game.date}
                </h2>
              </div>

              <GuessInput onSubmitGuess={handleSubmitGuess} />

              <div className="history-right-grid">
                {/* Score */}
                <div style={{ display: "grid", gap: "1rem" }}>
                  {score && (
                    <section className="card card-soft card-full-height">
                      <div className="card-header">
                        <h3 className="card-title">Score actuel</h3>
                        {isSolved && (
                          <span className="badge badge-success">
                            Station trouvée
                          </span>
                        )}
                      </div>

                      <p>
                        <strong>Total :</strong> {score.total} points
                      </p>
                      <ul className="text-muted">
                        <li>Base : {score.base} pts</li>
                        <li>
                          - {score.attemptsPenalty} pts (essais : {attempts})
                        </li>
                        <li>
                          - {score.linesPenalty} pts (lignes supplémentaires :{" "}
                          {extraLinesUsed})
                        </li>
                        <li>
                          - {score.cityPenalty} pts (ville dévoilée :{" "}
                          {cityRevealed ? "oui" : "non"})
                        </li>
                      </ul>
                    </section>
                  )}

                  <GuessList guesses={guesses} />
                </div>

                {/* Indices */}
                <div>
                  <section className="card card-soft card-full-height">
                    <StationLinesPanel
                      lines={revealedLines}
                      city={game.station.city}
                      arrondissement={game.station.arrondissement}
                      showCity={cityRevealed}
                      embedded
                    />

                    <div
                      style={{
                        marginTop: "1rem",
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "0.75rem",
                      }}
                    >
                      <button
                        type="button"
                        onClick={handleRevealLine}
                        disabled={!canRevealLine}
                        className="btn btn-warning"
                      >
                        Révéler une ligne supplémentaire (-10 pts)
                      </button>

                      <button
                        type="button"
                        onClick={handleRevealCity}
                        disabled={!canRevealCity}
                        className="btn btn-danger"
                      >
                        Révéler la ville / arrondissement (-100 pts)
                      </button>
                    </div>
                  </section>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default HistoryPage;
