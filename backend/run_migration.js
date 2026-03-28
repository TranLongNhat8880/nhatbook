require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function runMigration() {
  try {
    console.log("Đang chạy SQL để thêm cột avatar_url...");
    await pool.query("ALTER TABLE users ADD COLUMN avatar_url VARCHAR(255);");
    console.log("Thành công! Đã thêm avatar_url vào bảng users. 🎉");
  } catch (error) {
    if (error.code === "42701") {
        console.log("Bỏ qua: Cột avatar_url đã tồn tại trong bảng users.");
    } else {
        console.error("Lỗi:", error.message);
    }
  } finally {
    pool.end();
  }
}

runMigration();
