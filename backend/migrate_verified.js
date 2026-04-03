const pool = require("./src/config/db");

async function migrateIsVerified() {
  try {
    console.log("Adding is_verified column to users table...");
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
    `);

    console.log("Setting existing users as verified...");
    await pool.query(`
      UPDATE users SET is_verified = true WHERE is_verified = false OR is_verified IS NULL;
    `);

    console.log("Database update completed.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    process.exit();
  }
}

migrateIsVerified();
