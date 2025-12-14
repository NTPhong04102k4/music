const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");

const router = express.Router();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-123";

function redirectWithToken(res, token) {
  // SPA không dùng react-router, nên redirect về root và để App.js đọc query param
  const url = `${FRONTEND_URL}/?oauth=1&token=${encodeURIComponent(token)}`;
  res.redirect(url);
}

// --- Google Routes ---
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${FRONTEND_URL}/?oauth=0&error=google`,
    session: true,
  }),
  (req, res) => {
    const u = req.user;
    const role = u?.VaiTro || "user";
    const token = jwt.sign(
      { userId: u.NguoiDungID, username: u.TenDangNhap, role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    redirectWithToken(res, token);
  }
);

// --- Facebook Routes ---
router.get(
  "/facebook",
  passport.authenticate("facebook", { scope: ["email"] })
);

router.get(
  "/facebook/callback",
  passport.authenticate("facebook", {
    failureRedirect: `${FRONTEND_URL}/?oauth=0&error=facebook`,
    session: true,
  }),
  (req, res) => {
    const u = req.user;
    const role = u?.VaiTro || "user";
    const token = jwt.sign(
      { userId: u.NguoiDungID, username: u.TenDangNhap, role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    redirectWithToken(res, token);
  }
);

// --- Logout session (nếu bạn muốn clear session Passport) ---
router.post("/logout", (req, res) => {
  req.logout?.(() => {});
  req.session?.destroy?.(() => {});
  res.json({ ok: true });
});

module.exports = router;
