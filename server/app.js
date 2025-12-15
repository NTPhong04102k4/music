const express = require("express");
const cors = require("cors");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
require("dotenv").config();

const adminRoutes = require("./routes/admin");
const authRoutes = require("./routes/auth");
const configurePassport = require("./auth/passport");
const authenticateToken = require("./middleware/authenticateToken");
const { FRONTEND_URL, SESSION_SECRET, NODE_ENV } = require("./config");

const mediaRoutes = require("./routes/media");
const authLocalRoutes = require("./routes/authLocal");
const publicRoutes = require("./routes/public");
const userRoutes = require("./routes/user");
const billingRoutes = require("./routes/billing");

const app = express();

const corsOptions = {
  origin: (origin, cb) => {
    // Allow non-browser requests (no Origin) and relax CORS in development.
    if (!origin) return cb(null, true);
    if (NODE_ENV !== "production") return cb(null, true);

    // Production: only allow configured frontend origin
    return cb(null, origin === FRONTEND_URL);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// CORS must run before auth middleware; handle preflight early.
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());

// =======================================================
// SESSION + PASSPORT (OAUTH LOGIN)
// =======================================================
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: NODE_ENV === "production",
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());
configurePassport(passport);

// =======================================================
// STATIC
// =======================================================
app.use("/uploads", express.static(path.join(__dirname, "../public")));

// =======================================================
// ROUTES
// =======================================================
app.use("/api/auth", authRoutes);
app.use("/api/admin", authenticateToken, adminRoutes);

// Các API còn lại: mount vào /api để giữ nguyên endpoint cũ
app.use("/api", mediaRoutes);
app.use("/api", authLocalRoutes);
app.use("/api", publicRoutes);
app.use("/api", userRoutes);
app.use("/api", billingRoutes);

module.exports = app;
