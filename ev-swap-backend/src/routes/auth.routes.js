const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");

// POST /api/auth/register - Đăng ký
router.post("/register", authController.register);

// POST /api/auth/login - Đăng nhập
router.post("/login", authController.login);

// POST /api/auth/reset-password - Đặt lại mật khẩu
router.post("/reset-password", authController.resetPassword);

module.exports = router;
