const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/transaction.controller");
const authMiddleware = require("../middleware/auth.middleware");

// POST /api/transactions/start-swap - Bắt đầu đổi pin
router.post("/start-swap", authMiddleware, transactionController.startSwap);

// POST /api/transactions/confirm-swap - Xác nhận hoàn thành đổi pin
router.post("/confirm-swap", authMiddleware, transactionController.confirmSwap);

// POST /api/transactions/cancel-swap - Hủy giao dịch đổi pin
router.post("/cancel-swap", authMiddleware, transactionController.cancelSwap);

// GET /api/transactions/:id/status - Lấy trạng thái giao dịch
router.get(
  "/:id/status",
  authMiddleware,
  transactionController.getTransactionStatus
);

module.exports = router;
