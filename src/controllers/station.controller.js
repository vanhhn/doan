const prisma = require("../config/database");

// Lấy danh sách tất cả trạm
exports.getAllStations = async (req, res) => {
  try {
    const stations = await prisma.station.findMany({
      select: {
        id: true,
        name: true,
        location: true,
        status: true,
        totalSlots: true,
        availableSlots: true,
        lastMaintenance: true,
        slots: {
          select: {
            id: true,
            slotNumber: true,
            status: true,
            isBatteryPresent: true,
            chargeLevel: true,
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    });

    // Tính toán số lượng pin đầy (sẵn sàng sử dụng)
    const stationsWithAvailableBatteries = stations.map((station) => {
      const fullBatteries = station.slots.filter(
        (slot) =>
          slot.status === "full" &&
          slot.isBatteryPresent &&
          slot.chargeLevel >= 80
      ).length;

      return {
        ...station,
        fullBatteries,
      };
    });

    res.json({
      success: true,
      data: stationsWithAvailableBatteries,
    });
  } catch (error) {
    console.error("Get all stations error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách trạm.",
      error: error.message,
    });
  }
};

// Lấy thông tin chi tiết một trạm
exports.getStationById = async (req, res) => {
  try {
    const { id } = req.params;

    const station = await prisma.station.findUnique({
      where: { id: parseInt(id) },
      include: {
        slots: {
          include: {
            battery: {
              select: {
                uid: true,
                status: true,
                chargeLevel: true,
                chargeCycles: true,
                lastCharged: true,
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
        message: "Không tìm thấy trạm.",
      });
    }

    // Phân loại các slot
    const slotsSummary = {
      full: station.slots.filter(
        (s) => s.status === "full" && s.isBatteryPresent
      ).length,
      charging: station.slots.filter((s) => s.status === "charging").length,
      empty: station.slots.filter(
        (s) => s.status === "empty" || !s.isBatteryPresent
      ).length,
      maintenance: station.slots.filter((s) => s.status === "maintenance")
        .length,
    };

    res.json({
      success: true,
      data: {
        ...station,
        slotsSummary,
      },
    });
  } catch (error) {
    console.error("Get station by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thông tin trạm.",
      error: error.message,
    });
  }
};

// Lấy danh sách trạm gần đây dựa trên tọa độ
exports.getNearbyStations = async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "Latitude và longitude là bắt buộc.",
      });
    }

    // Đây là một implementation đơn giản
    // Trong thực tế bạn có thể sử dụng PostGIS hoặc tính toán khoảng cách chính xác hơn
    const stations = await prisma.station.findMany({
      where: {
        status: "active",
      },
      include: {
        slots: {
          where: {
            status: "full",
            isBatteryPresent: true,
          },
        },
      },
    });

    // Tính khoảng cách đơn giản (có thể cải thiện với công thức haversine)
    const stationsWithDistance = stations
      .map((station) => {
        // Giả sử có tọa độ trong database hoặc tính toán mock
        const stationLat = parseFloat(lat) + (Math.random() - 0.5) * 0.1; // Mock data
        const stationLng = parseFloat(lng) + (Math.random() - 0.5) * 0.1; // Mock data

        const distance =
          Math.sqrt(
            Math.pow(parseFloat(lat) - stationLat, 2) +
              Math.pow(parseFloat(lng) - stationLng, 2)
          ) * 111; // Approximate km conversion

        return {
          ...station,
          latitude: stationLat,
          longitude: stationLng,
          distance: parseFloat(distance.toFixed(1)),
          availableBatteries: station.slots.length,
        };
      })
      .filter((station) => station.distance <= parseFloat(radius))
      .sort((a, b) => a.distance - b.distance);

    res.json({
      success: true,
      message: "Lấy danh sách trạm gần đây thành công.",
      data: stationsWithDistance,
    });
  } catch (error) {
    console.error("Get nearby stations error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách trạm.",
      error: error.message,
    });
  }
};

// Cập nhật thông tin trạm
exports.updateStation = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, status } = req.body;

    const updatedStation = await prisma.station.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(location && { location }),
        ...(status && { status }),
      },
    });

    res.json({
      success: true,
      message: "Cập nhật thông tin trạm thành công.",
      data: updatedStation,
    });
  } catch (error) {
    console.error("Update station error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật trạm.",
      error: error.message,
    });
  }
};

// Lấy thống kê trạm
exports.getStationStats = async (req, res) => {
  try {
    const { id } = req.params;

    const station = await prisma.station.findUnique({
      where: { id: parseInt(id) },
      include: {
        slots: {
          include: {
            battery: true,
          },
        },
        transactionLogs: {
          where: {
            transactionTime: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
          },
        },
      },
    });

    if (!station) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy trạm.",
      });
    }

    const stats = {
      totalSlots: station.totalSlots,
      availableSlots: station.availableSlots,
      occupiedSlots: station.totalSlots - station.availableSlots,
      fullBatteries: station.slots.filter(
        (slot) => slot.status === "full" && slot.battery?.chargeLevel >= 80
      ).length,
      chargingBatteries: station.slots.filter(
        (slot) => slot.status === "charging"
      ).length,
      emptySlots: station.slots.filter((slot) => slot.status === "empty")
        .length,
      totalTransactions: station.transactionLogs.length,
      averageUsagePerDay: station.transactionLogs.length / 30,
    };

    res.json({
      success: true,
      message: "Lấy thống kê trạm thành công.",
      data: {
        station: {
          id: station.id,
          name: station.name,
          location: station.location,
          status: station.status,
        },
        stats,
      },
    });
  } catch (error) {
    console.error("Get station stats error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thống kê trạm.",
      error: error.message,
    });
  }
};
