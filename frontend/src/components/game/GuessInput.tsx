import { useEffect, useState } from "react";
import { fetchAllStations } from "../../services/stationService";
import { filterStations } from "../../utils/stations";

interface GuessInputProps {
  onSubmitGuess: (guess: string) => void;
}

function GuessInput({ onSubmitGuess }: GuessInputProps) {
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [allStations, setAllStations] = useState<string[]>([]);
  const [loadingStations, setLoadingStations] = useState(true);
  const [stationsError, setStationsError] = useState<string | null>(null);

  useEffect(() => {
    const loadStations = async () => {
      try {
        setLoadingStations(true);
        setStationsError(null);
        const stations = await fetchAllStations();
        const names = stations.map((s) => s.name);
        setAllStations(names);
      } catch (e: any) {
        console.error(e);
        setStationsError("Impossible de charger la liste des stations.");
      } finally {
        setLoadingStations(false);
      }
    };

    void loadStations();
  }, []);

  useEffect(() => {
    const s = filterStations(allStations, value, 8);
    setSuggestions(s);
  }, [value, allStations]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmitGuess(trimmed);
    setValue("");
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setValue(suggestion);
    setShowSuggestions(false);
  };

  return (
    <section className="card card-soft">
      <h2 className="card-title" style={{ marginBottom: "0.5rem" }}>
        Deviner la station
      </h2>

      {stationsError && <p className="text-error">{stationsError}</p>}
      {loadingStations && !stationsError && (
        <p className="text-muted">
          Chargement des stations d&apos;Île-de-France...
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        style={{
          marginTop: "0.5rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
        }}
      >
        <div style={{ flex: 1, position: "relative" }}>
          <input
            type="text"
            placeholder="Tape le nom d'une station..."
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            style={{
              width: "100%",
              padding: "0.75rem 0.8rem",
              fontSize: "0.95rem",
              borderRadius: 999,
            }}
          />

          {showSuggestions &&
            suggestions.length > 0 &&
            !loadingStations &&
            !stationsError && (
              <ul
                style={{
                  position: "absolute",
                  top: "2.7rem",
                  left: 0,
                  right: 0,
                  maxHeight: "260px",
                  overflowY: "auto",
                  background: "#020617",
                  borderRadius: "12px",
                  border: "1px solid rgba(148,163,184,0.4)",
                  listStyle: "none",
                  margin: 0,
                  padding: "0.2rem 0",
                  zIndex: 10,
                }}
              >
                {suggestions.map((s) => (
                  <li
                    key={s}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSuggestionClick(s);
                    }}
                    style={{
                      padding: "0.4rem 0.75rem",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                    }}
                  >
                    {s}
                  </li>
                ))}
              </ul>
            )}
        </div>

        <button type="submit" className="btn btn-primary">
          Valider
        </button>
      </form>
    </section>
  );
}

export default GuessInput;
