import React, { useState } from 'react';
import './Header.css';
// 💡 Để dùng các icon này, bạn cần cài đặt thư viện react-icons:
// npm install react-icons
import { 
    IoArrowBack, 
    IoArrowForward, 
    IoSearch, 
    IoSettings 
} from 'react-icons/io5'; // Dùng icon set của Ionicons

// Lưu ý: Đã bỏ import 'FaCloudDownloadAlt' vì không còn dùng

function Header() {
    // Sử dụng useState để quản lý nội dung ô tìm kiếm
    const [searchTerm, setSearchTerm] = useState("");

    return (
        <header className="zm-header">
            <div className="level">
                <div className="level-left">
                    <button className="zm-btn disabled button" tabIndex={0} disabled>
                        <IoArrowBack />
                    </button>
                    <button className="zm-btn disabled button" tabIndex={0} disabled>
                        <IoArrowForward />
                    </button>
                    
                    <form className="search">
                        <div className="search__container">
                            <button className="zm-btn button" tabIndex={0} type="submit">
                                <IoSearch />
                            </button>
                            <div className="input-wrapper">
                                <input
                                    type="text"
                                    className="form-control z-input-placeholder"
                                    placeholder="Tìm kiếm bài hát, nghệ sĩ, lời bài hát..."
                                    value={searchTerm} // Gán giá trị từ state
                                    onChange={(e) => setSearchTerm(e.target.value)} // Cập nhật state khi gõ
                                />
                            </div>
                        </div>
                    </form>
                </div>

                <div className="level-right">
                    <a 
                        className="header-upgrade-vip-button" 
                        href="https://zingmp3.vn/vip/upgrade?src_vip=114" 
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Nâng cấp tài khoản
                    </a>
                    
                    {/* === KHỐI CODE DOWNLOAD ĐÃ ĐƯỢC XÓA === */}
                    
                    <div className="setting-item">
                        <button className="zm-btn zm-tooltip-btn is-hover-circle button" tabIndex={0}>
                            <IoSettings />
                        </button>
                    </div>
                    
                    <div className="user-setting">
                        <div className="zm-avatar-frame" style={{ '--circle-color': 'transparent' }}>
                            <button className="zm-btn button" tabIndex={0}>
                                <figure className="image is-38x38 is-rounded">
                                    <img 
                                        src="https://zmdjs.zmdcdn.me/zmp3-desktop/v1.17.3/static/media/user-default.3ff115bb.png" 
                                        alt="" 
                                    />
                                </figure>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}

export default Header;