const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema(
  {
    participant: { type: mongoose.Schema.Types.ObjectId, ref: "Participant", required: true },
    ticketId: { type: String, required: true },
    day: { type: Number, required: true }, // 1-5
    session: { type: String, enum: ["morning", "evening"], required: true }, // 2 per day
    date: { type: String, required: true }, // YYYY-MM-DD, event calendar date
    checkInTime: { type: Date, default: Date.now },
    status: { type: String, enum: ["ON_TIME", "LATE"], required: true },
    scannedBy: { type: String, default: "" }, // optional volunteer name/device label
  },
  { timestamps: true }
);

// A participant can only be checked in once per session per day
// (5 days x 2 sessions = 10 possible attendance records per participant)
AttendanceSchema.index({ participant: 1, day: 1, session: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", AttendanceSchema);
