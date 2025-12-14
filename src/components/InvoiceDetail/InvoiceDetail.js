import React, { useMemo, useState, useEffect } from "react";
import "./InvoiceDetail.css";
import { IoArrowBack, IoCheckmarkCircle, IoTimeOutline } from "react-icons/io5";
import { useTranslation } from "react-i18next";

function InvoiceDetail({ invoiceId, onBack }) {
  const { t, i18n } = useTranslation();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const BACKEND_URL = useMemo(
    () => process.env.REACT_APP_BACKEND_URL || "http://localhost:5001",
    []
  );

  const currentLang = (i18n.resolvedLanguage || i18n.language || "vi")
    .toLowerCase()
    .split("-")[0];
  const locale = currentLang === "en" ? "en-US" : "vi-VN";

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && invoiceId) {
      fetch(`${BACKEND_URL}/api/invoices/${invoiceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (!data?.error) setInvoice(data);
          else setInvoice(null);
        })
        .catch((err) => {
          console.error(err);
          setInvoice(null);
        })
        .finally(() => setLoading(false));
    } else {
      setInvoice(null);
      setLoading(false);
    }
  }, [invoiceId, BACKEND_URL]);

  if (loading)
    return <div className="invoice-loading">{t("invoiceDetail.loading")}</div>;
  if (!invoice)
    return <div className="invoice-loading">{t("invoiceDetail.notFound")}</div>;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(locale, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  return (
    <div className="invoice-detail-page">
      <button className="back-btn" onClick={onBack} type="button">
        <IoArrowBack /> {t("invoiceDetail.backToList")}
      </button>

      <div className="invoice-card">
        <div className="invoice-card-header">
          <h3>{t("invoiceDetail.title", { id: invoice.id })}</h3>
          <div className={`status-badge ${invoice.status}`}>
            {invoice.status === "paid" || invoice.status === "completed" ? (
              <>
                <IoCheckmarkCircle /> {t("invoiceDetail.status.success")}
              </>
            ) : (
              <>
                <IoTimeOutline /> {t("invoiceDetail.status.processing")}
              </>
            )}
          </div>
        </div>

        <div className="invoice-section">
          <p className="invoice-label">{t("invoiceDetail.transactionTime")}</p>
          <p className="invoice-value">{formatDate(invoice.date)}</p>
        </div>

        <div className="invoice-divider"></div>

        <div className="invoice-section">
          <p className="invoice-label">{t("invoiceDetail.serviceDetails")}</p>
          <div className="invoice-items">
            {invoice.items &&
              invoice.items.map((item, idx) => (
                <div key={idx} className="item-row">
                  <div className="item-desc">
                    <span className="item-name">
                      {item.packageName ||
                        t("invoiceDetail.defaultServiceName")}
                    </span>
                    <span className="item-sub">{item.description}</span>
                  </div>
                  <div className="item-price">
                    {formatCurrency(item.amount)}
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="invoice-divider"></div>

        <div className="invoice-total-row">
          <span>{t("invoiceDetail.totalPayment")}</span>
          <span className="total-amount">
            {formatCurrency(invoice.totalAmount)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default InvoiceDetail;
