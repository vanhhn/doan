const prisma = require("../config/database");
const { checkReservation } = require("./reservation.controller");

// Bắt đầu giao dịch đổi pin
exports.startSwap = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { stationId, oldBatteryUid } = req.body;

    // Validate input
    if (!stationId) {
      return res.status(400).json({
        success: false,
        message: "Station ID là bắt buộc.",
      });
    }

    // Kiểm tra reservation
    const reservationCheck = await checkReservation(customerId, stationId);
    if (reservationCheck.expired) {
      return res.status(400).json({
        success: false,
        message: "Đặt chỗ của bạn đã hết hạn. Vui lòng đặt lại.",
      });
    }

    console.log(
      reservationCheck.hasReservation
        ? `✅ Khách hàng có reservation - Ưu tiên pin ${reservationCheck.reservation.batteryUid}`
        : "ℹ️ Khách hàng không có reservation"
    );

    // Kiểm tra trạm có tồn tại và đang hoạt động
    const station = await prisma.station.findUnique({
      where: { id: parseInt(stationId) },
      include: {
        slots: {
          where: {
            status: "full",
            isBatteryPresent: true,
          },
          include: {
            battery: true,
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

    if (station.status !== "active") {
      return res.status(400).json({
        success: false,
        message: `Trạm đang ${station.status}. Không thể thực hiện đổi pin.`,
      });
    }

    // Kiểm tra số dư trước khi bắt đầu
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { balance: true },
    });

    const swapCost = 7000; // Chi phí đổi pin

    if (customer.balance < swapCost) {
      return res.status(400).json({
        success: false,
        message: `Số dư không đủ. Cần ${swapCost.toLocaleString()}đ, hiện có ${customer.balance.toLocaleString()}đ.`,
      });
    }

    // Ưu tiên slot có pin đã được đặt trước (nếu có reservation)
    let availableSlot;
    if (reservationCheck.hasReservation) {
      const reservedBatteryUid = reservationCheck.reservation.batteryUid;
      availableSlot = station.slots.find(
        (slot) => slot.batteryUid === reservedBatteryUid
      );

      if (!availableSlot) {
        console.log("⚠️ Pin đã đặt không còn available, tìm pin khác");
      } else {
        console.log(
          `🔋 Sử dụng pin đã đặt: ${reservedBatteryUid} tại slot ${availableSlot.slotNumber}`
        );
      }
    }

    // Nếu không có reservation hoặc pin đã đặt không available, tìm pin khác
    if (!availableSlot) {
      // Lấy danh sách pin đã được reserved bởi người khác
      const otherReservations = await prisma.reservation.findMany({
        where: {
          stationId: parseInt(stationId),
          status: "pending",
          customerId: {
            not: customerId,
          },
        },
        select: {
          batteryUid: true,
        },
      });

      const reservedByOthers = otherReservations.map((r) => r.batteryUid);
      console.log("🔒 Pin đã được đặt bởi người khác:", reservedByOthers);

      // Tìm slot có pin đầy và không bị reserved bởi người khác
      availableSlot = station.slots.find(
        (slot) =>
          slot.battery &&
          (slot.battery.status === "full" ||
            slot.battery.status === "in_stock") &&
          !reservedByOthers.includes(slot.batteryUid)
      );
    }

    if (!availableSlot) {
      return res.status(400).json({
        success: false,
        message: "Trạm hiện không có pin đầy. Vui lòng chọn trạm khác.",
      });
    }

    // Tìm slot trống để cắm pin cũ (nếu có)
    let slotIn = null;
    let emptySlotId = null;
    if (oldBatteryUid) {
      const emptySlot = await prisma.slot.findFirst({
        where: {
          stationId: parseInt(stationId),
          status: "empty",
          isBatteryPresent: false,
        },
      });

      if (emptySlot) {
        slotIn = emptySlot.slotNumber;
        emptySlotId = emptySlot.id;

        // Cập nhật slot với pin cũ
        await prisma.slot.update({
          where: { id: emptySlot.id },
          data: {
            status: "full",
            isBatteryPresent: true,
            batteryUid: oldBatteryUid,
            isLocked: true,
          },
        });

        // Cập nhật trạng thái pin cũ thành "charging" và lưu thời gian bắt đầu sạc
        await prisma.battery.update({
          where: { uid: oldBatteryUid },
          data: {
            status: "charging",
            lastCharged: new Date(),
          },
        });

        // Tăng available_slots vì có pin mới cắm vào
        await prisma.station.update({
          where: { id: parseInt(stationId) },
          data: {
            availableSlots: {
              increment: 1,
            },
          },
        });

        console.log(
          `🔋 Pin cũ ${oldBatteryUid} đã được cắm vào slot ${slotIn}, chuyển sang trạng thái "charging", available_slots tăng 1`
        );
      }
    }

    // Tạo transaction log và trừ tiền ngay
    const transaction = await prisma.transactionLog.create({
      data: {
        customerId,
        stationId: parseInt(stationId),
        requestType: "swap",
        oldBatteryUid: oldBatteryUid || null,
        slotIn: slotIn,
        newBatteryUid: availableSlot.batteryUid,
        slotOut: availableSlot.slotNumber,
        cost: swapCost, // Set giá đúng 7000đ
        status: "completed", // Đổi từ pending sang completed
      },
      include: {
        station: {
          select: {
            name: true,
            location: true,
          },
        },
        newBattery: {
          select: {
            uid: true,
          },
        },
      },
    });

    console.log(`💰 Đang trừ ${swapCost}đ từ khách hàng ID ${customerId}`);

    // Trừ tiền và cập nhật totalSwaps
    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        balance: {
          decrement: swapCost,
        },
        totalSwaps: {
          increment: 1,
        },
      },
      select: {
        id: true,
        balance: true,
        totalSwaps: true,
      },
    });

    console.log(
      `✅ Số dư mới: ${updatedCustomer.balance}đ, Tổng lần đổi: ${updatedCustomer.totalSwaps}`
    );

    // TODO: Gửi lệnh mở khóa qua MQTT/WebSocket
    // Ví dụ: mqttClient.publish(`station/${stationId}/commands`, JSON.stringify({
    //   command: 'unlock',
    //   slot: availableSlot.slotNumber,
    //   transactionId: transaction.id
    // }));

    // Cập nhật slot (mở khóa và đánh dấu pin đã lấy)
    await prisma.slot.update({
      where: { id: availableSlot.id },
      data: {
        isLocked: false,
        status: "empty",
        isBatteryPresent: false,
        batteryUid: null,
      },
    });

    // Cập nhật pin mới thành "in_use"
    await prisma.battery.update({
      where: { uid: availableSlot.batteryUid },
      data: {
        status: "in_use",
      },
    });

    // Cập nhật available_slots của station (giảm đi 1)
    await prisma.station.update({
      where: { id: parseInt(stationId) },
      data: {
        availableSlots: {
          decrement: 1,
        },
      },
    });

    console.log(
      `📦 Slot ${availableSlot.slotNumber} đã được làm trống, available_slots giảm 1`
    );

    // Nếu có reservation, cập nhật status thành "completed"
    if (reservationCheck.hasReservation) {
      await prisma.reservation.update({
        where: { id: reservationCheck.reservation.id },
        data: {
          status: "completed",
        },
      });
      console.log(
        `✅ Reservation #${reservationCheck.reservation.id} đã hoàn thành`
      );
    }

    res.status(201).json({
      success: true,
      message:
        "Yêu cầu đổi pin thành công. Vui lòng lấy pin tại khay số " +
        availableSlot.slotNumber,
      data: {
        transaction,
        slotNumber: availableSlot.slotNumber,
        batteryUid: availableSlot.batteryUid,
        slotInNumber: slotIn,
      },
    });
  } catch (error) {
    console.error("Start swap error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi thực hiện đổi pin.",
      error: error.message,
    });
  }
};

