const mongoose = require("mongoose");

const TicketSchema = new mongoose.Schema(
  {
    ticketId: { type: String, required: true, unique: true }, // e.g. SHIELD-0047, shown to humans
    qrToken: { type: String, required: true, unique: true }, // long random secret, this is what the QR actually encodes
    participant: { type: mongoose.Schema.Types.ObjectId, ref: "Participant", required: true, unique: true },
    qrCodeDataUrl: { type: String, required: true }, // base64 PNG, generated once at issue time
    issuedAt: { type: Date, default: Date.now },
    revoked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ticket", TicketSchema);
