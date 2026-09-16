// Usage: npm run seed-admin
// Reads DEFAULT_ADMIN_USERNAME / DEFAULT_ADMIN_PASSWORD from .env and creates
// (or updates the password of) that admin account.
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");

async function main() {
  const username = (process.env.DEFAULT_ADMIN_USERNAME || "admin").toLowerCase();
  const password = process.env.DEFAULT_ADMIN_PASSWORD;

  if (!password) {
    console.error("Set DEFAULT_ADMIN_PASSWORD in your .env file first.");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await Admin.findOneAndUpdate(
    { username },
    { username, passwordHash, role: "admin" },
    { upsert: true, new: true }
  );

  console.log(`Admin account ready -> username: "${admin.username}"`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
