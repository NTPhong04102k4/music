import React, { useState, useEffect } from "react";
import "./InvoiceHistory.css";
import { IoReceiptOutline, IoChevronForward } from "react-icons/io5";
import { useTranslation } from "react-i18next";

function InvoiceHistory({ onViewInvoiceDetail }) {
  const { t, i18n } = useTranslation();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch("http://localhost:5001/api/invoices", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setInvoices(data);
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, []);

  const formatDate = (dateString) => {
    const currentLang = (i18n.resolvedLanguage || i18n.language || "vi")
      .toLowerCase()
      .split("-")[0];
    const locale = currentLang === "en" ? "en-US" : "vi-VN";

    return new Date(dateString).toLocaleDateString(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount) => {
    const currentLang = (i18n.resolvedLanguage || i18n.language || "vi")
      .toLowerCase()
      .split("-")[0];
    const locale = currentLang === "en" ? "en-US" : "vi-VN";

    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  if (loading)
    return <div className="invoice-loading">{t("invoiceHistory.loading")}</div>;

  return (
    <div className="invoice-history-container">
      <div className="invoice-header">
        <h2>{t("invoiceHistory.title")}</h2>
      </div>

      <div className="invoice-list">
        {invoices.length === 0 ? (
          <div className="no-invoices">{t("invoiceHistory.empty")}</div>
        ) : (
          invoices.map((inv) => (
            <div
              className="invoice-item"
              key={inv.id}
              onClick={() => onViewInvoiceDetail(inv.id)}
            >
              <div className="invoice-icon">
                <IoReceiptOutline />
              </div>
              <div className="invoice-info">
                <div className="invoice-title">
                  {t("invoiceHistory.itemTitle")}
                </div>
                <div className="invoice-date">{formatDate(inv.date)}</div>
              </div>
              <div className="invoice-right">
                <div className="invoice-amount">
                  {formatCurrency(inv.totalAmount)}
                </div>
                <div className={`invoice-status ${inv.status}`}>
                  {inv.status === "paid" || inv.status === "completed"
                    ? t("invoiceDetail.status.success")
                    : t("invoiceDetail.status.processing")}
                </div>
              </div>
              <div className="invoice-arrow">
                <IoChevronForward />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default InvoiceHistory;
