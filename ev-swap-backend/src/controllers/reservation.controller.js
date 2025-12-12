const prisma = require("../config/database");

// Tạo đặt chỗ mới
exports.createReservation = async (req, res) => {
  try {
    console.log("📍 Create reservation - Customer ID:", req.user?.id);
    console.log("📍 Request body:", req.body);

    const customerId = req.user.id;
    const { stationId } = req.body;

    if (!stationId) {
      console.log("❌ Missing stationId");
      return res.status(400).json({
        success: false,
        message: "Station ID là bắt buộc.",
      });
    }

    // Kiểm tra trạm có tồn tại
    const station = await prisma.station.findUnique({
      where: { id: parseInt(stationId) },
    });

    console.log("🏢 Station found:", station?.name);

    if (!station) {
      console.log("❌ Station not found");
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy trạm sạc.",
      });
    }

    // Kiểm tra còn slot trống không
    if (station.availableSlots <= 0) {
      console.log("❌ No available slots");
      return res.status(400).json({
        success: false,
        message: "Trạm không còn slot trống để đặt chỗ.",
      });
    }

    // Kiểm tra xem customer đã có reservation pending không
    console.log("🔍 Checking existing reservation for customer:", customerId);
    const existingReservation = await prisma.reservation.findFirst({
      where: {
        customerId,
        status: "pending",
      },
    });

    console.log("📋 Existing reservation:", existingReservation);

    if (existingReservation) {
      console.log("❌ Already has pending reservation");
      return res.status(400).json({
        success: false,
        message: "Bạn đã có một đặt chỗ đang chờ xử lý.",
      });
    }

    // Tạo reservation mới (thời gian đặt = 15 phút từ bây giờ)
    const reservedTime = new Date();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // Hết hạn sau 15 phút

    // Tìm pin available để đặt trước
    const availableSlot = await prisma.slot.findFirst({
      where: {
        stationId: parseInt(stationId),
        status: "full",
        isBatteryPresent: true,
        batteryUid: {
          not: null,
        },
      },
      include: {
        battery: {
          select: {
            uid: true,
            status: true,
          },
        },
      },
    });

    if (!availableSlot) {
      console.log("❌ No available battery found");
      return res.status(400).json({
        success: false,
        message: "Trạm hiện không có pin sẵn sàng để đặt trước.",
      });
    }

    console.log("✨ Creating reservation...");
    const reservation = await prisma.reservation.create({
      data: {
        customerId,
        stationId: parseInt(stationId),
        reservedTime,
        expiresAt,
        status: "pending",
        batteryUid: availableSlot.batteryUid,
      },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
          },
        },
        station: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },
    });

    // Giảm available_slots của station khi đặt chỗ
    await prisma.station.update({
      where: { id: parseInt(stationId) },
      data: {
        availableSlots: {
          decrement: 1,
        },
      },
    });

    console.log("✅ Reservation created:", reservation.id);
    console.log("📦 Available slots giảm 1");

    res.status(201).json({
      success: true,
      message: `Đặt chỗ thành công tại ${reservation.station.name}. Vui lòng đến trạm trong vòng 15 phút.`,
      data: {
        reservationId: reservation.id,
        stationName: reservation.station.name,
        stationLocation: reservation.station.location,
        batteryUid: reservation.batteryUid,
        slotNumber: availableSlot.slotNumber,
        expiresAt: reservation.expiresAt,
        createdAt: reservation.createdAt,
      },
    });
  } catch (error) {
    console.error("❌ Create reservation error:", error);
    console.error("❌ Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi tạo đặt chỗ.",
      error: error.message,
    });
  }
};

// Lấy danh sách reservation của customer
exports.getMyReservations = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { includeExpired } = req.query;

    const whereClause = { customerId };

    // Nếu không include expired, chỉ lấy các status còn active
    if (includeExpired !== "true") {
      whereClause.status = {
        in: ["pending", "confirmed", "completed"],
      };
    }

    const reservations = await prisma.reservation.findMany({
      where: whereClause,
      include: {
        station: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    });

    // Tìm slot number cho mỗi reservation
    const reservationsWithSlot = await Promise.all(
      reservations.map(async (reservation) => {
        if (reservation.batteryUid) {
          const slot = await prisma.slot.findFirst({
            where: {
              stationId: reservation.stationId,
              batteryUid: reservation.batteryUid,
            },
            select: {
              slotNumber: true,
            },
          });

          return {
            id: reservation.id,
            stationName: reservation.station.name,
            stationLocation: reservation.station.location,
            batteryUid: reservation.batteryUid,
            slotNumber: slot?.slotNumber || null,
            status: reservation.status,
            expiresAt: reservation.expiresAt,
            createdAt: reservation.createdAt,
          };
        }

        return {
          id: reservation.id,
          stationName: reservation.station.name,
          stationLocation: reservation.station.location,
          batteryUid: null,
          slotNumber: null,
          status: reservation.status,
          expiresAt: reservation.expiresAt,
          createdAt: reservation.createdAt,
        };
      })
    );

    res.json({
      success: true,
      message: "Lấy danh sách đặt pin thành công",
      data: {
        customer: {
          id: req.user.id,
          username: req.user.username,
          fullName: req.user.fullName,
        },
        reservations: reservationsWithSlot,
      },
    });
  } catch (error) {
    console.error("Get reservations error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách đặt chỗ.",
      error: error.message,
    });
  }
};

