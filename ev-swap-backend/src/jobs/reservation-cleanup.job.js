const prisma = require("../config/database");

/**
 * Cleanup job để tự động expire các reservations hết hạn
 * Chạy định kỳ mỗi 1-5 phút
 */
exports.cleanupExpiredReservations = async () => {
  try {
    const now = new Date();

    console.log("🧹 [Cleanup] Đang kiểm tra reservations hết hạn...");

    // Tìm tất cả reservations có status = 'pending' và đã hết hạn
    const expiredReservations = await prisma.reservation.findMany({
      where: {
        status: "pending",
        expiresAt: {
          lt: now,
        },
      },
      include: {
        station: {
          select: {
            id: true,
            name: true,
          },
        },
        customer: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    if (expiredReservations.length === 0) {
      console.log("✅ [Cleanup] Không có reservations hết hạn");
      return {
        success: true,
        expiredCount: 0,
      };
    }

    console.log(
      `⏰ [Cleanup] Tìm thấy ${expiredReservations.length} reservations hết hạn`
    );

    // Cập nhật status thành 'expired' và hoàn lại slots
    const updatePromises = expiredReservations.map(async (reservation) => {
      console.log(
        `   - Reservation #${reservation.id}: ${reservation.customer.fullName} tại ${reservation.station.name}`
      );

      // Cập nhật status
      await prisma.reservation.update({
        where: { id: reservation.id },
        data: { status: "expired" },
      });

      // Tăng lại available_slots
      await prisma.station.update({
        where: { id: reservation.stationId },
        data: {
          availableSlots: {
            increment: 1,
          },
        },
      });

      return reservation.id;
    });

    const results = await Promise.all(updatePromises);

    console.log(
      `✅ [Cleanup] Đã expire ${results.length} reservations và hoàn lại slots`
    );

    return {
      success: true,
      expiredCount: results.length,
      reservationIds: results,
    };
  } catch (error) {
    console.error("❌ [Cleanup] Lỗi khi cleanup reservations:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Chạy cleanup định kỳ (mỗi 2 phút)
exports.startCleanupScheduler = () => {
  console.log("🚀 [Cleanup] Khởi động scheduler cho reservation cleanup");

  // Chạy ngay lần đầu
  exports.cleanupExpiredReservations();

  // Sau đó chạy mỗi 2 phút
  setInterval(() => {
    exports.cleanupExpiredReservations();
  }, 2 * 60 * 1000); // 2 phút
};
