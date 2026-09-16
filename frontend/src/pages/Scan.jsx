import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import api, { apiErrorMessage } from "../lib/api";
import "./Scan.css";

const SCANNER_ELEMENT_ID = "shield-qr-reader";

export default function Scan() {
  const [token, setToken] = useState(() => localStorage.getItem("shield_admin_token"));
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const [sessionMode, setSessionMode] = useState("auto"); // auto | morning | evening
  const [lastResult, setLastResult] = useState(null); // { kind: 'ok'|'late'|'error', title, detail }
  const [log, setLog] = useState([]);
  const [cameraError, setCameraError] = useState("");

  const scannerRef = useRef(null);
  const lastScanRef = useRef({ text: "", at: 0 });

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError("");
    setLoggingIn(true);
    try {
      const { data } = await api.post("/admin/login", { username, password });
      localStorage.setItem("shield_admin_token", data.token);
      localStorage.setItem("shield_admin_username", data.username);
      setToken(data.token);
    } catch (err) {
      setLoginError(apiErrorMessage(err));
    } finally {
      setLoggingIn(false);
    }
  }

  useEffect(() => {
    if (!token) return;

    const html5Qrcode = new Html5Qrcode(SCANNER_ELEMENT_ID);
    scannerRef.current = html5Qrcode;
    let cancelled = false;

    html5Qrcode
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => onScan(decodedText)
      )
      .catch((err) => {
        if (!cancelled) setCameraError("Couldn't access the camera. Check browser permissions, or use a device with a camera.");
        console.error(err);
      });

    return () => {
      cancelled = true;
      html5Qrcode.stop().catch(() => {}).then(() => html5Qrcode.clear().catch(() => {}));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function onScan(decodedText) {
    const now = Date.now();
    // Debounce: ignore the same QR firing repeatedly while it's still in frame
    if (decodedText === lastScanRef.current.text && now - lastScanRef.current.at < 4000) return;
    lastScanRef.current = { text: decodedText, at: now };

    const body = { qrToken: decodedText };
    if (sessionMode !== "auto") body.session = sessionMode;

    try {
      const { data } = await api.post("/attendance/checkin", body);
      const isLate = data.status === "LATE";
      pushResult({
        kind: isLate ? "late" : "ok",
        title: isLate ? "Entry verified — late" : "Entry verified",
        detail: `${data.participant.name} · ${data.participant.uid} · Day ${data.day} (${data.session})`,
      });
    } catch (err) {
      const code = err?.response?.data?.error;
      const message = apiErrorMessage(err);
      const title =
        code === "ALREADY_CHECKED_IN"
          ? "Already checked in"
          : code === "INVALID_TICKET"
          ? "Invalid ticket"
          : code === "UNAUTHORIZED"
          ? "Unauthorized"
          : code === "OUTSIDE_EVENT_WINDOW"
          ? "Outside event window"
          : "Scan failed";
      pushResult({ kind: "error", title, detail: message });
    }
  }

  function pushResult(result) {
    setLastResult(result);
    setLog((prev) => [{ ...result, at: new Date() }, ...prev].slice(0, 8));
  }

  function logout() {
    localStorage.removeItem("shield_admin_token");
    localStorage.removeItem("shield_admin_username");
    setToken(null);
  }

  if (!token) {
    return (
      <div className="container form-page">
        <div className="panel form-card">
          <div className="form-card__eyebrow mono">ENTRY DESK</div>
          <h1 className="form-card__title">Volunteer / admin login</h1>
          <p className="form-card__lede">Log in to start scanning entry passes.</p>
          <form onSubmit={handleLogin} className="form-card__form">
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
            {loginError && <div className="alert alert-bad">{loginError}</div>}
            <button type="submit" className="btn btn-primary" disabled={loggingIn}>
              {loggingIn ? "Logging in…" : "Log in"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container scan">
      <div className="scan__header">
        <div>
          <div className="mono scan__eyebrow">ENTRY DESK</div>
          <h1>Scan to check in</h1>
        </div>
        <button className="btn btn-ghost" onClick={logout}>
          Log out
        </button>
      </div>

      <div className="scan__session">
        <span>Session:</span>
        {["auto", "morning", "evening"].map((m) => (
          <button
            key={m}
            className={`scan__session-btn${sessionMode === m ? " is-active" : ""}`}
            onClick={() => setSessionMode(m)}
          >
            {m === "auto" ? "Auto (by time)" : m[0].toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      <div className="scan__grid">
        <div className="scan__camera panel">
          <div className="scan__reticle" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
          <div id={SCANNER_ELEMENT_ID} className="scan__reader" />
          {cameraError && <div className="alert alert-bad scan__camera-error">{cameraError}</div>}
        </div>

        <div className="scan__side">
          {lastResult && (
            <div className={`scan__banner scan__banner--${lastResult.kind}`}>
              <div className="scan__banner-title">{lastResult.title}</div>
              <div className="scan__banner-detail">{lastResult.detail}</div>
            </div>
          )}

          <div className="panel scan__log">
            <div className="scan__log-title">Recent scans</div>
            {log.length === 0 && <p className="scan__log-empty">Nothing scanned yet.</p>}
            {log.map((item, i) => (
              <div key={i} className={`scan__log-row scan__log-row--${item.kind}`}>
                <span className="mono">{item.at.toLocaleTimeString()}</span>
                <span>{item.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
