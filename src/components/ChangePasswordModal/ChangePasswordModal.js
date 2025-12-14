import React, { useMemo, useState } from "react";
import "./ChangePasswordModal.css";
import { IoClose, IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";

function ChangePasswordModal({ onClose, onSuccess }) {
  const BACKEND_URL = useMemo(
    () => process.env.REACT_APP_BACKEND_URL || "http://localhost:5001",
    []
  );

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("Xác nhận mật khẩu không khớp");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Vui lòng đăng nhập");
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
        alert(data.error || "Đổi mật khẩu thất bại");
        return;
      }

      alert("Đổi mật khẩu thành công");
      onSuccess?.();
      onClose?.();
    } catch (err) {
      alert("Lỗi kết nối server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cpm-overlay" onClick={onClose}>
      <div className="cpm-modal" onClick={(e) => e.stopPropagation()}>
        <button className="cpm-close" onClick={onClose} type="button">
          <IoClose />
        </button>

        <h2 className="cpm-title">Đổi mật khẩu</h2>

        <form onSubmit={handleSubmit} className="cpm-form">
          <div className="cpm-field">
            <label>Mật khẩu hiện tại</label>
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
            <label>Mật khẩu mới</label>
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
            <label>Xác nhận mật khẩu mới</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button className="cpm-submit" type="submit" disabled={loading}>
            {loading ? "Đang đổi..." : "Đổi mật khẩu"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChangePasswordModal;
