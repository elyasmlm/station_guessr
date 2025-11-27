// frontend/src/pages/RegisterPage.tsx
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (password !== password2) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await register(email, password, displayName || undefined);
      navigate("/");
    } catch (e: any) {
      console.error(e);
      setError("Inscription impossible (email déjà utilisé ?)");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page" style={{ maxWidth: "420px", margin: "0 auto" }}>
      <div className="card card-soft">
        <div className="card-header">
          <h1 className="page-title" style={{ fontSize: "1.3rem" }}>
            Créer un compte
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="form-grid">
          <label className="form-label">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="form-label">
            <span>Pseudo (optionnel)</span>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </label>

          <label className="form-label">
            <span>Mot de passe</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <label className="form-label">
            <span>Confirmation du mot de passe</span>
            <input
              type="password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              required
            />
          </label>

          {error && <p className="text-error">{error}</p>}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? "Inscription..." : "S'inscrire"}
          </button>
        </form>
      </div>
    </section>
  );
}

export default RegisterPage;
