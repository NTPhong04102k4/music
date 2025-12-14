import React, { useState, useEffect } from "react";
import "./VipUpgrade.css";
import {
  IoCheckmarkCircle,
  IoDiamond,
  IoVolumeHigh,
  IoBan,
  IoDownload,
} from "react-icons/io5";
import { Trans, useTranslation } from "react-i18next";

function VipUpgrade({ onBuy }) {
  const { t, i18n } = useTranslation();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSub, setCurrentSub] = useState(null); // { packageId, packagePrice, expiryDate, ... }
  const BACKEND_URL =
    process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";

  const currentLang = (i18n.resolvedLanguage || i18n.language || "vi")
    .toLowerCase()
    .split("-")[0];
  const dateLocale = currentLang === "en" ? "en-US" : "vi-VN";

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
      .catch((err) => console.error(t("vip.errors.loadPackagesFailed"), err))
      .finally(() => setLoading(false));
  }, [BACKEND_URL, t]);

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
      alert(t("vip.alerts.pleaseLoginAgain"));
      return;
    }

    const ok = window.confirm(t("vip.alerts.confirmChangePlan"));
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
        alert(data.error || t("vip.alerts.changePlanFailed"));
        return;
      }

      alert(data.message || t("vip.alerts.changedFree"));
      await refreshSubscription();
    } catch (e) {
      alert(t("errors.serverConnection"));
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
        alert(t("vip.alerts.downgradeWindowOnly"));
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
      console.error(t("vip.errors.missingOnBuyProp"));
      alert(t("errors.featureTemporarilyUnavailable"));
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
        {t("common.loading")}
      </div>
    );
  }

  return (
    <div className="vip-upgrade-container">
      <div className="vip-header-banner">
        <div className="vip-header-content">
          <h1>{t("vip.title")}</h1>
          <p>{t("vip.subtitle")}</p>
          <div className="vip-badge">
            <IoDiamond /> {t("vip.badge")}
          </div>
        </div>
      </div>

      <div className="vip-packages-section">
        {currentSub ? (
          <div className="vip-current-plan">
            <div className="vip-current-plan-title">
              {t("vip.currentPlan.title")}
            </div>
            <div className="vip-current-plan-row">
              <span className="vip-current-plan-name">
                {currentSub.planName || t("vip.currentPlan.defaultPlanName")}
              </span>
              <span className="vip-current-plan-meta">
                {typeof currentSub.daysLeft === "number"
                  ? t("vip.currentPlan.daysLeft", {
                      count: currentSub.daysLeft,
                    })
                  : ""}
                {currentSub.expiryDate
                  ? ` • ${t("vip.currentPlan.expiry", {
                      date: new Date(currentSub.expiryDate).toLocaleDateString(
                        dateLocale
                      ),
                    })}`
                  : ""}
                {currentSub.joinDate
                  ? ` • ${t("vip.currentPlan.joinDate", {
                      date: new Date(currentSub.joinDate).toLocaleDateString(
                        dateLocale
                      ),
                    })}`
                  : ""}
              </span>
            </div>
            <div className="vip-current-plan-note">
              <div>
                <Trans i18nKey="vip.currentPlan.note1">
                  You can only <b>downgrade</b> within <b>7 days</b> from the
                  day you registered your account.
                </Trans>
              </div>
              <div>
                <Trans i18nKey="vip.currentPlan.note2">
                  You can only downgrade from a <b>higher plan</b> to a{" "}
                  <b>lower plan</b>, and <b>cannot downgrade to Free</b>.
                </Trans>
              </div>
            </div>
          </div>
        ) : null}

        <h2>{t("vip.choosePlan")}</h2>
        <div className="vip-packages-grid">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`vip-package-card ${
                pkg.isRecommended ? "recommended" : ""
              }`}
            >
              {pkg.isRecommended && (
                <div className="best-value-tag">{t("vip.bestValue")}</div>
              )}

              <div className="package-header">
                {/* Tên gói (ví dụ: Gói 1 Tháng) */}
                <h3>{pkg.name.toUpperCase()}</h3>
                <span className="package-price">{pkg.formattedPrice}</span>
                {pkg.duration >= 180 && (
                  <span className="package-save">{t("vip.saveMore")}</span>
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
                      ? t("vip.buttons.current")
                      : isDowngradeBlocked
                      ? t("vip.buttons.cannotDowngrade")
                      : isFreeChange
                      ? t("vip.buttons.downgradeFree")
                      : currentSub?.packageId
                      ? t("vip.buttons.upgradePaid")
                      : t("vip.buttons.buyNow")}
                  </button>
                );
              })()}
            </div>
          ))}
        </div>
      </div>

      <div className="vip-benefits-section">
        <h2>{t("vip.benefits.title")}</h2>
        <div className="benefits-grid">
          <div className="benefit-item">
            <div className="benefit-icon" aria-hidden="true">
              <IoVolumeHigh />
            </div>
            <h4>{t("vip.benefits.losslessTitle")}</h4>
            <p>{t("vip.benefits.losslessDesc")}</p>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon" aria-hidden="true">
              <IoBan />
            </div>
            <h4>{t("vip.benefits.noAdsTitle")}</h4>
            <p>{t("vip.benefits.noAdsDesc")}</p>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon" aria-hidden="true">
              <IoDownload />
            </div>
            <h4>{t("vip.benefits.offlineTitle")}</h4>
            <p>{t("vip.benefits.offlineDesc")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VipUpgrade;
