import React, { useState, useRef, useEffect } from "react";
import "./UserMenu.css";
import { useTranslation } from "react-i18next";
import {
  IoPersonCircleOutline,
  IoLogOutOutline,
  IoKeyOutline,
  IoPersonOutline,
  IoLogInOutline,
  IoPersonAddOutline,
  IoReceiptOutline,
} from "react-icons/io5";

// === SỬA: Đã thêm 'onChangePassword' vào danh sách props ===
function UserMenu({
  user,
  isLoggedIn,
  onLogin,
  onLogout,
  onChangePassword,
  onViewProfile,
  onViewInvoices,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const { t } = useTranslation();

  // Đóng menu khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuRef]);

  const toggleMenu = () => setIsOpen(!isOpen);

  const usernameLower = (user?.username || "").toLowerCase();
  const isSocialLogin =
    usernameLower.includes("google") || usernameLower.includes("facebook");
  const canChangePassword =
    isLoggedIn && user?.role === "user" && !isSocialLogin;

  return (
    <div className="user-menu-container" ref={menuRef}>
      {/* Nút Avatar / Icon Người dùng */}
      <button className="user-avatar-btn" onClick={toggleMenu}>
        {isLoggedIn && user ? (
          <figure className="image is-38x38 is-rounded">
            <img
              src={
                user.avatar ||
                "https://zmdjs.zmdcdn.me/zmp3-desktop/v1.17.3/static/media/user-default.3ff115bb.png"
              }
              alt={user.displayName || user.username}
            />
          </figure>
        ) : (
          <div className="default-avatar">
            <IoPersonCircleOutline />
          </div>
        )}
      </button>

      {/* Menu Thả Xuống */}
      {isOpen && (
        <div className="user-dropdown">
          {isLoggedIn ? (
            // === MENU KHI ĐÃ ĐĂNG NHẬP ===
            <>
              <div className="user-info-header">
                <img
                  src={
                    user.avatar ||
                    "https://zmdjs.zmdcdn.me/zmp3-desktop/v1.17.3/static/media/user-default.3ff115bb.png"
                  }
                  alt={t("userMenu.avatarAlt")}
                  className="menu-avatar"
                />
                <div className="user-details">
                  <span className="user-name">
                    {user.displayName || user.username}
                  </span>
                  <span className="user-email">{user.email}</span>
                </div>
              </div>
              <div className="menu-divider"></div>

              <button
                className="menu-item"
                onClick={() => {
                  setIsOpen(false);
                  onViewProfile();
                }}
              >
                <IoPersonOutline /> {t("userMenu.accountInfo")}
              </button>

              <button
                className="menu-item"
                onClick={() => {
                  setIsOpen(false);
                  onViewInvoices();
                }}
              >
                <IoReceiptOutline /> {t("userMenu.transactionHistory")}
              </button>

              {/* Nút Đổi mật khẩu sẽ hoạt động vì prop đã được nhận */}
              {canChangePassword ? (
                <button
                  className="menu-item"
                  onClick={() => {
                    setIsOpen(false);
                    onChangePassword();
                  }}
                >
                  <IoKeyOutline /> {t("userMenu.changePassword")}
                </button>
              ) : null}

              <div className="menu-divider"></div>
              <button
                className="menu-item logout"
                onClick={() => {
                  setIsOpen(false);
                  onLogout();
                }}
              >
                <IoLogOutOutline /> {t("userMenu.logout")}
              </button>
            </>
          ) : (
            // === MENU KHI CHƯA ĐĂNG NHẬP ===
            <>
              <button
                className="menu-item"
                onClick={() => {
                  setIsOpen(false);
                  onLogin();
                }}
              >
                <IoLogInOutline /> {t("userMenu.login")}
              </button>
              <button
                className="menu-item"
                onClick={() => {
                  setIsOpen(false);
                  onLogin();
                }}
              >
                <IoPersonAddOutline /> {t("userMenu.register")}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default UserMenu;
