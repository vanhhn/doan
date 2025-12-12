const express = require("express");
const router = express.Router();
const reservationController = require("../controllers/reservation.controller");
const { authenticateToken } = require("../middleware/auth.middleware");

// POST /api/reservations - Tạo đặt chỗ mới
router.post("/", authenticateToken, reservationController.createReservation);

// GET /api/reservations - Lấy danh sách đặt chỗ của mình
router.get("/", authenticateToken, reservationController.getMyReservations);

// GET /api/reservations/stations/:stationId/batteries - Xem pin available tại station
router.get(
  "/stations/:stationId/batteries",
  reservationController.getAvailableBatteries
);

// DELETE /api/reservations/:reservationId - Hủy đặt chỗ
router.delete(
  "/:reservationId",
  authenticateToken,
  reservationController.cancelReservation
);

module.exports = router;
