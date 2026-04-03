const express = require("express");
const router = express.Router();
const { buyItem, getInventory, toggleEquip } = require("../controllers/shop.controller");
const { verifyToken } = require("../middleware/auth");

// POST /api/shop/buy - Mua vật phẩm bằng NhatCoin
router.post("/buy", verifyToken, buyItem);

// PUT /api/shop/equip - Sử dụng/Tháo vật phẩm
router.put("/equip", verifyToken, toggleEquip);

// GET /api/shop/inventory - Lấy kho đồ của mình
router.get("/inventory", verifyToken, getInventory);

module.exports = router;
