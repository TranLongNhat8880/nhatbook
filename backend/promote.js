require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function makeAdmin() {
  try {
    console.log("Đang kiểm tra danh sách tài khoản hiện tại...");
    const res = await pool.query("SELECT email, username FROM users LIMIT 5");
    
    if (res.rows.length === 0) {
      console.log("Chưa có tài khoản nào được tạo. Bạn hãy vào trang web Đăng ký một tài khoản trước nhé!");
    } else {
      console.log("Tài khoản tìm thấy:", res.rows);
      
      // Mặc định cấp quyền Admin cho tất cả các tài khoản đang có trong máy bạn (vì đây là máy cá nhân)
      await pool.query("UPDATE users SET role = 'ADMIN'");
      console.log("🎉 ĐÃ CẤP QUYỀN ADMIN CHO TOÀN BỘ CÁC TÀI KHOẢN TRÊN!");
    }
  } catch (error) {
    console.error("Lỗi:", error.message);
  } finally {
    pool.end();
  }
}

makeAdmin();
