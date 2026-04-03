const pool = require("./src/config/db");

async function migrate() {
  try {
    console.log("Adding reset_token columns to users table...");
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS reset_token VARCHAR(10),
      ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP;
    `);
    console.log("Database updated successfully.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    process.exit();
  }
}

migrate();
