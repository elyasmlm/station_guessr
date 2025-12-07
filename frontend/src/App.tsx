import { Link, useNavigate } from "react-router-dom";
import { AppRoutes } from "./router";
import { useAuth } from "./context/AuthContext";

function App() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-inner">
          <div className="brand">
            <div className="brand-logo" />
            <div>
              <div className="brand-title">Station Guessr</div>
              <div className="brand-sub">Jeu quotidien Metro / RER / Tram</div>
            </div>
          </div>

          <nav className="app-nav">
            <div className="app-nav-links">
              <Link to="/" className="nav-link">
                Jeu du jour
              </Link>
              <Link to="/history" className="nav-link">
                Anciens jours
              </Link>
              <Link to="/leaderboard" className="nav-link">
                Classement
              </Link>
              {user && (
                <Link to="/account" className="nav-link nav-link-primary">
                  Mon compte
                </Link>
              )}
            </div>

            <div className="app-user">
              {loading ? (
                <span className="text-muted">Chargement...</span>
              ) : user ? (
                <>
                  <span className="app-user-name">
                    {user.displayName || user.email}
                  </span>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={handleLogoutClick}
                  >
                    Déconnexion
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="nav-link">
                    Connexion
                  </Link>
                  <Link to="/register" className="nav-link nav-link-primary">
                    Inscription
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>

      <main className="app-main">
        <div className="app-main-inner">
          <AppRoutes />
        </div>
      </main>
    </div>
  );
}

export default App;
