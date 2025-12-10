const express = require("express");
const router = express.Router();
const iotController = require("../controllers/iot.controller");
const iotAuthMiddleware = require("../middleware/iot-auth.middleware");

// POST /api/iot/battery/validate - Validate pin khi quét RFID
router.post(
  "/battery/validate",
  iotAuthMiddleware,
  iotController.validateBattery
);

// POST /api/iot/slot/status-update - Cập nhật trạng thái slot
router.post(
  "/slot/status-update",
  iotAuthMiddleware,
  iotController.updateSlotStatus
);

module.exports = router;
