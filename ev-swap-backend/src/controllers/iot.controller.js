const prisma = require("../config/database");

// Validate pin khi quét RFID
exports.validateBattery = async (req, res) => {
  try {
    const { battery_uid } = req.body;

    if (!battery_uid) {
      return res.status(400).json({
        success: false,
        message: "Battery UID là bắt buộc.",
      });
    }

    // Kiểm tra pin có tồn tại trong database
    const battery = await prisma.battery.findUnique({
      where: { uid: battery_uid },
    });

    if (!battery) {
      return res.status(404).json({
        success: false,
        valid: false,
        message: "Pin không hợp lệ. Không tìm thấy trong hệ thống.",
      });
    }

    // Kiểm tra trạng thái pin
    const isValid =
      battery.status !== "maintenance" && battery.chargeCycles < 1000;

    res.json({
      success: true,
      valid: isValid,
      data: {
        uid: battery.uid,
        status: battery.status,
        chargeLevel: battery.chargeLevel,
        chargeCycles: battery.chargeCycles,
      },
      message: isValid
        ? "Pin hợp lệ."
        : "Pin cần bảo trì hoặc đã quá hạn sử dụng.",
    });
  } catch (error) {
    console.error("Validate battery error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi validate pin.",
      error: error.message,
    });
  }
};

// Cập nhật trạng thái slot
exports.updateSlotStatus = async (req, res) => {
  try {
    const { station_id, slot_number, status, battery_uid, charge_level } =
      req.body;

    // Validate input
    if (!station_id || !slot_number || !status) {
      return res.status(400).json({
        success: false,
        message: "station_id, slot_number và status là bắt buộc.",
      });
    }

    // Tìm slot
    const slot = await prisma.slot.findFirst({
      where: {
        stationId: parseInt(station_id),
        slotNumber: parseInt(slot_number),
      },
    });

    if (!slot) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy slot.",
      });
    }

    // Cập nhật slot
    const updatedSlot = await prisma.slot.update({
      where: { id: slot.id },
      data: {
        status,
        batteryUid: battery_uid || null,
        isBatteryPresent: !!battery_uid,
        chargeLevel: charge_level || null,
        isLocked: status === "full" || status === "charging",
        lastUpdated: new Date(),
      },
    });

    // Nếu có battery_uid, cập nhật thông tin pin
    if (battery_uid) {
      await prisma.battery.update({
        where: { uid: battery_uid },
        data: {
          chargeLevel: charge_level || 0,
          status:
            status === "full"
              ? "good"
              : status === "charging"
              ? "charging"
              : "average",
          lastCharged: status === "full" ? new Date() : undefined,
        },
      });
    }

    // Cập nhật số lượng available slots của trạm
    const fullSlots = await prisma.slot.count({
      where: {
        stationId: parseInt(station_id),
        status: "full",
        isBatteryPresent: true,
      },
    });

    const totalSlots = await prisma.slot.count({
      where: {
        stationId: parseInt(station_id),
      },
    });

    await prisma.station.update({
      where: { id: parseInt(station_id) },
      data: {
        availableSlots: fullSlots,
        status:
          fullSlots === 0
            ? "out_of_battery"
            : fullSlots < 2
            ? "low_battery"
            : "active",
      },
    });

    res.json({
      success: true,
      message: "Cập nhật trạng thái slot thành công.",
      data: updatedSlot,
    });
  } catch (error) {
    console.error("Update slot status error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật trạng thái slot.",
      error: error.message,
    });
  }
};
