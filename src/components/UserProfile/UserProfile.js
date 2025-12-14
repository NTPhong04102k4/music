import React, { useState, useEffect, useRef } from "react"; // Thêm useRef
import "./UserProfile.css";
import {
  IoCameraOutline,
  IoMusicalNotes,
  IoHeart,
  IoDiamond,
} from "react-icons/io5";
import { useTranslation } from "react-i18next";

function UserProfile({ user }) {
  const { t } = useTranslation();
  const [stats, setStats] = useState(() => ({
    playlists: 0,
    favorites: 0,
    isVip: false,
    planName: t("common.loading"),
    expiryDate: null,
    daysLeft: 0,
  }));

  // Ref cho input file
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      // ... (giữ nguyên logic fetch stats cũ)
      const fetchUserData = async () => {
        try {
          const token = localStorage.getItem("token");
          if (!token) return;

          const subRes = await fetch(
            "http://localhost:5001/api/user/subscription",
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const subData = await subRes.json();
          const playlistRes = await fetch(
            "http://localhost:5001/api/playlists",
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const playlistData = await playlistRes.json();
          const favRes = await fetch("http://localhost:5001/api/favorites", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const favData = await favRes.json();

          setStats({
            isVip: subData.isVip,
            planName: subData.planName,
            expiryDate: subData.expiryDate,
            daysLeft: subData.daysLeft,
            playlists: Array.isArray(playlistData) ? playlistData.length : 0,
            favorites: Array.isArray(favData) ? favData.length : 0,
          });
        } catch (error) {
          console.error("Error loading user profile data:", error);
        }
      };
      fetchUserData();
    }
  }, [user]);

  // Hàm xử lý khi click vào nút Camera -> Kích hoạt input file
  const handleCameraClick = () => {
    fileInputRef.current.click();
  };

  // Hàm xử lý khi người dùng chọn file
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate loại file (chỉ ảnh)
    if (!file.type.startsWith("image/")) {
      alert(t("userProfile.alerts.invalidImageFile"));
      return;
    }

    // Tạo FormData để gửi file
    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5001/api/user/avatar", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // Lưu ý: Không set Content-Type khi dùng FormData, browser tự làm việc đó
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        alert(t("userProfile.alerts.avatarUpdated"));
        // Cập nhật lại user trong localStorage và state của App (cần reload hoặc callback)
        // Cách đơn giản nhất để cập nhật toàn bộ App là reload lại trang
        // Hoặc tốt hơn là gọi một hàm update user từ props (nếu có)

        // Cập nhật tạm thời localStorage để giữ data mới
        const currentUser = JSON.parse(localStorage.getItem("user"));
        if (currentUser) {
          currentUser.avatar = data.avatarUrl;
          localStorage.setItem("user", JSON.stringify(currentUser));
        }

        window.location.reload(); // Reload để cập nhật avatar ở Header và Sidebar
      } else {
        alert(data.error || t("userProfile.alerts.avatarUploadFailed"));
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert(t("errors.serverConnection"));
    }
  };

  if (!user)
    return (
      <div className="user-profile-loading">
        {t("userProfile.loadingProfile")}
      </div>
    );

  return (
    <div className="user-profile-container">
      <div className="profile-header">
        <h2>{t("userProfile.title")}</h2>
      </div>

      <div className="profile-content">
        <div className="profile-avatar-section">
          <div className="avatar-wrapper">
            <img
              src={
                user.avatar ||
                "https://zmdjs.zmdcdn.me/zmp3-desktop/v1.17.3/static/media/user-default.3ff115bb.png"
              }
              alt={user.displayName}
              className="profile-avatar"
            />

            {/* Input file ẩn */}
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              accept="image/*"
              onChange={handleFileChange}
            />

            {/* Nút Camera kích hoạt input file */}
            <button
              className="change-avatar-btn"
              title={t("userProfile.changeAvatar")}
              onClick={handleCameraClick}
            >
              <IoCameraOutline />
            </button>
          </div>
          <h3 className="profile-name">{user.displayName || user.username}</h3>

          {stats.isVip && (
            <div className="vip-badge-profile">
              <IoDiamond className="diamond-icon" />{" "}
              <span>{t("userProfile.vipBadge")}</span>
            </div>
          )}
        </div>

        {/* ... (Các phần còn lại giữ nguyên) ... */}
        <div className="profile-stats-bar">
          <div className="stat-box">
            <span className="stat-value">{stats.playlists}</span>
            <span className="stat-label">
              <IoMusicalNotes /> {t("userProfile.stats.playlists")}
            </span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-box">
            <span className="stat-value">{stats.favorites}</span>
            <span className="stat-label">
              <IoHeart /> {t("userProfile.stats.favorites")}
            </span>
          </div>
        </div>

        <div className="profile-details-section">
          <div className="profile-group">
            <label>{t("userProfile.labels.displayName")}</label>
            <div className="profile-value">
              {user.displayName || t("userProfile.notUpdated")}
            </div>
          </div>

          <div className="profile-group">
            <label>{t("userProfile.labels.username")}</label>
            <div className="profile-value">{user.username}</div>
          </div>

          <div className="profile-group">
            <label>{t("userProfile.labels.email")}</label>
            <div className="profile-value">
              {user.email || t("userProfile.notUpdated")}
            </div>
          </div>

          <div className="profile-group">
            <label>{t("userProfile.labels.subscription")}</label>
            <div className="profile-value subscription-info">
              {stats.isVip ? (
                <>
                  <div className="sub-name vip">
                    <IoDiamond /> {stats.planName}
                    <span className="sub-days-inline">
                      {" "}
                      -{" "}
                      {t("userProfile.subscription.daysLeft", {
                        count: stats.daysLeft,
                      })}
                    </span>
                  </div>
                </>
              ) : (
                <div className="sub-name free">{stats.planName}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfile;
