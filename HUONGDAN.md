# Hướng Dẫn Chạy Website Nhạc này (NhacHay)

Dưới đây là hướng dẫn chi tiết để bạn có thể chạy website NhacHay, bao gồm phần Frontend (Giao diện người dùng), Backend (Máy chủ) và Cài đặt cơ sở dữ liệu trên máy cá nhân.

---

## Yêu cầu trước khi bắt đầu

- Cài đặt [Node.js](https://nodejs.org/) (phiên bản hiện tại hoặc LTS).
- Cài đặt npm (đi kèm với Node.js).
- Cài đặt MySQL Server (phiên bản 5.x hoặc 8.x) và đảm bảo MySQL đang chạy.
- Kết nối internet để tải các gói phụ thuộc.

---

## 1. Cài đặt và cấu hình cơ sở dữ liệu MySQL

1. Mở công cụ quản lý MySQL (ví dụ: MySQL Workbench, phpMyAdmin hoặc sử dụng dòng lệnh `mysql`).

Nhập phần này trong file db.js tùy theo mỗi máy 
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'nhacsodb_chuanhoa',
  port: 3306,
  ...
};
---

## 2. Chạy Backend (Server)

1. Mở terminal hoặc command prompt.

2. Di chuyển vào thư mục server:
```bash
cd server
```

3. Cài đặt các gói phụ thuộc của backend:
```bash
npm install
```

4. Khởi chạy server:
- Chạy server thường:
```bash
npm start
```
- Hoặc chạy server với chế độ phát triển (tự động reload khi có thay đổi):
```bash
npm run dev
```

5. Server mặc định sẽ chạy trên cổng `PORT` mà bạn cấu hình trong `server.js` hoặc biến môi trường `.env` (nếu có). Nếu không, mặc định thường là `http://localhost:5001`. Bạn kiểm tra và điều chỉnh nếu cần.

---

## 3. Chạy Frontend (Giao diện người dùng)

1. Mở terminal hoặc command prompt mới (khác với terminal backend nếu bạn chạy song song).

2. Đảm bảo bạn đang ở thư mục gốc của dự án (chứa file package.json của frontend).

3. Cài đặt các gói phụ thuộc frontend:
```bash
npm install
```

4. Khởi chạy ứng dụng React:
```bash
npm start
```

5. Ứng dụng sẽ chạy ở địa chỉ mặc định: [http://localhost:3000](http://localhost:3000)

---

## 4. Mở website

- Mở trình duyệt web và truy cập vào `http://localhost:3000` để sử dụng giao diện người dùng.
- Giao diện sẽ tương tác với server backend bạn đã chạy ở bước 2.

---

## Lưu ý bổ sung

- Nếu bạn cần thay đổi cổng hoặc cấu hình khác, vui lòng chỉnh sửa file cấu hình tương ứng trong thư mục `server` hoặc trong mã nguồn frontend.
- Nếu MySQL của bạn sử dụng user hoặc password khác, chỉnh sửa file `server/db.js` để khớp thông tin.
- Đảm bảo cơ sở dữ liệu và các bảng đã được tạo đúng theo yêu cầu dự án.
- Môi trường phát triển khuyến cáo chạy backend và frontend song song trên 2 terminal khác nhau.

---

Chúc bạn thành công và tận hưởng dự án NhacHay!
npm install
npm run dev
npm start
npm install
cd server
FLUSH PRIVILEGES;
