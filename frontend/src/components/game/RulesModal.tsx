import { useState } from "react";

interface RulesModalProps {
  open: boolean;
  onClose: (dontShowAgain?: boolean) => void;
}

export default function RulesModal({ open, onClose }: RulesModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!open) return null;

  return (
    <div className="win-overlay" role="dialog" aria-modal="true">
      <div className="win-modal card">
        <button onClick={() => onClose(dontShowAgain)} className="win-close" aria-label="Fermer">×</button>
        <h2 className="win-title">Règles du jeu</h2>

        <div className="win-sub">
          Voici comment jouer :
        </div>

        <div className="win-stats">
          <p>• Devinez la station du jour en saisissant son nom.</p>
          <p>• Vous commencez avec 2 lignes dévoilées.</p>
          <p>• Tous les 3 essais vous pouvez demander à révéler une ligne supplémentaire (−10 pts).</p>
          <p>• Après 10 essais, vous pouvez révéler la ville/arrondissement (−100 pts).</p>
          <p>• Le score dépend du nombre d'essais, des lignes supplémentaires et si la ville est dévoilée.</p>
          <p>Bonne chance pour trouver la station du jour !</p>
        </div>

        <div className="win-actions" style={{ marginTop: 12 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
            />
            Ne plus afficher cette aide
          </label>

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button
              className="btn btn-primary"
              onClick={() => onClose(dontShowAgain)}
            >
              J'ai compris
            </button>
            <button className="btn btn-secondary" onClick={() => onClose(false)}>
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
