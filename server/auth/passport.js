const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const bcrypt = require("bcrypt");
const pool = require("../db");

async function safeInsertOAuthUser({ provider, profile, email, displayName }) {
  const baseUsername = `${provider}_${profile.id}`.toLowerCase();
  const passwordHash = await bcrypt.hash(
    `oauth:${provider}:${profile.id}:${Date.now()}`,
    10
  );

  // Username phải unique, nên nếu trùng thì gắn suffix
  let username = baseUsername;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const [result] = await pool.execute(
        "INSERT INTO nguoidung (TenDangNhap, Email, MatKhau, VaiTro, TenHienThi, AnhDaiDien, TrangThai, NgayThamGia) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())",
        [
          username,
          email || null,
          passwordHash,
          "user",
          displayName || username,
          null,
          "active",
        ]
      );

      const [rows] = await pool.execute(
        "SELECT * FROM nguoidung WHERE NguoiDungID = ? LIMIT 1",
        [result.insertId]
      );
      return rows[0];
    } catch (e) {
      // Duplicate username/email -> thử username khác
      username = `${baseUsername}_${Date.now().toString().slice(-6)}`;
      if (attempt === 2) throw e;
    }
  }
}

async function findOrCreateUserFromOAuth(provider, profile) {
  const emails = Array.isArray(profile.emails) ? profile.emails : [];

  const email = emails[0]?.value || null;
  const displayName = profile.displayName || profile.username || null;

  if (email) {
    const [existing] = await pool.execute(
      "SELECT * FROM nguoidung WHERE Email = ? LIMIT 1",
      [email]
    );
    if (existing.length > 0) return existing[0];
  }

  // Nếu không có email (Facebook đôi khi không trả), vẫn tạo user theo provider_id
  return await safeInsertOAuthUser({
    provider,
    profile,
    email,
    displayName,
  });
}

module.exports = function configurePassport(passport) {
  passport.serializeUser((user, done) => {
    done(null, user.NguoiDungID);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const [rows] = await pool.execute(
        "SELECT * FROM nguoidung WHERE NguoiDungID = ? LIMIT 1",
        [id]
      );
      if (rows.length === 0) return done(null, false);
      return done(null, rows[0]);
    } catch (e) {
      return done(e);
    }
  });

  const googleClientID = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (googleClientID && googleClientSecret) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: googleClientID,
          clientSecret: googleClientSecret,
          callbackURL:
            process.env.GOOGLE_CALLBACK_URL ||
            "http://localhost:5001/api/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const user = await findOrCreateUserFromOAuth("google", profile);
            return done(null, user);
          } catch (e) {
            return done(e);
          }
        }
      )
    );
  } else {
    // eslint-disable-next-line no-console
    console.warn('');
  }

  const facebookAppId = process.env.FACEBOOK_APP_ID;
  const facebookAppSecret = process.env.FACEBOOK_APP_SECRET;
  if (facebookAppId && facebookAppSecret) {
    passport.use(
      new FacebookStrategy(
        {
          clientID: facebookAppId,
          clientSecret: facebookAppSecret,
          callbackURL:
            process.env.FACEBOOK_CALLBACK_URL ||
            "http://localhost:5001/api/auth/facebook/callback",
          profileFields: ["id", "displayName", "emails", "photos"],
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const user = await findOrCreateUserFromOAuth("facebook", profile);
            return done(null, user);
          } catch (e) {
            return done(e);
          }
        }
      )
    );
  } else {
    // eslint-disable-next-line no-console
    console.warn(
      "[passport] FACEBOOK_APP_ID/FACEBOOK_APP_SECRET chưa được cấu hình -> bỏ qua FacebookStrategy"
    );
  }
};
