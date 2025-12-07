import { useEffect, useMemo, useState } from "react";
import { fetchTodayGame, recordGame } from "../services/gameService";
import type { TodayGame, Guess } from "../types/game";
import StationLinesPanel from "../components/game/StationLinesPanel";
import GuessInput from "../components/game/GuessInput";
import GuessList from "../components/game/GuessList";
import WinModal from "../components/game/WinModal";
import RulesModal from "../components/game/RulesModal";
import { isSameStation } from "../utils/stations";
import { computeScore, type ScoreBreakdown } from "../utils/scoring";
import { useAuth } from "../context/AuthContext";

function GamePage() {
  const { user } = useAuth();

  const [game, setGame] = useState<TodayGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [nextGuessId, setNextGuessId] = useState(1);
  const [isSolved, setIsSolved] = useState(false);

  const [revealedLinesCount, setRevealedLinesCount] = useState(0);
  const [lastRevealAttemptsCount, setLastRevealAttemptsCount] = useState(0);
  const [cityRevealed, setCityRevealed] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await fetchTodayGame();
        setGame(data);
        // Try to restore an in-browser session for this date so users
        // can't refresh to restart their attempts.
        const key = `station_guessr_game_${data.date}`;
        let restored = false;
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const obj = JSON.parse(raw);
            // restore only expected fields, with sensible fallbacks
            setGuesses(Array.isArray(obj.guesses) ? obj.guesses : []);
            setNextGuessId(typeof obj.nextGuessId === 'number' ? obj.nextGuessId : 1);
            setIsSolved(!!obj.isSolved);
            setCityRevealed(!!obj.cityRevealed);
            setIsSaving(false);
            setIsSaved(false);
            setSaveError(null);

            const base = Math.min(2, data.station.lines.length);
            // clamp restored revealedLinesCount
            const restoredLines = typeof obj.revealedLinesCount === 'number' ? Math.max(base, Math.min(obj.revealedLinesCount, data.station.lines.length)) : base;
            setRevealedLinesCount(restoredLines);
            setLastRevealAttemptsCount(typeof obj.lastRevealAttemptsCount === 'number' ? obj.lastRevealAttemptsCount : 0);
            restored = true;
          }
        } catch (e) {
          // ignore parse/localStorage errors and fall back to fresh state
        }

        if (!restored) {
          setGuesses([]);
          setNextGuessId(1);
          setIsSolved(false);
          setCityRevealed(false);
          setIsSaving(false);
          setIsSaved(false);
          setSaveError(null);

          const baseLines = Math.min(2, data.station.lines.length);
          setRevealedLinesCount(baseLines);
          setLastRevealAttemptsCount(0);
        }
      } catch (e: any) {
        console.error(e);
        setError("Impossible de charger la partie du jour.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  // persist session state for the current day's game so refresh doesn't reset attempts
  useEffect(() => {
    if (!game) return;
    const key = `station_guessr_game_${game.date}`;
    try {
      const toSave = JSON.stringify({
        guesses,
        nextGuessId,
        isSolved,
        revealedLinesCount,
        lastRevealAttemptsCount,
        cityRevealed,
      });
      localStorage.setItem(key, toSave);
    } catch (e) {
      // ignore storage errors
    }
  }, [game, guesses, nextGuessId, isSolved, revealedLinesCount, lastRevealAttemptsCount, cityRevealed]);

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
    if (!game) return;
    if (isSolved) return;

    const isCorrect = isSameStation(guessText, game.station.name);

    const newGuess: Guess = {
      id: nextGuessId,
      text: guessText,
      isCorrect,
    };

    setGuesses((prev) => [...prev, newGuess]);
    setNextGuessId((id) => id + 1);

    if (isCorrect) {
      setIsSolved(true);
    }
  };

  const handleRevealLine = () => {
    if (!game) return;
    if (isSolved) return;
    if (!canRevealLine) return;

    setRevealedLinesCount((count) =>
      Math.min(count + 1, game.station.lines.length)
    );
    setLastRevealAttemptsCount(guesses.length);
  };

  const handleRevealCity = () => {
    if (isSolved) return;
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
      isCorrectFirstTry: guesses[0]?.isCorrect === true,
    });
  }, [game, attempts, extraLinesUsed, cityRevealed, guesses]);

  // Enregistrement partie côté backend si user connecté
  useEffect(() => {
    const saveGame = async () => {
      if (!game || !score || !user) return;
      try {
        setIsSaving(true);
        setSaveError(null);
        await recordGame({
          date: game.date,
          attempts,
          extraLines: extraLinesUsed,
          cityRevealed,
          score: score.total,
        });
        setIsSaved(true);
        try {
          const savedKey = `station_guessr_saved_${game.date}_user_${user.id}`;
          localStorage.setItem(savedKey, "1");
        } catch (e) {
          /* ignore */
        }
      } catch (e: any) {
        console.error(e);
        setSaveError("Erreur lors de l'enregistrement de la partie.");
      } finally {
        setIsSaving(false);
      }
    };

    if (isSolved && !isSaved && !isSaving && user) {
      void saveGame();
    }
  }, [
    isSolved,
    isSaved,
    isSaving,
    game,
    score,
    attempts,
    extraLinesUsed,
    cityRevealed,
    user,
  ]);

  // Restore isSaved flag from localStorage for logged-in users to avoid
  // re-sending the recorded game after a page reload.
  useEffect(() => {
    if (!game || !user) return;
    try {
      const savedKey = `station_guessr_saved_${game.date}_user_${user.id}`;
      const v = localStorage.getItem(savedKey);
      if (v) setIsSaved(true);
    } catch (e) {
      // ignore
    }
  }, [game, user]);

  // modal control when user wins
  const [showWinModal, setShowWinModal] = useState(false);
  // modal control for first-launch rules
  const [showRulesModal, setShowRulesModal] = useState(false);

  useEffect(() => {
    if (isSolved) setShowWinModal(true);
  }, [isSolved]);

  useEffect(() => {
    // show rules modal on first visit (persist choice in localStorage)
    const KEY = "station_guessr_seen_rules_v1";
    try {
      if (typeof window !== "undefined") {
        const seen = localStorage.getItem(KEY);
        if (!seen) setShowRulesModal(true);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // ---------- Rendu ----------

  if (loading) {
    return <p>Chargement de la partie du jour...</p>;
  }

  if (error) {
    return <p className="text-error">{error}</p>;
  }

  if (!game) {
    return <p>Aucune partie disponible.</p>;
  }

  return (
    <section className="page">
      <div style={{ textAlign: "center" }}>
        <h1 className="page-title">Partie du jour</h1>
        <p className="page-subtitle">
          Date : <strong>{game.date}</strong>
        </p>
      </div>

      <div>
        {!isSolved ? (
          <GuessInput onSubmitGuess={handleSubmitGuess} />
        ) : (
          <section className="card card-soft">
            <h2 className="card-title">Partie terminée</h2>
            <p>Tu as déjà trouvé la station pour cette partie du jour. Reviens demain pour une nouvelle partie.</p>
          </section>
        )}
      </div>

      <WinModal
        open={showWinModal}
        onClose={() => setShowWinModal(false)}
        summary={{
          stationName: game.station.name,
          date: game.date,
          attempts: attempts,
          score: score?.total ?? 0,
          extraLines: extraLinesUsed,
          cityRevealed: cityRevealed,
        }}
      />
      <RulesModal
        open={showRulesModal}
        onClose={(dontShowAgain?: boolean) => {
          if (dontShowAgain) {
            try {
              localStorage.setItem("station_guessr_seen_rules_v1", "1");
            } catch (e) {
              /* ignore */
            }
          } else {
            try {
              localStorage.setItem("station_guessr_seen_rules_v1", "1");
            } catch (e) {
              /* ignore */
            }
          }
          setShowRulesModal(false);
        }}
      />

      <div
        className="page-grid-2"
        style={{ alignItems: "stretch", marginTop: "1rem" }}
      >
        <div style={{ display: "grid", gap: "1rem" }}>
          {score && (
            <section className="card card-soft card-full-height">
              <div className="card-header">
                <h2 className="card-title">Score actuel</h2>
                {isSolved && (
                  <span className="badge badge-success">Station trouvée</span>
                )}
              </div>
              <p>
                <strong>Total :</strong> {score.total} points
              </p>
              <ul className="text-muted">
                <li>Base : {score.base} pts</li>
                <li>- {score.attemptsPenalty} pts (essais : {attempts})</li>
                <li>
                  - {score.linesPenalty} pts (lignes supplémentaires :{" "}
                  {extraLinesUsed})
                </li>
                <li>
                  - {score.cityPenalty} pts (ville dévoilée :{" "}
                  {cityRevealed ? "oui" : "non"})
                </li>
              </ul>

              {isSolved && (
                <p style={{ marginTop: "0.5rem" }}>
                  {user ? (
                    <>
                      {isSaving && "Enregistrement en cours..."}
                      {isSaved && !isSaving && (
                        <span style={{ color: "#22c55e" }}>
                          {" "}
                          Partie enregistrée dans ton historique.
                        </span>
                      )}
                      {saveError && (
                        <span className="text-error"> {saveError}</span>
                      )}
                    </>
                  ) : (
                    <span className="text-muted">
                      Connecte-toi pour enregistrer ton score.
                    </span>
                  )}
                </p>
              )}
            </section>
          )}

          <GuessList guesses={guesses} />
        </div>

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
                disabled={isSolved || !canRevealLine}
                className="btn btn-warning"
              >
                Révéler une ligne supplémentaire (-10 pts)
              </button>

              <button
                type="button"
                onClick={handleRevealCity}
                disabled={isSolved || !canRevealCity}
                className="btn btn-danger"
              >
                Révéler la ville / arrondissement (-100 pts)
              </button>
            </div>

            {isSolved && (
              <p
                style={{
                  marginTop: "0.75rem",
                  color: "#22c55e",
                  fontWeight: 600,
                }}
              >
                Bravo, tu as trouvé la station !
              </p>
            )}
          </section>
        </div>
      </div>
    </section>
  );

}

export default GamePage;
