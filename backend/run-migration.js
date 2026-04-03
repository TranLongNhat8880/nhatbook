const fs = require("fs");
const path = require("path");
const pool = require("./src/config/db");

const runMigration = async () => {
  const migrationPath = path.join(__dirname, "db/migrations/02_add_nhatcoin_fields.sql");
  const sql = fs.readFileSync(migrationPath, "utf-8");

  try {
    console.log("Đang chạy migration NhatCoin...");
    await pool.query(sql);
    console.log("Migration thành công!");
    process.exit(0);
  } catch (err) {
    console.error("Lỗi khi chạy migration:", err.message);
    process.exit(1);
  }
};

runMigration();
