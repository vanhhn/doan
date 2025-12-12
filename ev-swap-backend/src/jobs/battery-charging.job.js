const prisma = require("../config/database");

// Job tự động cập nhật pin từ "charging" sang "full" sau 30 phút
const updateChargingBatteries = async () => {
  try {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    // Tìm tất cả pin đang sạc và đã qua 30 phút
    const batteries = await prisma.battery.findMany({
      where: {
        status: "charging",
        lastCharged: {
          lte: thirtyMinutesAgo, // <= 30 phút trước
        },
      },
    });

    if (batteries.length === 0) {
      return;
    }

    console.log(
      `🔋 Tìm thấy ${batteries.length} pin đã sạc xong, đang cập nhật...`
    );

    // Cập nhật tất cả pin sang status "full"
    const updatePromises = batteries.map((battery) =>
      prisma.battery.update({
        where: { uid: battery.uid },
        data: {
          status: "full",
          chargeCycles: {
            increment: 1,
          },
        },
      })
    );

    await Promise.all(updatePromises);

    console.log(
      `✅ Đã cập nhật ${batteries.length} pin sang trạng thái "full"`
    );
  } catch (error) {
    console.error("❌ Lỗi khi cập nhật pin đang sạc:", error);
  }
};

// Chạy job mỗi 1 phút
const startBatteryChargingJob = () => {
  console.log("⚡ Khởi động job tự động cập nhật pin đang sạc");

  // Chạy ngay lần đầu
  updateChargingBatteries();

  // Sau đó chạy mỗi 1 phút
  setInterval(updateChargingBatteries, 60 * 1000); // 1 phút
};

module.exports = { startBatteryChargingJob, updateChargingBatteries };
