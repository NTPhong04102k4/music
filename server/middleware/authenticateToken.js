const jwt = require("jsonwebtoken");

module.exports = function authenticateToken(req, res, next) {
  // Allow CORS preflight requests to pass through without auth.
  if (req.method === "OPTIONS") return next();

  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Thiếu token xác thực" });
  }

  const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-123";

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res
        .status(403)
        .json({ error: "Token không hợp lệ hoặc đã hết hạn" });
    }
    req.user = user;
    next();
  });
};
