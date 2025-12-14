import React, { useCallback, useEffect, useRef, useState } from "react";
import "./ShopNotificationModal.css";
import { IoClose, IoStorefrontOutline } from "react-icons/io5";
import { useTranslation } from "react-i18next";

function safeParseNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export default function ShopNotificationModal({
  shopUrl,
  intervalMs = 60 * 60 * 1000, // 1h
  storageKey = "musicweb_shop_modal_last_shown",
  title,
  message,
  ctaText,
}) {
  const { t } = useTranslation();
  const resolvedTitle = title ?? t("shopModal.title");
  const resolvedMessage = message ?? t("shopModal.message");
  const resolvedCtaText = ctaText ?? t("shopModal.cta");
  const [open, setOpen] = useState(false);
  const timerRef = useRef(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleNext = useCallback(
    (delayMs) => {
      clearTimer();
      timerRef.current = setTimeout(() => {
        // Mark as shown now (so it won't instantly re-open on refresh)
        localStorage.setItem(storageKey, String(Date.now()));
        setOpen(true);
        // Schedule subsequent show after full interval
        scheduleNext(intervalMs);
      }, Math.max(0, delayMs));
    },
    [clearTimer, intervalMs, storageKey]
  );

  useEffect(() => {
    // If no url -> don't show (avoid opening blank tab)
    if (!shopUrl) return;

    const lastShown = safeParseNumber(localStorage.getItem(storageKey), 0);
    const now = Date.now();
    const elapsed = now - lastShown;

    if (elapsed >= intervalMs) {
      localStorage.setItem(storageKey, String(now));
      setOpen(true);
      scheduleNext(intervalMs);
    } else {
      scheduleNext(intervalMs - elapsed);
    }

    return () => clearTimer();
  }, [shopUrl, storageKey, intervalMs, scheduleNext, clearTimer]);

  const handleClose = useCallback((e) => {
    e?.stopPropagation?.();
    setOpen(false);
  }, []);

  const handleOpenShop = useCallback(
    (e) => {
      e?.stopPropagation?.();
      if (!shopUrl) return;
      window.open(shopUrl, "_blank", "noopener,noreferrer");
      setOpen(false);
    },
    [shopUrl]
  );

  if (!open) return null;

  return (
    <div
      className="shop-modal-overlay"
      onClick={handleClose}
      role="presentation"
    >
      <div
        className="shop-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={resolvedTitle}
      >
        <button
          className="shop-modal-close"
          onClick={handleClose}
          aria-label={t("common.close")}
        >
          <IoClose />
        </button>

        <div className="shop-modal-icon" aria-hidden="true">
          <IoStorefrontOutline />
        </div>

        <div className="shop-modal-content">
          <h3 className="shop-modal-title">{resolvedTitle}</h3>
          <p className="shop-modal-message">{resolvedMessage}</p>
        </div>

        <div className="shop-modal-actions">
          <button className="shop-modal-cta" onClick={handleOpenShop}>
            {resolvedCtaText}
          </button>
        </div>
      </div>
    </div>
  );
}
