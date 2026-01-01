const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const {
  validateRegister,
  validateLogin,
  validateResetPassword,
} = require("../middleware/validation.middleware");

// POST /api/auth/register - Đăng ký (với validation middleware)
router.post("/register", validateRegister, authController.register);

// POST /api/auth/login - Đăng nhập (với validation middleware)
router.post("/login", validateLogin, authController.login);

// POST /api/auth/reset-password - Đặt lại mật khẩu (với validation middleware)
router.post(
  "/reset-password",
  validateResetPassword,
  authController.resetPassword
);

module.exports = router;
