import { useEffect, useState } from 'react';

function AdWeb({ isLoggedIn }) {
  const [shouldShowAd, setShouldShowAd] = useState(false);
  const [adLink, setAdLink] = useState('');

  const AD_LAST_OPENED_KEY = 'ad_last_opened_at_ms';
  const AD_COOLDOWN_MS = 5 * 60 * 1000; // 5 phút
  
  // Effect 1: Kiểm tra quyền và lấy link quảng cáo
  useEffect(() => {
    const checkAdsStatus = async () => {
      let isVip = false;

      if (isLoggedIn) {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch('http://localhost:5001/api/user/check-ads', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await response.json();
          isVip = data.isVip;
          console.log("AdWeb: User VIP status:", isVip);
        } catch (error) {
          console.error("AdWeb: Lỗi check VIP:", error);
          // Nếu lỗi mạng, tạm thời coi như không VIP để hiện quảng cáo
        }
      } else {
          console.log("AdWeb: User not logged in (Non-VIP)");
      }

      // Nếu KHÔNG phải VIP -> Lấy link quảng cáo
      if (!isVip) {
        try {
          const adResponse = await fetch('http://localhost:5001/api/ads/random');
          const adData = await adResponse.json();
          if (adData.link) {
            console.log("AdWeb: Loaded ad link:", adData.link);
            setAdLink(adData.link);
            setShouldShowAd(true);
          } else {
             console.log("AdWeb: No ad link returned");
          }
        } catch (error) {
          console.error("AdWeb: Lỗi lấy link quảng cáo:", error);
        }
      } else {
        // Nếu là VIP -> Tắt quảng cáo
        setShouldShowAd(false);
        setAdLink('');
      }
    };

    checkAdsStatus();
  }, [isLoggedIn]); // Chạy lại khi trạng thái đăng nhập thay đổi

  // Effect 2: Lắng nghe click toàn trang
  useEffect(() => {
    const handleGlobalClick = (e) => {
      // Chỉ xử lý nếu cần hiện quảng cáo và có link
      if (shouldShowAd && adLink) {
        
        // Quan trọng: Kiểm tra xem click có phải vào nút/link nội bộ không?
        // Nếu muốn quảng cáo hiện ra BẤT KỂ click vào đâu (kể cả nút Play), giữ nguyên.
        // Nếu muốn tránh click nhầm vào nút chức năng, cần check e.target.

        const now = Date.now();
        const lastOpened = Number(localStorage.getItem(AD_LAST_OPENED_KEY) || 0);
        const isCooldownActive =
          Number.isFinite(lastOpened) && lastOpened > 0 && now - lastOpened < AD_COOLDOWN_MS;

        // Rule: chỉ lần đầu vào app (hoặc sau khi hết cooldown 5 phút) mới mở quảng cáo
        if (isCooldownActive) return;

        // Set timestamp NGAY trước khi open để tránh double-click mở nhiều tab
        localStorage.setItem(AD_LAST_OPENED_KEY, String(now));

        console.log("AdWeb: Opening ad...", adLink);
        
        // Mở tab mới
        const newWindow = window.open(adLink, '_blank');
        
        // Kiểm tra nếu bị chặn pop-up
        if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') { 
            console.warn("AdWeb: Pop-up blocked by browser");
            // Có thể hiển thị thông báo yêu cầu user tắt chặn pop-up nếu muốn
        } else {
            // Focus lại cửa sổ hiện tại để không làm gián đoạn trải nghiệm (tùy chọn)
            // window.focus(); 
        }
      }
    };

    if (shouldShowAd) {
        console.log("AdWeb: Adding global click listener");
        // Sử dụng 'capture: true' để bắt sự kiện sớm nhất có thể
        window.addEventListener('click', handleGlobalClick, true);
    } else {
        window.removeEventListener('click', handleGlobalClick, true);
    }

    return () => {
      window.removeEventListener('click', handleGlobalClick, true);
    };
  }, [shouldShowAd, adLink]);

  return null;
}

export default AdWeb;