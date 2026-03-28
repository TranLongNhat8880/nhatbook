require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function migrate() {
  try {
    console.log("Đang chạy Migration tạo bảng post_likes...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS post_likes (
        post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (post_id, user_id)
      );
    `);
    console.log("🎉 Hoàn tất Migration!");
  } catch (error) {
    console.error("Lỗi:", error.message);
  } finally {
    pool.end();
  }
}

migrate();
