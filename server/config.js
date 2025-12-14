const PORT = process.env.PORT || 5001;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const JWT_SECRET = process.env.JWT_SECRET;
const SESSION_SECRET = process.env.SESSION_SECRET;
const NODE_ENV = process.env.NODE_ENV || "development";
const BASE_URL = `http://localhost:${PORT}`;

module.exports = {
  PORT,
  FRONTEND_URL,
  JWT_SECRET,
  SESSION_SECRET,
  NODE_ENV,
  BASE_URL,
};
