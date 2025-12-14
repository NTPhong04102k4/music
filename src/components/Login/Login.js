import React, { useState } from "react";
import "./Login.css"; // Đảm bảo bạn dùng đúng file CSS (Login.css hoặc AuthModal.css)
import { IoClose, IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import { FaFacebookF, FaGoogle } from "react-icons/fa";
import { useTranslation } from "react-i18next";

function Login({ onClose, onLoginSuccess }) {
  const BACKEND_URL =
    process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";
  const { t } = useTranslation();
  // State quản lý chế độ: false = Đăng nhập, true = Đăng ký
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Data
  const [email, setEmail] = useState(""); // Dùng chung cho login (làm username) và register
  const [username, setUsername] = useState(""); // Chỉ dùng cho register
  const [fullName, setFullName] = useState(""); // Chỉ dùng cho register
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // Chỉ dùng cho register

  const [agreeTerms, setAgreeTerms] = useState(false);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setUsername("");
    setFullName("");
    setConfirmPassword("");
    setAgreeTerms(false);
    setShowPassword(false);
  };

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    resetForm();
  };

  const handleLogin = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }), // 'email' ở đây là input username/email
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        if (onLoginSuccess) onLoginSuccess(data.user);
        else onClose();
      } else {
        alert(data.error || t("auth.alerts.loginFailed"));
      }
    } catch (error) {
      alert(t("errors.serverConnection"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      alert(t("auth.alerts.passwordConfirmMismatch"));
      return;
    }
    if (!agreeTerms) {
      alert(t("auth.alerts.mustAgreeTerms"));
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email,
          password,
          displayName: fullName,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        alert(t("auth.alerts.registerSuccess"));
        setIsRegisterMode(false); // Chuyển về trang đăng nhập
        resetForm();
      } else {
        alert(data.error || t("auth.alerts.registerFailed"));
      }
    } catch (error) {
      alert(t("errors.serverConnection"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isRegisterMode) {
      handleRegister();
    } else {
      handleLogin();
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${BACKEND_URL}/api/auth/google`;
  };

  const handleFacebookLogin = () => {
    window.location.href = `${BACKEND_URL}/api/auth/facebook`;
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div
        className="auth-modal-content"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="auth-close-btn" onClick={onClose}>
          <IoClose />
        </button>

        <h2>
          {isRegisterMode ? t("auth.titleRegister") : t("auth.titleLogin")}
        </h2>

        <form onSubmit={handleSubmit}>
          {/* === FORM ĐĂNG NHẬP === */}
          {!isRegisterMode && (
            <>
              <div className="auth-input-group">
                <input
                  type="text"
                  placeholder={t("auth.emailOrUsernamePlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="auth-input-group password-group">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder={t("auth.passwordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  aria-label={
                    showPassword ? t("common.hide") : t("common.show")
                  }
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <IoEyeOutline /> : <IoEyeOffOutline />}
                </button>
              </div>

              <div className="auth-options">
                <label className="auth-checkbox-container">
                  <input type="checkbox" />
                  <span className="auth-checkmark"></span>
                  {t("auth.rememberMe")}
                </label>
                <button type="button" className="forgot-password">
                  {t("auth.forgotPassword")}
                </button>
              </div>
            </>
          )}

          {/* === FORM ĐĂNG KÝ === */}
          {isRegisterMode && (
            <>
              <div className="auth-input-group">
                <input
                  type="text"
                  placeholder={t("auth.register.usernamePlaceholder")}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="auth-input-group">
                <input
                  type="text"
                  placeholder={t("auth.register.fullNamePlaceholder")}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className="auth-input-group">
                <input
                  type="email"
                  placeholder={t("auth.register.emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="auth-input-group password-group">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder={t("auth.register.passwordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="auth-input-group password-group">
                <input
                  type="password"
                  placeholder={t("auth.register.confirmPasswordPlaceholder")}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <div className="auth-options">
                <label className="auth-checkbox-container">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                  />
                  <span className="auth-checkmark"></span>
                  {t("auth.register.agreeTerms")}
                </label>
              </div>
            </>
          )}

          {/* Nút Submit */}
          <button
            type="submit"
            className="auth-submit-btn"
            disabled={isSubmitting}
          >
            {isRegisterMode ? t("auth.submitRegister") : t("auth.submitLogin")}
          </button>
        </form>

        <div className="auth-divider">
          <span>{t("common.or")}</span>
        </div>

        {/* Social Login chỉ hiện khi Đăng nhập cho gọn */}
        {!isRegisterMode && (
          <div className="auth-social-buttons">
            <button
              className="auth-social-btn facebook"
              type="button"
              onClick={handleFacebookLogin}
              disabled={isSubmitting}
            >
              <FaFacebookF /> Facebook
            </button>
            <button
              className="auth-social-btn google"
              type="button"
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
            >
              <FaGoogle /> Google
            </button>
          </div>
        )}

        {/* Nút Chuyển đổi Chế độ */}
        <div className="auth-footer-switch">
          {isRegisterMode ? (
            <p>
              {t("auth.haveAccount")}{" "}
              <span onClick={toggleMode}>{t("auth.switchToLogin")}</span>
            </p>
          ) : (
            <p>
              {t("auth.noAccount")}{" "}
              <span onClick={toggleMode}>{t("auth.switchToRegister")}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;
