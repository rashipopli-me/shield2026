const mongoose = require("mongoose");

const ParticipantSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true, unique: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    branch: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Participant", ParticipantSchema);
