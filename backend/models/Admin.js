const mongoose = require("mongoose");

const AdminSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "volunteer"], default: "admin" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Admin", AdminSchema);
