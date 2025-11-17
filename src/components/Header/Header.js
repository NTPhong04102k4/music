import React, { useState, useEffect, useRef } from 'react'; // === SỬA: Thêm (Added) useEffect, useRef ===
import './Header.css';
import {
    IoArrowBack,
    IoArrowForward,
    IoSearch,
    IoSettings
} from 'react-icons/io5';

// === SỬA: Chấp-nhận (Accept) props từ (from) App.js ===
function Header({ onShowAuthModal, onPlaySong }) {
    const [searchTerm, setSearchTerm] = useState("");
    
    // === SỬA: Thêm (Added) state cho (for) kết-quả (results) và-trạng-thái (status) active ===
    const [searchResults, setSearchResults] = useState([]);
    const [isSearchActive, setIsSearchActive] = useState(false);
    const searchRef = useRef(null); // Để-phát-hiện (To detect) click-ra-ngoài (click outside)

    // === SỬA: Thêm (Added) Effect để-tìm-kiếm (to search) (với-debounce (with debounce)) ===
    useEffect(() => {
        if (searchTerm.trim() === '') {
            setSearchResults([]);
            return;
        }

        // Debounce: Chờ (Wait) 300ms sau-khi (after) người-dùng (user) ngừng-gõ (stops typing)
        const delayDebounceFn = setTimeout(() => {
            fetch(`http://localhost:5001/api/search?q=${searchTerm}`)
                .then(res => res.json())
                .then(data => {
                    setSearchResults(data);
                })
                .catch(err => console.error('Lỗi tìm kiếm:', err));
        }, 300);

        return () => clearTimeout(delayDebounceFn); // Cleanup
    }, [searchTerm]);

    // === SỬA: Thêm (Added) hàm-để-xử-lý (function to handle) click-vào-kết-quả (result click) ===
    const handleResultClick = (song) => {
        onPlaySong(song, [song]); // Phát (Play) bài-hát (the song) (và-tạo (and create) một (a) playlist-mới (new playlist) chỉ-với (with just) 1-bài (1 song))
        setSearchTerm(''); // Xóa (Clear) thanh-tìm-kiếm (search bar)
        setSearchResults([]);
        setIsSearchActive(false);
    };

    // === SỬA: Ngăn-chặn (Prevent) form-submit (form submit) tải-lại-trang (reloading the page) ===
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        // (Logic-tìm-kiếm (Search logic) đã-được-xử-lý (is already handled) bởi (by) useEffect)
    };

    // Xử-lý (Handle) click-ra-ngoài (click outside) để-đóng (to close) popover
    useEffect(() => {
        function handleClickOutside(event) {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsSearchActive(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [searchRef]);


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
                    
                    {/* === SỬA: Bọc (Wrap) form trong (in) một (a) div để-định-vị (for positioning) === */}
                    <div className="search-wrapper" ref={searchRef}>
                        <form className="search" onSubmit={handleSearchSubmit}>
                            <div className="search__container">
                                <button className="zm-btn button" tabIndex={0} type="submit">
                                    <IoSearch />
                                </button>
                                <div className="input-wrapper">
                                    <input
                                        type="text"
                                        className="form-control z-input-placeholder"
                                        placeholder="Tìm kiếm bài hát, nghệ sĩ..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        // === SỬA: Hiển-thị (Show) kết-quả (results) khi-focus (on focus) ===
                                        onFocus={() => setIsSearchActive(true)}
                                    />
                                </div>
                            </div>
                        </form>

                        {/* === SỬA: Thêm (Added) Popover Kết-quả (Results Popover) === */}
                        {isSearchActive && searchTerm.length > 0 && (
                            <div className="search-results-popover">
                                {searchResults.length > 0 ? (
                                    searchResults.map(song => (
                                        <div 
                                            className="search-result-item" 
                                            key={song.id}
                                            // Dùng (Use) onMouseDown để-nó-kích-hoạt (so it fires) trước (before) onBlur
                                            onMouseDown={() => handleResultClick(song)}
                                        >
                                            <img 
                                                src={song.imageUrl} 
                                                alt={song.title} 
                                                className="search-result-image"
                                            />
                                            <div className="search-result-info">
                                                <h4>{song.title}</h4>
                                                <p>{song.artists}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="search-no-results">
                                        Không tìm thấy kết quả.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
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
                    
                    <div className="setting-item">
                        <button className="zm-btn zm-tooltip-btn is-hover-circle button" tabIndex={0}>
                            <IoSettings />
                        </button>
                    </div>
                    
                    <div className="user-setting">
                        <div className="zm-avatar-frame" style={{ '--circle-color': 'transparent' }}>
                            {/* === SỬA: Kết-nối (Connect) với-prop (prop) onShowAuthModal === */}
                            <button
                                className="zm-btn button"
                                tabIndex={0}
                                onClick={onShowAuthModal}
                            >
                                <figure className="image is-38x38 is-rounded">
                                    <img 
                                        src="https://zmdjs.zmdcdn.me/zmp3-desktop/v1.17.3/static/media/user-default.3ff115bb.png" 
                                        alt="" 
                                    />
                                </figure>
                            </button>
                        </div>
                    </div>

                    {/* === SỬA: Đã-xóa (Removed) logic-modal (modal logic) nội-bộ (internal) === */}
                </div>
            </div>
        </header>
    );
}

export default Header;