const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const pool = require("../src/config/db");

// LẤY THÔNG TIN TỪ .ENV
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const AMOUNT = 50000; // Số xu muốn bơm

const hackCoin = async () => {
    try {
        console.log(`Đang nạp ${AMOUNT} NC cho ${ADMIN_EMAIL}...`);
        const res = await pool.query(
            "UPDATE users SET balance = balance + $1 WHERE email = $2 RETURNING username, balance",
            [AMOUNT, ADMIN_EMAIL]
        );

        if (res.rows.length > 0) {
            console.log(`THÀNH CÔNG!`);
            console.log(`User: ${res.rows[0].username}`);
            console.log(`Số dư mới: ${res.rows[0].balance} NC`);
        } else {
            console.log("Thất bại: Không tìm thấy Email này trong hệ thống.");
        }
        process.exit(0);
    } catch (err) {
        console.error("Lỗi hệ thống:", err.message);
        process.exit(1);
    }
};

hackCoin();
