const express = require("express");
const router = express.Router();
const multer = require("multer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { parse } = require("csv-parse/sync");
const Admin = require("../models/Admin");
const Participant = require("../models/Participant");
const { requireAuth } = require("../middleware/auth");

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });

// POST /api/admin/login
router.post("/login", async (req, res) => {
  try {
    const username = (req.body.username || "").trim().toLowerCase();
    const password = req.body.password || "";

    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({ error: "INVALID_CREDENTIALS", message: "Incorrect username or password." });
    }

    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "INVALID_CREDENTIALS", message: "Incorrect username or password." });
    }

    const token = jwt.sign({ id: admin._id, username: admin.username, role: admin.role }, process.env.JWT_SECRET, {
      expiresIn: "12h",
    });

    res.json({ token, username: admin.username, role: admin.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "SERVER_ERROR", message: "Something went wrong logging in." });
  }
});

// GET /api/admin/me
router.get("/me", requireAuth, (req, res) => {
  res.json({ username: req.admin.username, role: req.admin.role });
});

// POST /api/admin/upload  (multipart/form-data, field name "file")
// Accepts a CSV with headers: UID,Name,Email,Phone,Branch (case-insensitive)
router.post("/upload", requireAuth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "NO_FILE", message: "Attach a CSV file under the field name 'file'." });
    }

    const rows = parse(req.file.buffer.toString("utf-8"), {
      columns: (headers) => headers.map((h) => h.trim().toLowerCase()),
      skip_empty_lines: true,
      trim: true,
    });

    let created = 0;
    let updated = 0;
    const errors = [];

    for (const [i, row] of rows.entries()) {
      const uid = (row.uid || "").trim().toUpperCase();
      const name = (row.name || "").trim();
      const email = (row.email || "").trim().toLowerCase();
      const phone = (row.phone || "").trim();
      const branch = (row.branch || "").trim();

      if (!uid || !name || !email) {
        errors.push(`Row ${i + 2}: missing UID, Name, or Email - skipped.`);
        continue;
      }

      const result = await Participant.findOneAndUpdate(
        { uid },
        { uid, name, email, phone, branch },
        { upsert: true, new: true, rawResult: true }
      );

      if (result.lastErrorObject?.updatedExisting) updated++;
      else created++;
    }

    res.json({ created, updated, totalRows: rows.length, errors });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "IMPORT_FAILED", message: "Couldn't parse that CSV. Check it has UID,Name,Email,Phone,Branch columns." });
  }
});

// GET /api/admin/participants
router.get("/participants", requireAuth, async (req, res) => {
  const participants = await Participant.find({}).sort({ uid: 1 });
  res.json({ count: participants.length, participants });
});

module.exports = router;
