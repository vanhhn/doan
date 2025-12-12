require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/auth.routes");
const customerRoutes = require("./routes/customer.routes");
const stationRoutes = require("./routes/station.routes");
const transactionRoutes = require("./routes/transaction.routes");
const feedbackRoutes = require("./routes/feedback.routes");
const iotRoutes = require("./routes/iot.routes");
const reservationRoutes = require("./routes/reservation.routes");
const notificationRoutes = require("./routes/notification.routes");
const paymentRoutes = require("./routes/payment.routes");
const { startBatteryChargingJob } = require("./jobs/battery-charging.job");
const { startCleanupScheduler } = require("./jobs/reservation-cleanup.job");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/me", customerRoutes);
app.use("/api/stations", stationRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/iot", iotRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/payment", paymentRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "EV Swap Backend API is running!",
    version: "1.0.0",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📡 API URL: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);

  // Khởi động job tự động cập nhật pin sạc
  startBatteryChargingJob();

  // Khởi động job tự động hết hạn đặt pin
  startCleanupScheduler();
});

module.exports = app;
