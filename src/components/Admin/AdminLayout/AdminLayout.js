import React from "react";
import "./AdminLayout.css";
import {
  IoHomeOutline,
  IoMusicalNotesOutline,
  IoAlbumsOutline,
  IoPeopleOutline,
  IoMicOutline,
  IoLogOutOutline,
  IoPersonCircleOutline,
} from "react-icons/io5";
import { useTranslation } from "react-i18next";

function AdminLayout({ children, onNavigate, currentView, onLogout }) {
  const { t } = useTranslation();
  return (
    <div className="admin-container">
      {/* Sidebar Admin */}
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <h2>{t("admin.layout.brand")}</h2>
        </div>

        <nav className="admin-nav">
          <ul>
            <li
              className={currentView === "dashboard" ? "active" : ""}
              onClick={() => onNavigate("dashboard")}
            >
              <IoHomeOutline /> {t("admin.layout.dashboard")}
            </li>
            <li
              className={currentView === "songs" ? "active" : ""}
              onClick={() => onNavigate("songs")}
            >
              <IoMusicalNotesOutline /> {t("admin.layout.songs")}
            </li>

            <li
              className={currentView === "albums" ? "active" : ""}
              onClick={() => onNavigate("albums")}
            >
              <IoAlbumsOutline /> {t("admin.layout.albums")}
            </li>

            <li
              className={currentView === "artists" ? "active" : ""}
              onClick={() => onNavigate("artists")}
            >
              <IoMicOutline /> {t("admin.layout.artists")}
            </li>

            <li
              className={currentView === "users" ? "active" : ""}
              onClick={() => onNavigate("users")}
            >
              <IoPeopleOutline /> {t("admin.layout.users")}
            </li>
          </ul>
        </nav>

        <div className="admin-footer">
          <button className="admin-logout-btn" onClick={onLogout}>
            <IoLogOutOutline /> {t("admin.layout.logout")}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main">
        <header className="admin-header">
          <h3>{t("admin.layout.systemAdmin")}</h3>
          <div className="admin-profile">
            <span>{t("admin.layout.admin")}</span>
            <IoPersonCircleOutline size={30} />
          </div>
        </header>

        <div className="admin-content-wrapper">{children}</div>
      </main>
    </div>
  );
}

export default AdminLayout;
