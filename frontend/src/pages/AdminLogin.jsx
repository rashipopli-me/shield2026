import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { apiErrorMessage } from "../lib/api";
import "./FormPage.css";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/admin/login", { username, password });
      localStorage.setItem("shield_admin_token", data.token);
      localStorage.setItem("shield_admin_username", data.username);
      navigate("/admin/dashboard");
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container form-page">
      <div className="panel form-card">
        <div className="form-card__eyebrow mono">ADMIN</div>
        <h1 className="form-card__title">Dashboard login</h1>
        <p className="form-card__lede">Log in to manage the roster and view attendance.</p>
        <form onSubmit={handleSubmit} className="form-card__form">
          <div className="field">
            <label htmlFor="username">Username</label>
            <input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="alert alert-bad">{error}</div>}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Logging in…" : "Log in"}
          </button>
        </form>
      </div>
    </div>
  );
}
