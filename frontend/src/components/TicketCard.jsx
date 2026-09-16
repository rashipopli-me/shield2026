import "./TicketCard.css";

export default function TicketCard({ ticket, tilt = false }) {
  const { ticketId, qrCodeDataUrl, participant } = ticket;

  return (
    <div className={`ticket-card${tilt ? " ticket-card--tilt" : ""}`}>
      <div className="ticket-card__top">
        <div>
          <div className="ticket-card__eventname">SHIELD 2026</div>
          <div className="ticket-card__tagline">Secure Systems through Hunting Infrastructure Engineering</div>
        </div>
        <div className="ticket-card__badge">DIGITAL ENTRY PASS</div>
      </div>

      <div className="ticket-card__body">
        <div className="ticket-card__identity">
          <div className="ticket-card__name">{participant.name}</div>
          <div className="ticket-card__meta mono">
            UID {participant.uid} · {participant.branch}
          </div>
        </div>
        <img className="ticket-card__qr" src={qrCodeDataUrl} alt={`QR code for ticket ${ticketId}`} />
      </div>

      <div className="ticket-card__perforation" aria-hidden="true">
        {Array.from({ length: 24 }).map((_, i) => (
          <span key={i} />
        ))}
      </div>

      <div className="ticket-card__bottom">
        <div className="mono">TICKET {ticketId}</div>
        <div>21–25 Sep 2026 · Chandigarh University</div>
      </div>
    </div>
  );
}
