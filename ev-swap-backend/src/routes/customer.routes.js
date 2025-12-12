const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const customerController = require("../controllers/customer.controller");
const authMiddleware = require("../middleware/auth.middleware");

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "avatar-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ chấp nhận file ảnh (jpg, jpeg, png, gif)"));
    }
  },
});

// GET /api/me/profile - Lấy thông tin cá nhân
router.get("/profile", authMiddleware, customerController.getProfile);

// PUT /api/me/profile - Cập nhật thông tin cá nhân
router.put("/profile", authMiddleware, customerController.updateProfile);

// POST /api/me/upload-avatar - Upload ảnh đại diện
router.post(
  "/upload-avatar",
  authMiddleware,
  upload.single("avatar"),
  customerController.uploadAvatar
);

// POST /api/me/topup - Nạp tiền vào ví
router.post("/topup", authMiddleware, customerController.topUpBalance);

// GET /api/me/history - Lấy lịch sử giao dịch
router.get("/history", authMiddleware, customerController.getHistory);

module.exports = router;
