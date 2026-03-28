# Hướng dẫn Triển khai nhatbook (Cách B: Duy nhất 1 link Render)

Chào bạn! Đây là bản hướng dẫn "1-Click Deploy" dành cho cách gộp chung Frontend vào Backend. Mọi thứ sẽ chạy trên một link duy nhất của Render.

---

## Bước 1: Chuẩn bị Database (Render)
1. Truy cập [Render.com](https://render.com) và tạo một service **PostgreSQL** mới.
2. Lấy thông tin kết nối và sử dụng một trình quản lý (DBeaver/Navicat) để chạy code tại [backend/db/init.sql](file:///c:/Users/OS/Desktop/project/backend/db/init.sql).

---

## Bước 2: Triển khai Website (Backend + Frontend)
1. Trên Render Dashboard, tạo một **Web Service** mới.
2. Chọn Repository GitHub chứa dự án này.
3. **Root Directory:** (Để trống - Mặc định là root `/`).
4. **Environment:** `Node`
5. **Build Command:** `npm install && npm run build` (Lệnh này sẽ cài đặt và đóng gói cả 2 thư mục).
6. **Start Command:** `npm start`
7. Trong phần **Environment Variables**, thêm các biến sau:
    - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`: Lấy từ Service PostgreSQL bạn vừa tạo.
    - `JWT_SECRET`: Một chuỗi ký tự bất kỳ thật dài và bảo mật.
    - `CLOUDINARY_CLOUD_NAME`: ...
    - `CLOUDINARY_API_KEY`: ...
    - `CLOUDINARY_API_SECRET`: ...
8. Nhấn **Create Web Service**.

---

## Bước 3: Xem thành quả
1. Sau khi Build xong (tầm 2-3 phút), Render sẽ cung cấp cho bạn 1 link duy nhất (ví dụ: `https://nhatbook-blog.onrender.com`).
2. Truy cập link đó -> Tinh tinh! Website của bạn đã lên mạng thành công! 🚀

---

## Lưu ý nhỏ:
- Nếu bạn muốn kiểm tra ở máy mình (Local) trước:
    1. Chạy `cd frontend && npm install && npm run build`.
    2. Chạy `cd backend && npm install && node server.js`.
    3. Truy cập `http://localhost:3000` (không phải 5173 nhé!).

---

Chúc bạn có một buổi deploy thật suôn sẻ! 😊
