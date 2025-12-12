const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/transaction.controller");
const authMiddleware = require("../middleware/auth.middleware");

// POST /api/feedback - Gửi feedback
router.post("/", authMiddleware, transactionController.sendFeedback);

module.exports = router;
