require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function migrateSocials() {
  console.log("Bat dau them cac cot MXH vao bang users...");
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    
    // Them cot Facebook (Kiem tra truoc khi them bang cach bo qua loi neu da co)
    console.log("1. Them facebook_url...");
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS facebook_url VARCHAR(255)`);

    // Them cot Instagram
    console.log("2. Them instagram_url...");
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS instagram_url VARCHAR(255)`);

    // Them cot Threads
    console.log("3. Them threads_url...");
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS threads_url VARCHAR(255)`);

    await client.query("COMMIT");
    console.log("Them thanh cong tat ca cac cot MXH!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Da xay ra loi khi Migrating:", err);
  } finally {
    client.release();
    pool.end();
  }
}

migrateSocials();