// Gửi feedback
exports.sendFeedback = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { content, rating } = req.body;

    // Validate input
    if (!content) {
      return res.status(400).json({
        success: false,
        message: "Nội dung feedback là bắt buộc.",
      });
    }

    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: "Rating phải từ 1 đến 5.",
      });
    }

    const feedback = await prisma.feedback.create({
      data: {
        customerId,
        content,
        rating: rating || null,
      },
    });

    res.status(201).json({
      success: true,
      message: "Gửi feedback thành công. Cảm ơn bạn đã đóng góp ý kiến!",
      data: feedback,
    });
  } catch (error) {
    console.error("Send feedback error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi gửi feedback.",
      error: error.message,
    });
  }
};

// Xác nhận hoàn thành đổi pin
exports.confirmSwap = async (req, res) => {
  try {
    const { transactionId, oldBatteryUid } = req.body;
    const customerId = req.user.id;

    // Kiểm tra transaction có tồn tại và thuộc về user hiện tại
    const transaction = await prisma.transactionLog.findFirst({
      where: {
        id: parseInt(transactionId),
        customerId,
        status: "pending",
      },
      include: {
        station: true,
      },
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy giao dịch hoặc giao dịch đã hoàn thành.",
      });
    }

    // Kiểm tra số dư
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { balance: true },
    });

    const swapCost = 5000; // Chi phí đổi pin

    if (customer.balance < swapCost) {
      return res.status(400).json({
        success: false,
        message: `Số dư không đủ. Cần ${swapCost.toLocaleString()}đ, hiện có ${customer.balance.toLocaleString()}đ.`,
      });
    }

    // Cập nhật transaction status và trừ tiền
    const updatedTransaction = await prisma.transactionLog.update({
      where: { id: parseInt(transactionId) },
      data: {
        status: "completed",
        completedTime: new Date(),
        oldBatteryUid: oldBatteryUid || transaction.oldBatteryUid,
        cost: swapCost,
      },
    });

    // Cập nhật current battery của customer và trừ tiền
    await prisma.customer.update({
      where: { id: customerId },
      data: {
        currentBatteryUid: transaction.newBatteryUid,
        totalSwaps: { increment: 1 },
        balance: { decrement: swapCost },
      },
    });

    // Cập nhật slot status sau khi đổi pin
    if (transaction.slotOut) {
      await prisma.slot.update({
        where: {
          stationId: transaction.stationId,
          slotNumber: transaction.slotOut,
        },
        data: {
          status: "empty",
          isBatteryPresent: false,
          isLocked: true,
          batteryUid: null,
        },
      });
    }

    // Nếu có pin cũ được trả lại
    if (oldBatteryUid && transaction.slotIn) {
      await prisma.slot.update({
        where: {
          stationId: transaction.stationId,
          slotNumber: transaction.slotIn,
        },
        data: {
          status: "charging",
          isBatteryPresent: true,
          batteryUid: oldBatteryUid,
        },
      });

      // Cập nhật battery status
      await prisma.battery.update({
        where: { uid: oldBatteryUid },
        data: {
          status: "charging",
        },
      });
    }

    // Cập nhật available slots của station
    await prisma.station.update({
      where: { id: transaction.stationId },
      data: {
        availableSlots: { decrement: 1 },
      },
    });

    res.json({
      success: true,
      message: "Đổi pin hoàn thành thành công!",
      data: updatedTransaction,
    });
  } catch (error) {
    console.error("Confirm swap error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi xác nhận đổi pin.",
      error: error.message,
    });
  }
};

