const QRCode = require("qrcode");
const { v4: uuidv4 } = require("uuid");
const Ticket = require("../models/Ticket");

async function nextTicketNumber() {
  const count = await Ticket.countDocuments();
  return String(count + 1).padStart(4, "0");
}

async function generateTicketId() {
  const num = await nextTicketNumber();
  return `SHIELD-${num}`;
}

function generateQrToken() {
  // A long random secret, unrelated to the human-readable ticketId, so a QR
  // can't be guessed or forged just by knowing someone's ticket number.
  return uuidv4().replace(/-/g, "");
}

async function generateQrDataUrl(qrToken) {
  // The QR encodes only the opaque token; the scan endpoint looks it up server-side.
  return QRCode.toDataURL(qrToken, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 400,
    color: { dark: "#0F1420", light: "#FFFFFF" },
  });
}

module.exports = { generateTicketId, generateQrToken, generateQrDataUrl };
