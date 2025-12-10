const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");
const { authenticateToken } = require("../middleware/auth.middleware");

// Tạo payment request với MoMo
router.post(
  "/momo/create",
  authenticateToken,
  paymentController.createMoMoPayment
);

// Callback từ MoMo (IPN)
router.post("/momo/callback", paymentController.momoCallback);

// Redirect URL sau khi thanh toán
router.get("/momo/return", paymentController.momoReturn);

// Manual completion cho testing (do MoMo test không gọi callback)
router.post(
  "/momo/manual-complete/:orderId",
  authenticateToken,
  paymentController.manualCompleteMoMo
);

module.exports = router;
