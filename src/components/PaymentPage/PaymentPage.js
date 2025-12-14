import React, { useState } from "react";
import "./PaymentPage.css";
import {
  IoCardOutline,
  IoWalletOutline,
  IoQrCodeOutline,
  IoArrowBack,
} from "react-icons/io5";
import { useTranslation } from "react-i18next";

function PaymentPage({ selectedPackage, onBack, onPaymentSuccess }) {
  const BACKEND_URL =
    process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";
  const { t } = useTranslation();

  const [paymentMethod, setPaymentMethod] = useState("credit_card");
  const [isProcessing, setIsProcessing] = useState(false);

  // Hàm xử lý thanh toán
  const handlePayment = async () => {
    // Kiểm tra an toàn: Đảm bảo có gói cước được chọn
    if (!selectedPackage) {
      alert(t("payment.alerts.missingPackageInfo"));
      return;
    }

    setIsProcessing(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert(t("vip.alerts.pleaseLoginAgain"));
        // Có thể thêm logic chuyển hướng đến trang đăng nhập ở đây nếu cần
        return;
      }

      // Gọi API xử lý thanh toán
      const response = await fetch(`${BACKEND_URL}/api/payment/process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          packageId: selectedPackage.id, // ID gói cước từ DB
          packageName: selectedPackage.name, // Tên gói cước
          paymentMethod: paymentMethod, // Phương thức thanh toán
          price: selectedPackage.rawPrice, // Giá gốc (số) để tính toán nếu cần
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        // Thanh toán thành công
        alert(data.message || t("payment.alerts.success"));
        if (onPaymentSuccess) {
          onPaymentSuccess(); // Gọi callback để App.js xử lý tiếp (ví dụ quay về trang chủ)
        }
      } else {
        // Thanh toán thất bại
        alert(
          t("payment.alerts.failed", {
            error: data.error || t("payment.unknownError"),
          })
        );
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert(t("errors.serverConnection"));
    } finally {
      setIsProcessing(false);
    }
  };

  // Nếu không có thông tin gói, không hiển thị gì (hoặc có thể hiện thông báo lỗi)
  if (!selectedPackage) return null;

  return (
    <div className="payment-page">
      <div className="payment-container">
        {/* Nút quay lại */}
        <button type="button" className="back-btn-payment" onClick={onBack}>
          <IoArrowBack /> {t("payment.backToPlans")}
        </button>

        <div className="payment-layout">
          {/* Cột Trái: Phương thức thanh toán */}
          <div className="payment-methods-col">
            <h3 className="section-title">{t("payment.chooseMethod")}</h3>

            <div className="methods-list">
              {/* Thẻ tín dụng */}
              <label
                className={`method-item ${
                  paymentMethod === "credit_card" ? "selected" : ""
                }`}
              >
                <div className="method-radio">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === "credit_card"}
                    onChange={() => setPaymentMethod("credit_card")}
                  />
                </div>
                <div className="method-content">
                  <div className="method-info">
                    <span className="method-icon">
                      <IoCardOutline />
                    </span>
                    <span className="method-name">
                      {t("payment.methods.creditCard")}
                    </span>
                    <div className="card-icons">
                      <span className="card-logo visa">VISA</span>
                      <span className="card-logo master">MasterCard</span>
                    </div>
                  </div>
                  {paymentMethod === "credit_card" && (
                    <div className="method-detail">
                      <div className="form-group">
                        <label>{t("payment.creditCard.chooseCard")}</label>
                        <select className="payment-select">
                          <option>{t("payment.creditCard.newCard")}</option>
                        </select>
                      </div>
                      <label className="checkbox-container">
                        <input type="checkbox" defaultChecked />
                        <span className="checkmark"></span>
                        {t("payment.creditCard.autoPayNextCycle")}
                      </label>
                    </div>
                  )}
                </div>
              </label>

              {/* ShopeePay */}
              <label
                className={`method-item ${
                  paymentMethod === "shopeepay" ? "selected" : ""
                }`}
              >
                <div className="method-radio">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === "shopeepay"}
                    onChange={() => setPaymentMethod("shopeepay")}
                  />
                </div>
                <div className="method-content">
                  <div className="method-info">
                    <span className="method-icon shopee">
                      <IoWalletOutline />
                    </span>
                    <span className="method-name">
                      {t("payment.methods.shopeePay")}
                    </span>
                  </div>
                </div>
              </label>

              {/* MoMo */}
              <label
                className={`method-item ${
                  paymentMethod === "momo" ? "selected" : ""
                }`}
              >
                <div className="method-radio">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === "momo"}
                    onChange={() => setPaymentMethod("momo")}
                  />
                </div>
                <div className="method-content">
                  <div className="method-info">
                    <span className="method-icon momo">MoMo</span>
                    <span className="method-name">MoMo</span>
                  </div>
                </div>
              </label>

              {/* ZaloPay */}
              <label
                className={`method-item ${
                  paymentMethod === "zalopay" ? "selected" : ""
                }`}
              >
                <div className="method-radio">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === "zalopay"}
                    onChange={() => setPaymentMethod("zalopay")}
                  />
                </div>
                <div className="method-content">
                  <div className="method-info">
                    <span className="method-icon zalo">Zalo</span>
                    <span className="method-name">
                      {t("payment.methods.zaloPay")}
                    </span>
                  </div>
                </div>
              </label>

              {/* VNPay QR */}
              <label
                className={`method-item ${
                  paymentMethod === "qrcode" ? "selected" : ""
                }`}
              >
                <div className="method-radio">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === "qrcode"}
                    onChange={() => setPaymentMethod("qrcode")}
                  />
                </div>
                <div className="method-content">
                  <div className="method-info">
                    <span className="method-icon">
                      <IoQrCodeOutline />
                    </span>
                    <span className="method-name">
                      {t("payment.methods.vnpayQr")}
                    </span>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Cột Phải: Thông tin đơn hàng */}
          <div className="order-info-col">
            <div className="order-card">
              <h3>{t("payment.order.title")}</h3>
              <div className="order-body">
                <p className="order-desc">{t("payment.order.subtitle")}</p>

                <div className="order-package-box">
                  <span className="label">
                    {t("payment.order.packageLabel")}
                  </span>
                  <span className="value">{selectedPackage.name}</span>
                </div>

                <div className="order-row">
                  <span>{t("payment.order.amount")}</span>
                  <span className="price">{selectedPackage.price}</span>
                </div>

                <div className="order-divider"></div>

                <div className="order-total">
                  <span>{t("payment.order.total")}</span>
                  <span className="total-price">{selectedPackage.price}</span>
                </div>
              </div>

              <button
                type="button"
                className="btn-checkout"
                onClick={handlePayment}
                disabled={isProcessing}
                style={{
                  opacity: isProcessing ? 0.7 : 1,
                  cursor: isProcessing ? "not-allowed" : "pointer",
                }}
              >
                {isProcessing ? t("payment.processing") : t("payment.payNow")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentPage;
