const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "UNAUTHENTICATED", message: "Missing login token." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = payload; // { id, username, role }
    next();
  } catch (err) {
    return res.status(401).json({ error: "UNAUTHENTICATED", message: "Invalid or expired session, please log in again." });
  }
}

module.exports = { requireAuth };