// Hủy reservation
exports.cancelReservation = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { reservationId } = req.params;

    const reservation = await prisma.reservation.findFirst({
      where: {
        id: parseInt(reservationId),
        customerId,
      },
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đặt chỗ.",
      });
    }

    if (reservation.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Không thể hủy đặt chỗ với trạng thái ${reservation.status}.`,
      });
    }

    await prisma.reservation.update({
      where: { id: parseInt(reservationId) },
      data: { status: "cancelled" },
    });

    // Tăng lại available_slots khi hủy reservation
    await prisma.station.update({
      where: { id: reservation.stationId },
      data: {
        availableSlots: {
          increment: 1,
        },
      },
    });

    console.log("✅ Reservation cancelled, available_slots tăng 1");

    res.json({
      success: true,
      message: "Đã hủy đặt chỗ thành công.",
    });
  } catch (error) {
    console.error("Cancel reservation error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi hủy đặt chỗ.",
      error: error.message,
    });
  }
};

// Kiểm tra và xử lý reservation khi quét QR
exports.checkReservation = async (customerId, stationId) => {
  try {
    const reservation = await prisma.reservation.findFirst({
      where: {
        customerId,
        stationId: parseInt(stationId),
        status: "pending",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (reservation) {
      // Kiểm tra xem đã hết hạn chưa
      const now = new Date();
      if (now > reservation.expiresAt) {
        // Hết hạn - cập nhật status và hoàn lại slot
        await prisma.reservation.update({
          where: { id: reservation.id },
          data: { status: "expired" },
        });

        // Tăng lại available_slots vì reservation hết hạn
        await prisma.station.update({
          where: { id: reservation.stationId },
          data: {
            availableSlots: {
              increment: 1,
            },
          },
        });

        console.log("⏰ Reservation expired, available_slots tăng 1");
        return { hasReservation: false, expired: true };
      }

      // Còn hạn - trả về reservation để ưu tiên pin
      return { hasReservation: true, reservation };
    }

    return { hasReservation: false };
  } catch (error) {
    console.error("Check reservation error:", error);
    return { hasReservation: false, error: error.message };
  }
};

// Xem pin available tại station
exports.getAvailableBatteries = async (req, res) => {
  try {
    const { stationId } = req.params;

    const station = await prisma.station.findUnique({
      where: { id: parseInt(stationId) },
      include: {
        slots: {
          where: {
            status: "full",
            isBatteryPresent: true,
          },
          include: {
            battery: {
              select: {
                uid: true,
                status: true,
              },
            },
          },
          orderBy: {
            slotNumber: "asc",
          },
        },
      },
    });

    if (!station) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy trạm sạc.",
      });
    }

    // Kiểm tra các slot nào đã được reserved
    const reservedBatteries = await prisma.reservation.findMany({
      where: {
        stationId: parseInt(stationId),
        status: "pending",
      },
      select: {
        batteryUid: true,
      },
    });

    const reservedUids = reservedBatteries.map((r) => r.batteryUid);

    const batteries = station.slots.map((slot) => ({
      slotNumber: slot.slotNumber,
      batteryUid: slot.batteryUid,
      batteryStatus: slot.battery?.status || "unknown",
      isReserved: reservedUids.includes(slot.batteryUid),
    }));

    res.json({
      success: true,
      message: "Lấy danh sách pin thành công",
      data: {
        station: {
          id: station.id,
          name: station.name,
          location: station.location,
          totalSlots: station.totalSlots,
          availableSlots: station.availableSlots,
          reservedSlots: reservedUids.length,
        },
        batteries,
      },
    });
  } catch (error) {
    console.error("Get available batteries error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách pin.",
      error: error.message,
    });
  }
};
