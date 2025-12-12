const express = require("express");
const router = express.Router();
const stationController = require("../controllers/station.controller");
const authMiddleware = require("../middleware/auth.middleware");

// GET /api/stations - Lấy danh sách tất cả trạm
router.get("/", stationController.getAllStations);

// GET /api/stations/nearby - Lấy danh sách trạm gần đây
router.get("/nearby", stationController.getNearbyStations);

// GET /api/stations/:id - Lấy thông tin chi tiết một trạm
router.get("/:id", stationController.getStationById);

// GET /api/stations/:id/batteries - Lấy danh sách pin available tại trạm
router.get("/:id/batteries", stationController.getAvailableBatteries);

// GET /api/stations/:id/stats - Lấy thống kê trạm
router.get("/:id/stats", stationController.getStationStats);

// PUT /api/stations/:id - Cập nhật thông tin trạm (cần auth)
router.put("/:id", authMiddleware, stationController.updateStation);

module.exports = router;
