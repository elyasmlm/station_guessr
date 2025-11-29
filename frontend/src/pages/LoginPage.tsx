import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await login(email, password);
      navigate("/");
    } catch (e: any) {
      console.error(e);
      setError("Connexion impossible. Vérifie tes identifiants.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page" style={{ maxWidth: "420px", margin: "0 auto" }}>
      <div className="card card-soft">
        <div className="card-header">
          <h1 className="page-title" style={{ fontSize: "1.3rem" }}>
            Connexion
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
            <span>Mot de passe</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {error && <p className="text-error">{error}</p>}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </section>
  );

}

export default LoginPage;
