const pool = require("../src/config/db");

async function run() {
  try {
    console.log("Đang gỡ bỏ ràng buộc số dư >= 0 (Xử lý cưỡng bức)...");
    // Thử xóa tất cả các ràng buộc có thể liên quan đến balance >= 0
    await pool.query("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_balance_check");
    await pool.query("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_balance_check1");
    
    console.log("Đang cập nhật số dư cho nhatlong200517@gmail.com thành -600...");
    const res = await pool.query(
      "UPDATE users SET balance = -600 WHERE email = 'nhatlong200517@gmail.com' RETURNING username, balance"
    );
    
    if (res.rows.length > 0) {
      console.log("Cập nhật THÀNH CÔNG:", res.rows[0]);
    } else {
      console.log("KHÔNG TÌM THẤY user với email này.");
    }
    process.exit(0);
  } catch (err) {
    console.error("LỖI TRUY VẤN:", err.message);
    process.exit(1);
  }
}

run();
