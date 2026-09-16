require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const participantRoutes = require("./routes/participants");
const attendanceRoutes = require("./routes/attendance");
const adminRoutes = require("./routes/admin");

const app = express();

app.use(cors()); // for local dev; tighten this to CLIENT_URL only in production if you like
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true, service: "SHIELD 2026 API" }));

app.use("/api", participantRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/admin", adminRoutes);

// Serve the built React frontend if it's present (single-server deployment).
const frontendDist = path.join(__dirname, "public");
app.use(express.static(frontendDist));
app.get(/^\/(?!api).*/, (req, res, next) => {
  res.sendFile(path.join(frontendDist, "index.html"), (err) => {
    if (err) next();
  });
});

// Fallback JSON 404 for anything under /api that didn't match
app.use("/api", (req, res) => res.status(404).json({ error: "NOT_FOUND", message: "No such API route." }));

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`SHIELD 2026 API listening on port ${PORT}`));
});
