import { useEffect, useState } from "react";

const DISPLAY_NAME_KEY = "metroGuessDisplayName";

interface ProfileInfoProps {
  userId: string;
}

function ProfileInfo({ userId }: ProfileInfoProps) {
  const [displayName, setDisplayName] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const existing = window.localStorage.getItem(DISPLAY_NAME_KEY);
    if (existing) {
      setDisplayName(existing);
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DISPLAY_NAME_KEY, displayName.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }
  };

  return (
    <section
      style={{
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "1rem",
        maxWidth: "500px",
      }}
    >
      <h2>Infos perso</h2>

      <form onSubmit={handleSave} style={{ display: "grid", gap: "0.5rem" }}>
        <label style={{ display: "grid", gap: "0.25rem" }}>
          <span>Pseudo</span>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Choisis un pseudo..."
            style={{
              padding: "0.4rem 0.6rem",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
        </label>

        <button
          type="submit"
          style={{
            marginTop: "0.5rem",
            padding: "0.4rem 0.8rem",
            borderRadius: "4px",
            border: "none",
            background: "#007bff",
            color: "white",
            cursor: "pointer",
            width: "fit-content",
          }}
        >
          Enregistrer
        </button>

        {saved && (
          <span style={{ color: "green", fontSize: "0.9rem" }}>
            Pseudo enregistré.
          </span>
        )}
      </form>

      <p style={{ marginTop: "1rem", fontSize: "0.85rem", color: "#666" }}>
        <strong>ID local (technique) :</strong> {userId}
        <br />
        (utilisé pour suivre tes parties sur cet appareil)
      </p>
    </section>
  );
}

export default ProfileInfo;
