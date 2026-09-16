import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { apiErrorMessage } from "../lib/api";
import "./AdminDashboard.css";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "upload", label: "Upload roster" },
  { id: "participants", label: "Participants" },
  { id: "export", label: "Export" },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState("overview");
  const [authChecked, setAuthChecked] = useState(false);
  const username = localStorage.getItem("shield_admin_username");
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/admin/me")
      .then(() => setAuthChecked(true))
      .catch(() => navigate("/admin"));
  }, [navigate]);

  function logout() {
    localStorage.removeItem("shield_admin_token");
    localStorage.removeItem("shield_admin_username");
    navigate("/admin");
  }

  if (!authChecked) return null;

  return (
    <div className="dash">
      <aside className="dash__sidebar">
        <div className="dash__brand mono">SHIELD 2026</div>
        <nav className="dash__nav">
          {TABS.map((t) => (
            <button key={t.id} className={tab === t.id ? "is-active" : ""} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>
        <div className="dash__footer">
          <div className="mono dash__user">{username}</div>
          <button className="btn btn-ghost dash__logout" onClick={logout}>
            Log out
          </button>
        </div>
      </aside>

      <main className="dash__main">
        {tab === "overview" && <Overview />}
        {tab === "upload" && <UploadRoster />}
        {tab === "participants" && <Participants />}
        {tab === "export" && <Export />}
      </main>
    </div>
  );
}

function Overview() {
  const [today, setToday] = useState(null);
  const [all, setAll] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      const [todayRes, allRes] = await Promise.all([api.get("/attendance/today"), api.get("/attendance/all")]);
      setToday(todayRes.data);
      setAll(allRes.data);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (error) return <div className="alert alert-bad">{error}</div>;
  if (!today || !all) return <p>Loading…</p>;

  const pct = (present, total) => (total ? Math.round((present / total) * 100) : 0);

  return (
    <div className="overview">
      <div className="overview__head">
        <div>
          <h1>Day {today.day} — {today.date}</h1>
          <p>Current session: {today.currentSession} · {today.totalParticipants} registered participants</p>
        </div>
        <button className="btn btn-ghost" onClick={load}>
          Refresh
        </button>
      </div>

      <div className="overview__sessions">
        <SessionCard label="Morning session" stats={today.morning} total={today.totalParticipants} />
        <SessionCard label="Evening session" stats={today.evening} total={today.totalParticipants} />
      </div>

      <div className="panel overview__table">
        <div className="overview__table-title">5-day attendance breakdown (10 sessions total)</div>
        <table>
          <thead>
            <tr>
              <th>Day</th>
              <th>Morning present</th>
              <th>Morning absent</th>
              <th>Evening present</th>
              <th>Evening absent</th>
            </tr>
          </thead>
          <tbody>
            {all.perDay.map((d) => (
              <tr key={d.day}>
                <td className="mono">Day {d.day}</td>
                <td>{d.morning.present} <span className="overview__pct">({pct(d.morning.present, all.totalParticipants)}%)</span></td>
                <td>{d.morning.absent}</td>
                <td>{d.evening.present} <span className="overview__pct">({pct(d.evening.present, all.totalParticipants)}%)</span></td>
                <td>{d.evening.absent}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel overview__table">
        <div className="overview__table-title">
          Full check-in log ({all.totalCheckIns} of {all.totalPossibleCheckIns} possible check-ins)
        </div>
        <div className="overview__scroll">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>UID</th>
                <th>Day</th>
                <th>Session</th>
                <th>Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {all.records.map((r, i) => (
                <tr key={i}>
                  <td>{r.name}</td>
                  <td className="mono">{r.uid}</td>
                  <td>Day {r.day}</td>
                  <td>{r.session}</td>
                  <td className="mono">{new Date(r.checkInTime).toLocaleTimeString()}</td>
                  <td>
                    <span className={`badge ${r.status === "ON_TIME" ? "badge-ok" : "badge-late"}`}>{r.status}</span>
                  </td>
                </tr>
              ))}
              {all.records.length === 0 && (
                <tr>
                  <td colSpan={6} className="overview__empty">
                    No check-ins recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SessionCard({ label, stats, total }) {
  const pct = total ? Math.round((stats.present / total) * 100) : 0;
  return (
    <div className="panel session-card">
      <div className="session-card__label">{label}</div>
      <div className="session-card__big">{pct}%</div>
      <div className="session-card__bar">
        <div className="session-card__bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="session-card__nums">
        <span>Present {stats.present}</span>
        <span>Absent {stats.absent}</span>
      </div>
    </div>
  );
}

function UploadRoster() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await api.post("/admin/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(data);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="upload">
      <h1>Upload participant roster</h1>
      <p>
        CSV with columns <span className="mono">UID, Name, Email, Phone, Branch</span> (header names are
        case-insensitive). Existing UIDs are updated; new UIDs are added.
      </p>

      <form onSubmit={handleSubmit} className="upload__form panel">
        <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files[0])} />
        <button type="submit" className="btn btn-primary" disabled={!file || loading}>
          {loading ? "Uploading…" : "Upload CSV"}
        </button>
      </form>

      {error && <div className="alert alert-bad">{error}</div>}

      {result && (
        <div className="panel upload__result">
          <div className="alert alert-ok">
            Imported {result.totalRows} rows — {result.created} added, {result.updated} updated.
          </div>
          {result.errors.length > 0 && (
            <ul className="upload__errors">
              {result.errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function Participants() {
  const [participants, setParticipants] = useState([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    api
      .get("/admin/participants")
      .then((res) => setParticipants(res.data.participants))
      .catch((err) => setError(apiErrorMessage(err)));
  }, []);

  const filtered = participants.filter((p) => {
    const q = search.toLowerCase();
    return p.uid.toLowerCase().includes(q) || p.name.toLowerCase().includes(q) || p.branch?.toLowerCase().includes(q);
  });

  return (
    <div className="participants">
      <div className="overview__head">
        <h1>Participants ({participants.length})</h1>
        <input
          className="participants__search"
          placeholder="Search by UID, name or branch…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {error && <div className="alert alert-bad">{error}</div>}
      <div className="panel overview__table">
        <div className="overview__scroll">
          <table>
            <thead>
              <tr>
                <th>UID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Branch</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.uid}>
                  <td className="mono">{p.uid}</td>
                  <td>{p.name}</td>
                  <td className="mono">{p.email}</td>
                  <td className="mono">{p.phone}</td>
                  <td>{p.branch}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="overview__empty">
                    No participants found. Upload a roster to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Export() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleExport() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/attendance/export.csv", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "shield2026_attendance.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="upload">
      <h1>Export attendance</h1>
      <p>Download the full check-in log (all days, both sessions) as a CSV file.</p>
      {error && <div className="alert alert-bad">{error}</div>}
      <button className="btn btn-primary" onClick={handleExport} disabled={loading}>
        {loading ? "Preparing…" : "Download CSV"}
      </button>
    </div>
  );
}
