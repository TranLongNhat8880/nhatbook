# BÁO CÁO PHÂN TÍCH THIẾT KẾ

## Dự án: Hệ thống Blog Cá nhân Tương tác (Interactive Personal Blog)

------------------------------------------------------------------------

## 1. Tổng quan Dự án

### 🎯 Mục tiêu

Xây dựng một nền tảng blog để:

-   Lưu trữ kiến thức chuyên môn\
-   Ghi chú từ vựng ngôn ngữ\
-   Chia sẻ bài viết công khai\
-   Cho phép độc giả đăng ký -- đăng nhập -- bình luận tương tác

Hệ thống tập trung vào:

-   Bảo mật\
-   Luồng xác thực (Auth Flow)\
-   Quản lý cơ sở dữ liệu quan hệ (PostgreSQL)\
-   Giao diện đơn giản, gọn nhẹ

### 🛠️ Tech Stack

#### **Frontend**

-   React (.tsx)\
-   Vite\
-   Ant Design hoặc TailwindCSS

#### **Backend**

-   Node.js\
-   Express.js

#### **Database**

-   PostgreSQL\
-   Tối ưu cho các quan hệ: Users ↔ Posts ↔ Comments

------------------------------------------------------------------------

## 2. Phân quyền Hệ thống (Role-Based Access Control)

### 🔹 1. Guest (Khách vãng lai)

-   Chỉ được đọc\
-   Xem danh sách bài viết\
-   Xem bài viết chi tiết\
-   Xem bình luận

### 🔹 2. User (Thành viên đăng nhập)

Quyền của Guest +\
- Quản lý tài khoản cá nhân\
- Thêm bình luận\
- Chỉnh sửa / xóa bình luận của chính mình

### 🔹 3. Admin (Chủ Blog)

-   CRUD toàn bộ bài viết\
-   Xóa mọi bình luận vi phạm\
-   Quyền quản trị cao nhất

------------------------------------------------------------------------

## 3. Danh sách Use Case

### 🔧 Phân hệ Auth & Profile

-   **UC_01:** Đăng ký\
-   **UC_02:** Đăng nhập (Nhận JWT Token)\
-   **UC_03:** Quản lý hồ sơ cá nhân

### 📝 Phân hệ Bài viết

-   **UC_04:** Xem danh sách bài viết\
-   **UC_05:** Xem chi tiết bài viết\
-   **UC_06:** Tạo bài viết mới (Admin)\
-   **UC_07:** Cập nhật / Xóa bài viết (Admin)

### 💬 Phân hệ Bình luận

-   **UC_08:** Xem bình luận của bài\
-   **UC_09:** Thêm bình luận (User/Admin)\
-   **UC_10:** Xóa bình luận (Chủ comment hoặc Admin)

------------------------------------------------------------------------

## 4. Thiết kế Cơ sở dữ liệu (Database Schema -- PostgreSQL)

### **Bảng Users**

  Field           Type        Ghi chú
  --------------- ----------- -----------------------
  id              UUID (PK)   
  username        Varchar     Not Null
  email           Varchar     Unique, Not Null
  password_hash   Varchar     Mật khẩu băm (bcrypt)
  role            Enum        Default: USER
  created_at      Timestamp   

### **Bảng Posts**

  Field        Type        Ghi chú
  ------------ ----------- -------------
  id           UUID (PK)   
  title        Varchar     Not Null
  content      Text        Not Null
  category     Varchar     Có thể null
  author_id    UUID (FK)   Users.id
  created_at   Timestamp   
  updated_at   Timestamp   

### **Bảng Comments**

  Field        Type        Ghi chú
  ------------ ----------- ----------
  id           UUID (PK)   
  content      Text        Not Null
  post_id      UUID (FK)   Posts.id
  user_id      UUID (FK)   Users.id
  created_at   Timestamp   

------------------------------------------------------------------------

## 5. Đặc tả API (RESTful Endpoints)

  ------------------------------------------------------------------------------
  Chức năng            Method       Endpoint                    Auth
  -------------------- ------------ --------------------------- ----------------
  Đăng ký              POST         /api/auth/register          Public

  Đăng nhập            POST         /api/auth/login             Public (JWT)

  Hồ sơ cá nhân        GET/PUT      /api/users/me               Token

  Lấy danh sách bài    GET          /api/posts                  Public
  viết                                                          

  Lấy chi tiết bài     GET          /api/posts/:id              Public
  viết                                                          

  Tạo bài viết         POST         /api/posts                  Token + ADMIN

  Cập nhật/Xóa bài     PUT/DELETE   /api/posts/:id              Token + ADMIN
  viết                                                          

  Lấy bình luận        GET          /api/posts/:id/comments     Public

  Thêm bình luận       POST         /api/posts/:id/comments     Token

  Xóa bình luận        DELETE       /api/comments/:id           Token
                                                                (Owner/Admin)
  ------------------------------------------------------------------------------

------------------------------------------------------------------------

## 6. Kiến trúc Bảo mật & Kỹ thuật Lõi

### 🔐 Bảo mật mật khẩu

-   Sử dụng **bcrypt** để hash mật khẩu\
-   Tránh lộ mật khẩu thô

### 🔑 Cơ chế Xác thực Stateless (JWT)

-   Người dùng đăng nhập → Backend tạo JWT\
-   Frontend lưu token (localStorage hoặc cookie)\
-   Mọi request gửi kèm: `Authorization: Bearer <token>`

### 🚧 Middleware bảo vệ Route

-   Kiểm tra token\
-   Giải mã role\
-   Chặn User thao tác quyền Admin\
-   Chặn hành động bất hợp pháp trước khi truy cập DB
