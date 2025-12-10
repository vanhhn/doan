const prisma = require("../config/database");
const path = require("path");

// Upload avatar
exports.uploadAvatar = async (req, res) => {
  try {
    const customerId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Không có file được upload.",
      });
    }

    const avatarUrl = `/uploads/${req.file.filename}`;

    const customer = await prisma.customer.update({
      where: { id: customerId },
      data: { avatarUrl },
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
      },
    });

    res.json({
      success: true,
      message: "Upload ảnh đại diện thành công!",
      data: customer,
    });
  } catch (error) {
    console.error("Upload avatar error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi upload ảnh.",
      error: error.message,
    });
  }
};

// Nạp tiền vào ví
exports.topUpBalance = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Số tiền nạp không hợp lệ.",
      });
    }

    const customer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        balance: {
          increment: amount,
        },
      },
      select: {
        id: true,
        fullName: true,
        balance: true,
      },
    });

    res.json({
      success: true,
      message: `Nạp ${amount.toLocaleString()}đ thành công!`,
      data: customer,
    });
  } catch (error) {
    console.error("Top up error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi nạp tiền.",
      error: error.message,
    });
  }
};

// Lấy thông tin profile
exports.getProfile = async (req, res) => {
  try {
    const customerId = req.user.id;

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        username: true,
        fullName: true,
        phone: true,
        email: true,
        currentBatteryUid: true,
        totalSwaps: true,
        balance: true,
        avatarUrl: true,
        createdAt: true,
        currentBattery: {
          select: {
            uid: true,
            status: true,
            chargeLevel: true,
            chargeCycles: true,
          },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin khách hàng.",
      });
    }

    res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thông tin profile.",
      error: error.message,
    });
  }
};

// Lấy lịch sử giao dịch
exports.getHistory = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { limit = 20, offset = 0 } = req.query;

    const transactions = await prisma.transactionLog.findMany({
      where: { customerId },
      include: {
        station: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
        oldBattery: {
          select: {
            uid: true,
            chargeLevel: true,
          },
        },
        newBattery: {
          select: {
            uid: true,
            chargeLevel: true,
          },
        },
      },
      orderBy: {
        transactionTime: "desc",
      },
      take: parseInt(limit),
      skip: parseInt(offset),
    });

    const total = await prisma.transactionLog.count({
      where: { customerId },
    });

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
        },
      },
    });
  } catch (error) {
    console.error("Get history error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy lịch sử giao dịch.",
      error: error.message,
    });
  }
};

// Cập nhật thông tin profile
exports.updateProfile = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { fullName, phone, email } = req.body;

    // Validate input
    if (!fullName && !phone && !email) {
      return res.status(400).json({
        success: false,
        message: "Cần ít nhất một trường để cập nhật.",
      });
    }

    // Kiểm tra email đã tồn tại (nếu có)
    if (email) {
      const existingEmail = await prisma.customer.findFirst({
        where: {
          email,
          id: { not: customerId },
        },
      });

      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: "Email đã được sử dụng bởi tài khoản khác.",
        });
      }
    }

    // Kiểm tra phone đã tồn tại (nếu có)
    if (phone) {
      const existingPhone = await prisma.customer.findFirst({
        where: {
          phone,
          id: { not: customerId },
        },
      });

      if (existingPhone) {
        return res.status(409).json({
          success: false,
          message: "Số điện thoại đã được sử dụng bởi tài khoản khác.",
        });
      }
    }

    // Cập nhật thông tin
    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        ...(fullName && { fullName }),
        ...(phone && { phone }),
        ...(email && { email }),
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        phone: true,
        email: true,
        currentBatteryUid: true,
        totalSwaps: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      message: "Cập nhật thông tin thành công.",
      data: updatedCustomer,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật thông tin.",
      error: error.message,
    });
  }
};
