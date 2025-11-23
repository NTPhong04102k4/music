import React, { useState } from 'react';
import './Login.css'; // Đảm bảo bạn dùng đúng file CSS (Login.css hoặc AuthModal.css)
import { IoClose, IoEyeOffOutline, IoEyeOutline } from 'react-icons/io5';
import { FaFacebookF, FaGoogle } from 'react-icons/fa';

function Login({ onClose, onLoginSuccess }) {
  // State quản lý chế độ: false = Đăng nhập, true = Đăng ký
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  
  // Form Data
  const [email, setEmail] = useState(''); // Dùng chung cho login (làm username) và register
  const [username, setUsername] = useState(''); // Chỉ dùng cho register
  const [fullName, setFullName] = useState(''); // Chỉ dùng cho register
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // Chỉ dùng cho register
  
  const [agreeTerms, setAgreeTerms] = useState(false);

  const resetForm = () => {
      setEmail('');
      setPassword('');
      setUsername('');
      setFullName('');
      setConfirmPassword('');
      setAgreeTerms(false);
  };

  const toggleMode = () => {
      setIsRegisterMode(!isRegisterMode);
      resetForm();
  };

  const handleLogin = async () => {
    try {
        const response = await fetch('http://localhost:5001/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }), // 'email' ở đây là input username/email
        });
  
        const data = await response.json();
  
        if (response.ok) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          if (onLoginSuccess) onLoginSuccess(data.user);
          else onClose();
        } else {
          alert(data.error || 'Đăng nhập thất bại');
        }
      } catch (error) {
        alert('Lỗi kết nối server');
      }
  };

  const handleRegister = async () => {
      if (password !== confirmPassword) {
          alert("Mật khẩu xác nhận không khớp!");
          return;
      }
      if (!agreeTerms) {
          alert("Bạn phải đồng ý với các điều khoản.");
          return;
      }

      try {
        const response = await fetch('http://localhost:5001/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                username, 
                email, 
                password, 
                displayName: fullName 
            }),
          });
    
          const data = await response.json();
    
          if (response.ok) {
            alert("Đăng ký thành công! Vui lòng đăng nhập.");
            setIsRegisterMode(false); // Chuyển về trang đăng nhập
            resetForm();
          } else {
            alert(data.error || 'Đăng ký thất bại');
          }
      } catch (error) {
          alert('Lỗi kết nối server');
      }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isRegisterMode) {
        handleRegister();
    } else {
        handleLogin();
    }
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="auth-close-btn" onClick={onClose}>
          <IoClose />
        </button>
        
        <h2>{isRegisterMode ? 'Đăng Ký Tài Khoản' : 'Đăng Nhập'}</h2>

        <form onSubmit={handleSubmit}>
          
          {/* === FORM ĐĂNG NHẬP === */}
          {!isRegisterMode && (
              <>
                <div className="auth-input-group">
                    <input
                    type="text"
                    placeholder="Nhập email hoặc tên đăng nhập"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    />
                </div>
                <div className="auth-input-group password-group">
                    <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Nhập mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    />
                    <span className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <IoEyeOutline /> : <IoEyeOffOutline />}
                    </span>
                </div>
                
                <div className="auth-options">
                    <label className="auth-checkbox-container">
                    <input type="checkbox" />
                    <span className="auth-checkmark"></span>
                    Nhớ tôi
                    </label>
                    <a href="#" className="forgot-password">Quên mật khẩu?</a>
                </div>
              </>
          )}

          {/* === FORM ĐĂNG KÝ === */}
          {isRegisterMode && (
              <>
                <div className="auth-input-group">
                    <input
                    type="text"
                    placeholder="Tên đăng nhập (Username)"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    />
                </div>
                <div className="auth-input-group">
                    <input
                    type="text"
                    placeholder="Tên hiển thị (Họ và Tên)"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    />
                </div>
                <div className="auth-input-group">
                    <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    />
                </div>
                <div className="auth-input-group password-group">
                    <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    />
                </div>
                <div className="auth-input-group password-group">
                    <input
                    type="password"
                    placeholder="Nhập lại mật khẩu"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    />
                </div>
                
                <div className="auth-options">
                    <label className="auth-checkbox-container">
                        <input
                            type="checkbox"
                            checked={agreeTerms}
                            onChange={(e) => setAgreeTerms(e.target.checked)}
                        />
                        <span className="auth-checkmark"></span>
                        Tôi đồng ý với các điều khoản
                    </label>
                </div>
              </>
          )}

          {/* Nút Submit */}
          <button type="submit" className="auth-submit-btn">
            {isRegisterMode ? 'Đăng Ký' : 'Đăng Nhập'}
          </button>
        </form>

        <div className="auth-divider">
          <span>hoặc</span>
        </div>

        {/* Social Login chỉ hiện khi Đăng nhập cho gọn */}
        {!isRegisterMode && (
            <div className="auth-social-buttons">
            <button className="auth-social-btn facebook">
                <FaFacebookF /> Facebook
            </button>
            <button className="auth-social-btn google">
                <FaGoogle /> Google
            </button>
            </div>
        )}

        {/* Nút Chuyển đổi Chế độ */}
        <div className="auth-footer-switch">
            {isRegisterMode ? (
                <p>Bạn đã có tài khoản? <span onClick={toggleMode}>Đăng nhập ngay</span></p>
            ) : (
                <p>Bạn chưa có tài khoản? <span onClick={toggleMode}>Đăng ký ngay</span></p>
            )}
        </div>

      </div>
    </div>
  );
}

export default Login;