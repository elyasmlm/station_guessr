import { useEffect, useMemo, useState } from "react";
import type { Guess } from "../../types/game";
import { fetchAllStations } from "../../services/stationService";
import type { StationDTO } from "../../services/stationService";
import { normalize } from "../../utils/stations";
import { getLineImageInfo } from "../../utils/lineImage";

interface GuessListProps {
  guesses: Guess[];
}

function GuessList({ guesses }: GuessListProps) {
  const [stations, setStations] = useState<StationDTO[] | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchAllStations()
      .then((s) => mounted && setStations(s))
      .catch(() => {
        if (mounted) setStations([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const stationsByName = useMemo(() => {
    if (!stations) return new Map<string, StationDTO>();
    const m = new Map<string, StationDTO>();
    for (const s of stations) {
      m.set(normalize(s.name), s);
    }
    return m;
  }, [stations]);

  if (guesses.length === 0) return null;

  return (
    <section className="card">
      <div className="card-header">
        <h2 className="card-title">Historique des essais</h2>
        <span className="card-tag">{guesses.length} tentative(s)</span>
      </div>
      <ul className="guess-list">
        {guesses.map((g) => {
          const station = stationsByName.get(normalize(g.text));
          return (
            <li
              key={g.id}
              className={"guess-item" + (g.isCorrect ? " guess-item-correct" : "")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span>{g.text}</span>
                {station && (
                  <span style={{ display: "inline-flex", gap: 6 }}>
                    {station.lines.map((line) => {
                      const info = getLineImageInfo(line);
                      return (
                        <img
                          key={info.src}
                          src={info.src}
                          alt={info.alt}
                          title={info.label}
                          style={{ width: 28, height: 28, objectFit: "contain" }}
                        />
                      );
                    })}
                  </span>
                )}
              </div>

              <span className="text-muted">
                {g.isCorrect ? "✅ Correct" : "❌ Faux"}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default GuessList;
