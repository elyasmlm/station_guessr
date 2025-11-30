import { useState } from "react";

interface WinSummary {
  stationName: string;
  date: string;
  attempts: number;
  score: number;
  extraLines: number;
  cityRevealed: boolean;
}

interface WinModalProps {
  open: boolean;
  onClose: () => void;
  summary: WinSummary;
}

export default function WinModal({ open, onClose, summary }: WinModalProps) {
  const [copied, setCopied] = useState(false);
  const [showName, setShowName] = useState(false);

  if (!open) return null;

  // For sharing we intentionally mask the station name so the shared text
  // doesn't reveal the answer. The user can still reveal it locally with
  // the "Afficher le nom" button.
    const maskedName = '⚫⚫⚫⚫';
    const displayName = showName ? summary.stationName : maskedName;

    // The modalText mirrors exactly what is shown in the modal (so copy matches display)
    const modalText =
      `🎉👏 Bravo !\n\n` +
      `Station trouvée ${displayName} (${summary.date})\n` +
      `🧾 Essais: ${summary.attempts}\n` +
      `🏆 Score: ${summary.score}\n` +
      `🚏 Lignes dévoilées supplémentaires: ${summary.extraLines}\n` +
      `📍 Ville dévoilée: ${summary.cityRevealed ? 'oui' : 'non'}\n\n` +
      `💡 Tenter de jouer ? ${window.location.href}`;

  async function handleShare() {
    try {
      // Copy the exact modal text (masked or unmasked depending on showName)
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(modalText);
      } else {
        const ta = document.createElement("textarea");
        ta.value = modalText;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed", err);
      alert("Impossible de copier le message — copie manuelle requise.");
    }
  }

  return (
    <div className="win-overlay" role="dialog" aria-modal="true">
      <div className="win-modal card">
        <button onClick={onClose} className="win-close" aria-label="Fermer">×</button>
        <h2 className="win-title">🎉👏 Bravo !</h2>
        <p className="win-sub">Tu as trouvé <strong>{showName ? summary.stationName : '⚫⚫⚫⚫'}</strong> le {summary.date}.</p>

        <div className="win-controls">
          <button className="btn-ghost" onClick={() => setShowName((s) => !s)}>
            {showName ? 'Cacher le nom' : 'Afficher le nom'}
          </button>
        </div>

        <div className="win-stats">
          <p>🧾 <strong>Essais :</strong> {summary.attempts}</p>
          <p>🏆 <strong>Score :</strong> {summary.score}</p>
          <p>🚏 <strong>Lignes dévoilées supplémentaires :</strong> {summary.extraLines}</p>
          <p>📍 <strong>Ville dévoilée :</strong> {summary.cityRevealed ? 'oui' : 'non'}</p>
        </div>

        <div className="win-actions">
          <button className="btn btn-primary" onClick={handleShare}>
            {copied ? 'Copié !' : 'Copier le résultat'}
          </button>
          <button className="btn btn-secondary" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  );
}

// Styles are provided via CSS classes in this project; removed unused inline styles.
