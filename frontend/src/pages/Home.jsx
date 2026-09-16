import { Link } from "react-router-dom";
import "./Home.css";

const SAMPLE_TICKET = {
  ticketId: "SHIELD-0047",
  participant: { name: "Rashi Popli", uid: "24BDA70367", branch: "CSE – Data Science" },
  qrCodeDataUrl:
    "data:image/svg+xml;base64," +
    btoa(
      `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="#fff"/>${Array.from(
        { length: 100 }
      )
        .map(
          () =>
            `<rect x="${Math.floor(Math.random() * 20) * 10}" y="${Math.floor(Math.random() * 20) * 10}" width="10" height="10" fill="#0d1220"/>`
        )
        .join("")}</svg>`
    ),
};

export default function Home() {
  return (
    <div className="home">
      <section className="container home__hero">
        <div className="home__copy">
          <div className="home__eventline mono">21–25 SEP 2026 · CHANDIGARH UNIVERSITY</div>
          <h1 className="home__title">
            One QR gets you
            <br />
            into every day of SHIELD.
          </h1>
          <p className="home__lede">
            SHIELD 2026 is a 5-day cybersecurity bootcamp for 100 registered participants. Verify
            your details once, get your digital pass, and show it at the door each morning —
            attendance is recorded the moment it's scanned.
          </p>
          <div className="home__actions">
            <Link to="/verify" className="btn btn-primary">
              Get my pass
            </Link>
            <Link to="/scan" className="btn btn-ghost">
              I'm scanning entries
            </Link>
          </div>
          <div className="home__steps">
            <div>
              <span className="mono">01</span> Enter your UID + registered email
            </div>
            <div>
              <span className="mono">02</span> Your pass is generated instantly
            </div>
            <div>
              <span className="mono">03</span> Show the QR at entry, every day
            </div>
          </div>
        </div>

        <div className="home__ticketwrap">
          <TicketPreview />
        </div>
      </section>
    </div>
  );
}

// Lightweight inline preview so the homepage doesn't need to import the full
// TicketCard styling for what's essentially decorative content.
function TicketPreview() {
  return (
    <div className="home__ticketcard">
      <div className="home__ticketcard__top">
        <div>
          <div className="home__ticketcard__name-label mono">DIGITAL ENTRY PASS</div>
          <div className="home__ticketcard__name">{SAMPLE_TICKET.participant.name}</div>
          <div className="mono home__ticketcard__uid">UID {SAMPLE_TICKET.participant.uid}</div>
        </div>
      </div>
      <img className="home__ticketcard__qr" src={SAMPLE_TICKET.qrCodeDataUrl} alt="" aria-hidden="true" />
      <div className="home__ticketcard__foot mono">TICKET {SAMPLE_TICKET.ticketId}</div>
    </div>
  );
}
