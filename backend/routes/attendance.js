const express = require("express"); 
const router = express.Router(); 
const Ticket = require("../models/Ticket"); 
const Attendance = require("../models/Attendance"); 
const Participant = require("../models/Participant"); 
const { requireAuth } = require("../middleware/auth"); 
const { getEventDayForDate, getCurrentSession, classifyCheckInTime } = require("../utils/eventDay"); 
 
const SESSION_LABEL = { morning: "Morning", evening: "Evening" }; 
 
// POST /api/attendance/checkin 
// Body: { qrToken, scannedBy?, session? } 
// `session` can be forced to "morning" | "evening" by the scan page (useful if 
// a volunteer is catching stragglers just after the automatic cutover); if 
// omitted, the server works it out from the current clock time. 
// Requires a logged-in volunteer/admin session (the /scan page). 
router.post("/checkin", requireAuth, async (req, res) => { 
  try { 
    const qrToken = (req.body.qrToken || "").trim(); 
    const scannedBy = req.body.scannedBy || req.admin.username; 
    const forcedSession = ["morning", "evening"].includes(req.body.session) ? req.body.session : null; 
 
    if (!qrToken) { 
      return res.status(400).json({ error: "MISSING_TOKEN", message: "No QR data received." }); 
    } 
 
    const ticket = await Ticket.findOne({ qrToken }).populate("participant"); 
 
    if (!ticket) { 
      return res.status(404).json({ error: "INVALID_TICKET", message: "This QR code doesn't match any issued ticket." }); 
    } 
    if (ticket.revoked) { 
      return res.status(403).json({ error: "REVOKED", message: "This ticket has been revoked." }); 
    } 
    if (!ticket.participant) { 
      return res.status(409).json({ error: "UNAUTHORIZED", message: "This ticket isn't linked to a registered participant." }); 
    } 
 
    const { day, date, withinEventWindow } = getEventDayForDate(); 
    if (!withinEventWindow) { 
      return res.status(409).json({ 
        error: "OUTSIDE_EVENT_WINDOW", 
        message: "Today isn't within the configured bootcamp dates. Check EVENT_START_DATE / EVENT_DAYS in the server config.", 
      }); 
    } 
 
    const session = forcedSession || getCurrentSession(); 
 
    const existing = await Attendance.findOne({ participant: ticket.participant._id, day, session }); 
    if (existing) { 
      return res.status(409).json({ 
        error: "ALREADY_CHECKED_IN", 
        message: `Already checked in for Day ${day} (${SESSION_LABEL[session]}) at ${existing.checkInTime.toLocaleTimeString()}.`, 
        attendance: existing, 
      }); 
    } 
 
    const status = classifyCheckInTime(session); 
    const attendance = await Attendance.create({ 
      participant: ticket.participant._id, 
      ticketId: ticket.ticketId, 
      day, 
      session, 
      date, 
      status, 
      scannedBy, 
    }); 
 
    res.json({ 
      verified: true, 
      status, 
      day, 
      session, 
      participant: { 
        uid: ticket.participant.uid, 
        name: ticket.participant.name, 
        branch: ticket.participant.branch, 
      }, 
      checkInTime: attendance.checkInTime, 
    }); 
  } catch (err) { 
    if (err.code === 11000) { 
      return res.status(409).json({ error: "ALREADY_CHECKED_IN", message: "Already checked in for this session." }); 
    } 
    console.error(err); 
    res.status(500).json({ error: "SERVER_ERROR", message: "Something went wrong recording attendance." }); 
  } 
}); 
 
// GET /api/attendance/today 
router.get("/today", requireAuth, async (req, res) => { 
  const { day, date } = getEventDayForDate(); 
  const currentSession = getCurrentSession(); 
  const totalParticipants = await Participant.countDocuments(); 
 
  const [morningRecords, eveningRecords] = await Promise.all([ 
    Attendance.find({ day, session: "morning" }).populate("participant").sort({ checkInTime: -1 }), 
    Attendance.find({ day, session: "evening" }).populate("participant").sort({ checkInTime: -1 }), 
  ]); 
 
  const shape = (records) => ({ 
    present: records.length, 
    absent: Math.max(totalParticipants - records.length, 0), 
    records: records.map((r) => ({ 
      name: r.participant?.name, 
      uid: r.participant?.uid, 
      branch: r.participant?.branch, 
      checkInTime: r.checkInTime, 
      status: r.status, 
    })), 
  }); 
 
  res.json({ 
    day, 
    date, 
    currentSession, 
    totalParticipants, 
    morning: shape(morningRecords), 
    evening: shape(eveningRecords), 
  }); 
}); 
 
// GET /api/attendance/all 
router.get("/all", requireAuth, async (req, res) => { 
  const totalParticipants = await Participant.countDocuments(); 
  const totalDays = Number(process.env.EVENT_DAYS || 5); 
 
  const perDay = []; 
  for (let day = 1; day <= totalDays; day++) { 
    const morning = await Attendance.countDocuments({ day, session: "morning" }); 
    const evening = await Attendance.countDocuments({ day, session: "evening" }); 
    perDay.push({ 
      day, 
      morning: { present: morning, absent: Math.max(totalParticipants - morning, 0) }, 
      evening: { present: evening, absent: Math.max(totalParticipants - evening, 0) }, 
    }); 
  } 
 
  const totalSessions = totalDays * 2; 
  const totalPossibleCheckIns = totalParticipants * totalSessions; 
  const totalCheckIns = await Attendance.countDocuments(); 
 
  const records = await Attendance.find({}).populate("participant").sort({ day: 1, session: 1, checkInTime: 1 }); 
 
  res.json({ 
    totalParticipants, 
    totalDays, 
    totalSessions, 
    totalCheckIns, 
    totalPossibleCheckIns, 
    perDay, 
    records: records.map((r) => ({ 
      name: r.participant?.name, 
      uid: r.participant?.uid, 
      branch: r.participant?.branch, 
      day: r.day, 
      session: r.session, 
      date: r.date, 
      checkInTime: r.checkInTime, 
      status: r.status, 
    })), 
  }); 
}); 
 
// GET /api/attendance/export.csv 
router.get("/export.csv", requireAuth, async (req, res) => { 
  const records = await Attendance.find({}) 
    .populate("participant") 
    .sort({ day: 1, session: 1, checkInTime: 1 }); 

  const header = "UID,Name,Official Email,Phone Number,Branch,Day,Session,Date,CheckInTime,Status\n"; 

  const rows = records 
    .map((r) => 
      [ 
        r.participant?.uid || "", 
        r.participant?.name || "", 
        r.participant?.email || "", 
        r.participant?.phone || "", 
        r.participant?.branch || "", 
        r.day, 
        r.session, 
        r.date, 
        new Date(r.checkInTime).toISOString(), 
        r.status, 
      ] 
        .map((v) => `"${String(v).replace(/"/g, '""')}"`) 
        .join(",") 
    ) 
    .join("\n"); 
 
  res.setHeader("Content-Type", "text/csv"); 
  res.setHeader("Content-Disposition", "attachment; filename=shield2026_attendance.csv"); 
  res.send(header + rows); 
}); 
 
module.exports = router; 