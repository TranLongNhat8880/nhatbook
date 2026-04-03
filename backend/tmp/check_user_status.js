const pool = require("../src/config/db");

async function run() {
  try {
    const email = 'nhatlong200517@gmail.com';
    const userRes = await pool.query(
      "SELECT id, username, balance, is_locked, violation_count FROM users WHERE email = $1",
      [email]
    );

    if (userRes.rows.length === 0) {
      console.log("No user found.");
      return;
    }

    const user = userRes.rows[0];
    console.log("USER STATUS:", JSON.stringify(user, null, 2));

    const transRes = await pool.query(
      "SELECT amount, type, description, created_at FROM nhatcoin_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5",
      [user.id]
    );
    console.log("LAST 5 TRANSACTIONS:", JSON.stringify(transRes.rows, null, 2));

  } catch (err) {
    console.error("ERROR:", err.message);
  } finally {
    process.exit(0);
  }
}

run();
