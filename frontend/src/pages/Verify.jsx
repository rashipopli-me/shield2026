import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { apiErrorMessage } from "../lib/api";
import "./FormPage.css";

export default function Verify() {
  const [uid, setUid] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/generate-ticket", { uid, email });
      // Ticket is issued (or already existed) - hand off to My Ticket, which
      // re-fetches it using the same UID + email.
      sessionStorage.setItem("shield_uid", uid);
      sessionStorage.setItem("shield_email", email);
      navigate("/my-ticket");
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container form-page">
      <div className="panel form-card">
        <div className="form-card__eyebrow mono">STEP 1 OF 2</div>
        <h1 className="form-card__title">Verify your details</h1>
        <p className="form-card__lede">
          Enter the UID and email you registered with. We'll check it against the SHIELD 2026
          participant list and issue your digital pass.
        </p>

        <form onSubmit={handleSubmit} className="form-card__form">
          <div className="field">
            <label htmlFor="uid">UID</label>
            <input
              id="uid"
              placeholder="24BDA001"
              value={uid}
              onChange={(e) => setUid(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="field">
            <label htmlFor="email">Registered email</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {error && <div className="alert alert-bad">{error}</div>}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Checking…" : "Verify & get my pass"}
          </button>
        </form>
      </div>
    </div>
  );
}
