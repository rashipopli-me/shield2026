const express = require("express");
const router = express.Router();
const Participant = require("../models/Participant");
const Ticket = require("../models/Ticket");
const { generateTicketId, generateQrToken, generateQrDataUrl } = require("../utils/ticket");

function ticketPublicView(ticket, participant) {
  return {
    ticketId: ticket.ticketId,
    qrCodeDataUrl: ticket.qrCodeDataUrl,
    issuedAt: ticket.issuedAt,
    participant: {
      uid: participant.uid,
      name: participant.name,
      branch: participant.branch,
    },
  };
}

// POST /api/verify
// Body: { uid, email }  -- matches against the uploaded roster
router.post("/verify", async (req, res) => {
  try {
    const uid = (req.body.uid || "").trim().toUpperCase();
    const email = (req.body.email || "").trim().toLowerCase();

    if (!uid || !email) {
      return res.status(400).json({ error: "MISSING_FIELDS", message: "Enter your UID and registered email." });
    }

    const participant = await Participant.findOne({ uid, email });
    if (!participant) {
      return res.status(404).json({
        error: "NOT_FOUND",
        message: "We couldn't match that UID and email against the registered participant list. Double-check both fields, or contact the organisers.",
      });
    }

    res.json({
      verified: true,
      participant: { uid: participant.uid, name: participant.name, branch: participant.branch },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "SERVER_ERROR", message: "Something went wrong verifying your details." });
  }
});

// POST /api/generate-ticket
// Body: { uid, email } -- verifies again, then issues (or returns existing) ticket
router.post("/generate-ticket", async (req, res) => {
  try {
    const uid = (req.body.uid || "").trim().toUpperCase();
    const email = (req.body.email || "").trim().toLowerCase();

    const participant = await Participant.findOne({ uid, email });
    if (!participant) {
      return res.status(404).json({
        error: "NOT_FOUND",
        message: "We couldn't match that UID and email against the registered participant list.",
      });
    }

    let ticket = await Ticket.findOne({ participant: participant._id });
    if (!ticket) {
      const ticketId = await generateTicketId();
      const qrToken = generateQrToken();
      const qrCodeDataUrl = await generateQrDataUrl(qrToken);
      ticket = await Ticket.create({ ticketId, qrToken, qrCodeDataUrl, participant: participant._id });
    }

    res.json(ticketPublicView(ticket, participant));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "SERVER_ERROR", message: "Something went wrong generating your ticket." });
  }
});

module.exports = router;
