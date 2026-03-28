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
    console.log("Đang chạy Migration thêm parent_id cho bảng comments...");
    await pool.query(`
      ALTER TABLE comments 
      ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES comments(id) ON DELETE CASCADE;
    `);
    console.log("🎉 Hoàn tất Migration!");
  } catch (error) {
    console.error("Lỗi:", error.message);
  } finally {
    pool.end();
  }
}

migrate();
