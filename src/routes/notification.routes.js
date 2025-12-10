const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notification.controller");
const { authenticateToken } = require("../middleware/auth.middleware");

// Route cho user - lưu token
router.post("/save-token", authenticateToken, notificationController.saveToken);

// Route cho user - xóa token khi logout
router.post(
  "/delete-token",
  authenticateToken,
  notificationController.deleteToken
);

// Route cho admin - gửi thông báo đến tất cả
router.post("/send-all", authenticateToken, notificationController.sendToAll);

// Route cho admin - gửi thông báo đến 1 user
router.post("/send-user", authenticateToken, notificationController.sendToUser);

// Route cho admin - xem lịch sử gửi
router.get("/history", authenticateToken, notificationController.getHistory);

module.exports = router;
