import { useEffect, useState } from "react";
import { fetchGamesHistory } from "../services/gameService";
import type { RecordedGame } from "../types/game";
import PointsSummary from "../components/account/PointsSummary";
import GamesHistoryTable from "../components/account/GamesHistoryTable";
import { useAuth } from "../context/AuthContext";

function AccountPage() {
  const { user, loading: authLoading } = useAuth();
  const [history, setHistory] = useState<RecordedGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setHistory([]);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const data = await fetchGamesHistory();
        setHistory(data);
      } catch (e: any) {
        console.error(e);
        setError("Impossible de charger les informations du compte.");
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      void load();
    }
  }, [user, authLoading]);

  if (authLoading) {
    return <p>Chargement de ton espace compte...</p>;
  }

  if (!user) {
    return <p className="text-muted">Tu dois être connecté pour accéder à ton espace compte.</p>;
  }

  if (loading) {
    return <p>Chargement des données...</p>;
  }

  if (error) {
    return <p className="text-error">{error}</p>;
  }

  return (
    <section className="page">
      <div>
        <h1 className="page-title">Espace compte</h1>
        <p className="page-subtitle">
          Bienvenue, <strong>{user.displayName || user.email}</strong>
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 980 }}>
        <div>
          <PointsSummary history={history} />
        </div>

        <div>
          <GamesHistoryTable history={history} />
        </div>
      </div>
    </section>
  );
}

export default AccountPage;
