import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { apiErrorMessage } from "../lib/api";
import TicketCard from "../components/TicketCard";
import "./MyTicket.css";

export default function MyTicket() {
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [manual, setManual] = useState({ uid: "", email: "" });

  useEffect(() => {
    const uid = sessionStorage.getItem("shield_uid");
    const email = sessionStorage.getItem("shield_email");
    if (uid && email) {
      fetchTicket(uid, email);
    } else {
      setLoading(false);
    }
  }, []);

  async function fetchTicket(uid, email) {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/generate-ticket", { uid, email });
      setTicket(data);
      sessionStorage.setItem("shield_uid", uid);
      sessionStorage.setItem("shield_email", email);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function handleManualSubmit(e) {
    e.preventDefault();
    fetchTicket(manual.uid, manual.email);
  }

  if (loading) {
    return (
      <div className="container myticket myticket--center">
        <p>Loading your pass…</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="container form-page">
        <div className="panel form-card">
          <div className="form-card__eyebrow mono">MY TICKET</div>
          <h1 className="form-card__title">Look up your pass</h1>
          <p className="form-card__lede">
            {error || "Enter your UID and registered email to view your digital entry pass."}
          </p>
          <form onSubmit={handleManualSubmit} className="form-card__form">
            <div className="field">
              <label htmlFor="uid">UID</label>
              <input
                id="uid"
                value={manual.uid}
                onChange={(e) => setManual((m) => ({ ...m, uid: e.target.value }))}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="email">Registered email</label>
              <input
                id="email"
                type="email"
                value={manual.email}
                onChange={(e) => setManual((m) => ({ ...m, email: e.target.value }))}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Find my pass
            </button>
          </form>
          <div className="form-card__footnote">
            <Link to="/verify">Haven't verified yet? Start here →</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container myticket">
      <div className="myticket__intro">
        <div className="mono myticket__eyebrow">YOUR PASS IS READY</div>
        <h1>Show this at entry, every day.</h1>
        <p>
          Save this page or take a screenshot — the same QR code works for all 5 days of SHIELD
          2026. Volunteers scan it once each morning and once each evening.
        </p>
      </div>
      <TicketCard ticket={ticket} />
    </div>
  );
}