// Hủy giao dịch đổi pin
exports.cancelSwap = async (req, res) => {
  try {
    const { transactionId } = req.body;
    const customerId = req.user.id;

    // Kiểm tra transaction
    const transaction = await prisma.transactionLog.findFirst({
      where: {
        id: parseInt(transactionId),
        customerId,
        status: "pending",
      },
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy giao dịch hoặc giao dịch đã hoàn thành.",
      });
    }

    // Cập nhật transaction status
    await prisma.transactionLog.update({
      where: { id: parseInt(transactionId) },
      data: {
        status: "cancelled",
        completedTime: new Date(),
      },
    });

    // Khóa lại slot
    if (transaction.slotOut) {
      await prisma.slot.update({
        where: {
          stationId: transaction.stationId,
          slotNumber: transaction.slotOut,
        },
        data: {
          isLocked: true,
        },
      });
    }

    res.json({
      success: true,
      message: "Hủy giao dịch thành công.",
    });
  } catch (error) {
    console.error("Cancel swap error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi hủy giao dịch.",
      error: error.message,
    });
  }
};

// Lấy trạng thái giao dịch
exports.getTransactionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = req.user.id;

    const transaction = await prisma.transactionLog.findFirst({
      where: {
        id: parseInt(id),
        customerId,
      },
      include: {
        station: {
          select: {
            name: true,
            location: true,
          },
        },
        oldBattery: {
          select: {
            uid: true,
          },
        },
        newBattery: {
          select: {
            uid: true,
          },
        },
      },
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy giao dịch.",
      });
    }

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error("Get transaction status error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy trạng thái giao dịch.",
      error: error.message,
    });
  }
};
