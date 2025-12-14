import React, { useState, useRef, useEffect } from "react";
import "./SettingsMenu.css";
import { useTranslation } from "react-i18next";
import {
  IoSettingsOutline,
  IoEarthOutline,
  IoChevronForward,
  IoInformationCircleOutline,
  IoChatboxEllipsesOutline,
  IoCheckmark,
} from "react-icons/io5";

function SettingsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [showLangSub, setShowLangSub] = useState(false); // State cho menu con Ngôn ngữ
  const menuRef = useRef(null);
  const { t, i18n } = useTranslation();

  const currentLang = (i18n.resolvedLanguage || i18n.language || "vi")
    .toLowerCase()
    .split("-")[0];
  const isEnglish = currentLang === "en";
  const isVietnamese = currentLang === "vi";

  const handleChangeLanguage = async (lng) => {
    await i18n.changeLanguage(lng);
    setShowLangSub(false);
    setIsOpen(false);
  };

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

  return (
    <div className="settings-menu-container" ref={menuRef}>
      {/* Nút Setting */}
      <button
        className={`zm-btn zm-tooltip-btn is-hover-circle button ${
          isOpen ? "active" : ""
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <IoSettingsOutline />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="settings-dropdown">
          <ul className="settings-list">
            {/* Mục Ngôn ngữ - Có Submenu */}
            <li
              className="settings-item"
              onClick={() => setShowLangSub((v) => !v)}
            >
              <div className="item-content">
                <IoEarthOutline className="item-icon" />
                <span>{t("settings.language")}</span>
                <IoChevronForward className="arrow-icon" />
              </div>

              {/* Submenu Ngôn ngữ (Hiện ra bên trái) */}
              {showLangSub && (
                <div className="submenu-dropdown">
                  <div
                    className={`submenu-item ${isEnglish ? "active" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleChangeLanguage("en");
                    }}
                  >
                    <span>{t("language.english")}</span>
                    {isEnglish && <IoCheckmark className="check-icon" />}
                  </div>
                  <div
                    className={`submenu-item ${isVietnamese ? "active" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleChangeLanguage("vi");
                    }}
                  >
                    <span>{t("language.vietnamese")}</span>
                    {isVietnamese && <IoCheckmark className="check-icon" />}
                  </div>
                </div>
              )}
            </li>

            <div className="settings-divider"></div>

            {/* Các mục khác */}
            <li
              className="settings-item"
              onClick={() =>
                window.open(
                  "https://sites.google.com/view/privacy-policy-ntphong",
                  "_blank"
                )
              }
            >
              <div className="item-content">
                <IoInformationCircleOutline className="item-icon" />
                <span>{t("settings.helpSupport")}</span>
              </div>
            </li>

            <li
              className="settings-item"
              onClick={() =>
                window.open(
                  "https://docs.google.com/forms/d/e/1FAIpQLSed0IpMD4ICoi0ygakPaOTBEz4A5-q1OecXqvPAfTO2-ncYuQ/viewform",
                  "_blank"
                )
              }
            >
              <div className="item-content">
                <IoChatboxEllipsesOutline className="item-icon" />
                <span>{t("settings.feedback")}</span>
              </div>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default SettingsMenu;
