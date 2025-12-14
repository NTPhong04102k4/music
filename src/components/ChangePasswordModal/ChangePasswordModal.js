import React, { useMemo, useState } from "react";
import "./ChangePasswordModal.css";
import { IoClose, IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import { useTranslation } from "react-i18next";

function ChangePasswordModal({ onClose, onSuccess }) {
  const BACKEND_URL = useMemo(
    () => process.env.REACT_APP_BACKEND_URL || "http://localhost:5001",
    []
  );
  const { t } = useTranslation();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert(t("changePassword.alerts.confirmMismatch"));
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert(t("changePassword.alerts.pleaseLogin"));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/user/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || t("changePassword.alerts.failed"));
        return;
      }

      alert(t("changePassword.alerts.success"));
      onSuccess?.();
      onClose?.();
    } catch (err) {
      alert(t("errors.serverConnection"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cpm-overlay" onClick={onClose}>
      <div className="cpm-modal" onClick={(e) => e.stopPropagation()}>
        <button
          className="cpm-close"
          onClick={onClose}
          type="button"
          aria-label={t("common.close")}
        >
          <IoClose />
        </button>

        <h2 className="cpm-title">{t("changePassword.title")}</h2>

        <form onSubmit={handleSubmit} className="cpm-form">
          <div className="cpm-field">
            <label>{t("changePassword.currentPassword")}</label>
            <div className="cpm-input-row">
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="cpm-eye"
                onClick={() => setShowCurrent((v) => !v)}
              >
                {showCurrent ? <IoEyeOutline /> : <IoEyeOffOutline />}
              </button>
            </div>
          </div>

          <div className="cpm-field">
            <label>{t("changePassword.newPassword")}</label>
            <div className="cpm-input-row">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="cpm-eye"
                onClick={() => setShowNew((v) => !v)}
              >
                {showNew ? <IoEyeOutline /> : <IoEyeOffOutline />}
              </button>
            </div>
          </div>

          <div className="cpm-field">
            <label>{t("changePassword.confirmNewPassword")}</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button className="cpm-submit" type="submit" disabled={loading}>
            {loading
              ? t("changePassword.submitting")
              : t("changePassword.submit")}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChangePasswordModal;
