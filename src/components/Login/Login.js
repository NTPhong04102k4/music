import React, { useState } from 'react';
import './Login.css';
import { IoClose, IoEyeOffOutline, IoEyeOutline } from 'react-icons/io5';
import { FaFacebookF, FaGoogle } from 'react-icons/fa';

function AuthModal({ onClose }) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!agreeTerms) {
      alert('Bạn phải đồng ý với Điều khoản và chính sách để đăng nhập.');
      return;
    }
    console.log('Đăng nhập với:', { email, password });
    // Thêm logic đăng nhập thực tế ở đây
    onClose(); // Đóng modal sau khi đăng nhập (hoặc xử lý lỗi)
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="auth-close-btn" onClick={onClose}>
          <IoClose />
        </button>
        <h2>Đăng nhập</h2>

        <form onSubmit={handleSubmit}>
          <div className="auth-input-group">
            <input
              type="email"
              placeholder="Nhập email/username của bạn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="auth-input-group password-group">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Nhập mật khẩu của bạn"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <IoEyeOutline /> : <IoEyeOffOutline />}
            </span>
          </div>

          <div className="auth-options">
            <label className="auth-checkbox-container">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
              />
              <span className="auth-checkmark"></span>
              Nhớ cho lần đăng nhập tới
            </label>
            <a href="#" className="forgot-password">
              Quên mật khẩu?
            </a>
          </div>

          <p className="auth-terms">
            Bằng việc đăng nhập, bạn đã đồng ý các điều khoản về việc thu thập,
            xử lý dữ liệu cá nhân, quyền và nghĩa vụ cá nhân được quy định tại
            <a href="#"> Chính sách quyền riêng tư</a> và
            <a href="#"> Thỏa thuận sử dụng</a>, và các chính sách khác bạn ban
            bố NCT
          </p>

          <button type="submit" className="auth-submit-btn">
            Đăng nhập
          </button>
        </form>

        <div className="auth-divider">
          <span>hoặc đăng nhập bằng</span>
        </div>

        <div className="auth-social-buttons">
          <button className="auth-social-btn facebook">
            <FaFacebookF /> Facebook
          </button>
          <button className="auth-social-btn google">
            <FaGoogle /> Google
          </button>
          {/* Đã loại bỏ nút "Số điện thoại" và "QR code" như yêu cầu */}
        </div>
      </div>
    </div>
  );
}

export default AuthModal;