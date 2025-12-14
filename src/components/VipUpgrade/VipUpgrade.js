import React, { useState, useEffect } from "react";
import "./VipUpgrade.css";
import {
  IoCheckmarkCircle,
  IoDiamond,
  IoVolumeHigh,
  IoBan,
  IoDownload,
} from "react-icons/io5";

function VipUpgrade({ onBuy }) {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSub, setCurrentSub] = useState(null); // { packageId, packagePrice, expiryDate, ... }
  const BACKEND_URL =
    process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";

  useEffect(() => {
    Promise.all([
      fetch(`${BACKEND_URL}/api/vip-packages`).then((res) => res.json()),
      (async () => {
        const token = localStorage.getItem("token");
        if (!token) return null;
        const res = await fetch(`${BACKEND_URL}/api/user/subscription`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        return await res.json();
      })(),
    ])
      .then(([pkgData, subData]) => {
        if (Array.isArray(pkgData)) setPackages(pkgData);
        if (subData && subData.packageId) setCurrentSub(subData);
        else setCurrentSub(null);
      })
      .catch((err) => console.error("Lỗi tải gói cước:", err))
      .finally(() => setLoading(false));
  }, [BACKEND_URL]);

  const refreshSubscription = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const res = await fetch(`${BACKEND_URL}/api/user/subscription`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data && data.packageId) setCurrentSub(data);
    else setCurrentSub(null);
  };

  const handleDowngrade = async (pkg) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Vui lòng đăng nhập lại để tiếp tục.");
      return;
    }

    const ok = window.confirm(
      "Bạn chắc chắn muốn chuyển gói? (Hạ gói/bằng giá sẽ không bị trừ tiền)"
    );
    if (!ok) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/subscription/change`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ packageId: pkg.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Chuyển gói thất bại");
        return;
      }

      alert(data.message || "Đã chuyển gói (miễn phí).");
      await refreshSubscription();
    } catch (e) {
      alert("Lỗi kết nối server");
    }
  };

  const handleBuyClick = (pkg) => {
    // 1) Nếu đang dùng đúng gói -> không làm gì
    if (
      currentSub?.packageId &&
      Number(currentSub.packageId) === Number(pkg.id)
    ) {
      return;
    }

    const canDowngrade = currentSub?.canDowngrade !== false;

    // 2) Nếu đã có gói và gói chọn <= giá hiện tại -> chuyển gói miễn phí
    if (
      currentSub?.packageId &&
      Number(pkg.price || 0) <= Number(currentSub.packagePrice || 0)
    ) {
      if (!canDowngrade) {
        alert(
          "Bạn chỉ được hạ gói trong 7 ngày đầu kể từ ngày đăng ký tài khoản."
        );
        return;
      }
      handleDowngrade(pkg);
      return;
    }

    // 3) Còn lại: mua mới / nâng cấp (trả tiền)
    if (typeof onBuy === "function") {
      onBuy({
        id: pkg.id,
        name: pkg.name,
        price: pkg.formattedPrice,
        rawPrice: pkg.price,
      });
    } else {
      console.error("Lỗi: Prop 'onBuy' chưa được truyền vào VipUpgrade!");
      alert("Chức năng mua đang lỗi. Vui lòng thử lại sau.");
    }
  };

  if (loading) {
    return (
      <div
        className="vip-upgrade-container"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <div className="vip-upgrade-container">
      <div className="vip-header-banner">
        <div className="vip-header-content">
          <h1>Nâng Cấp VIP</h1>
          <p>Nghe nhạc không giới hạn, chất lượng cao</p>
          <div className="vip-badge">
            <IoDiamond /> MEMBER VIP
          </div>
        </div>
      </div>

      <div className="vip-packages-section">
        {currentSub ? (
          <div className="vip-current-plan">
            <div className="vip-current-plan-title">Gói bạn đang dùng</div>
            <div className="vip-current-plan-row">
              <span className="vip-current-plan-name">
                {currentSub.planName || "Premium"}
              </span>
              <span className="vip-current-plan-meta">
                {typeof currentSub.daysLeft === "number"
                  ? `Còn ${currentSub.daysLeft} ngày`
                  : ""}
                {currentSub.expiryDate
                  ? ` • Hết hạn: ${new Date(
                      currentSub.expiryDate
                    ).toLocaleDateString("vi-VN")}`
                  : ""}
                {currentSub.joinDate
                  ? ` • Ngày tham gia: ${new Date(
                      currentSub.joinDate
                    ).toLocaleDateString("vi-VN")}`
                  : ""}
              </span>
            </div>
            <div className="vip-current-plan-note">
              <div>
                Chỉ có thể <b>hạ gói</b> trong <b>7 ngày</b> kể từ ngày đăng ký
                tài khoản.
              </div>
              <div>
                Chỉ được hạ từ <b>gói cao</b> xuống <b>gói thấp</b>, và{" "}
                <b>không thể hạ xuống Free</b>.
              </div>
            </div>
          </div>
        ) : null}

        <h2>Chọn Gói Cước Phù Hợp</h2>
        <div className="vip-packages-grid">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`vip-package-card ${
                pkg.isRecommended ? "recommended" : ""
              }`}
            >
              {pkg.isRecommended && (
                <div className="best-value-tag">PHỔ BIẾN NHẤT</div>
              )}

              <div className="package-header">
                {/* Tên gói (ví dụ: Gói 1 Tháng) */}
                <h3>{pkg.name.toUpperCase()}</h3>
                <span className="package-price">{pkg.formattedPrice}</span>
                {pkg.duration >= 180 && (
                  <span className="package-save">Tiết kiệm hơn</span>
                )}
              </div>

              <div className="package-body">
                {pkg.description ? (
                  <p className="package-description">{pkg.description}</p>
                ) : null}
                <ul>
                  {pkg.features &&
                    pkg.features.map((feature, index) => (
                      <li key={index}>
                        <IoCheckmarkCircle /> {feature}
                      </li>
                    ))}
                </ul>
              </div>

              {(() => {
                const isCurrent =
                  currentSub?.packageId &&
                  Number(currentSub.packageId) === Number(pkg.id);
                const isFreeChange =
                  currentSub?.packageId &&
                  !isCurrent &&
                  Number(pkg.price || 0) <=
                    Number(currentSub.packagePrice || 0);
                const canDowngrade = currentSub?.canDowngrade !== false;
                const isDowngradeBlocked = isFreeChange && !canDowngrade;

                return (
                  <button
                    className={`btn-buy-vip ${
                      pkg.isRecommended ? "primary" : ""
                    }`}
                    onClick={() => handleBuyClick(pkg)}
                    disabled={Boolean(isCurrent) || Boolean(isDowngradeBlocked)}
                    style={
                      isCurrent || isDowngradeBlocked
                        ? { opacity: 0.6, cursor: "not-allowed" }
                        : undefined
                    }
                  >
                    {isCurrent
                      ? "ĐANG SỬ DỤNG"
                      : isDowngradeBlocked
                      ? "KHÔNG THỂ HẠ GÓI"
                      : isFreeChange
                      ? "HẠ GÓI (MIỄN PHÍ)"
                      : currentSub?.packageId
                      ? "NÂNG GÓI (TRẢ PHÍ)"
                      : "MUA NGAY"}
                  </button>
                );
              })()}
            </div>
          ))}
        </div>
      </div>

      <div className="vip-benefits-section">
        <h2>Đặc Quyền VIP</h2>
        <div className="benefits-grid">
          <div className="benefit-item">
            <div className="benefit-icon" aria-hidden="true">
              <IoVolumeHigh />
            </div>
            <h4>Chất lượng Lossless</h4>
            <p>Thưởng thức âm nhạc chuẩn phòng thu</p>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon" aria-hidden="true">
              <IoBan />
            </div>
            <h4>Không Quảng Cáo</h4>
            <p>Trải nghiệm nghe nhạc không bị gián đoạn</p>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon" aria-hidden="true">
              <IoDownload />
            </div>
            <h4>Tải Nhạc Không Giới Hạn</h4>
            <p>Lưu trữ bài hát yêu thích để nghe offline</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VipUpgrade;
