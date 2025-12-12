const prisma = require("../config/database");
const path = require("path");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dex4yvfnl",
  api_key: process.env.CLOUDINARY_API_KEY || "738582261875474",
  api_secret:
    process.env.CLOUDINARY_API_SECRET || "okG4a8umlR7XB18Gcgald0taOXw",
});

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

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "ev-swap/avatars",
      public_id: `user-${customerId}-${Date.now()}`,
      overwrite: true,
      resource_type: "image",
    });

    // Delete local file after upload
    fs.unlinkSync(req.file.path);

    const avatarUrl = result.secure_url;

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
    // Clean up file if exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
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

    // Lấy lịch sử đổi pin
    const swapTransactions = await prisma.transactionLog.findMany({
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
          },
        },
        newBattery: {
          select: {
            uid: true,
          },
        },
      },
      orderBy: {
        transactionTime: "desc",
      },
    });

    // Lấy lịch sử nạp tiền
    const payments = await prisma.payment.findMany({
      where: {
        customerId,
        status: "completed", // Chỉ lấy giao dịch thành công
      },
      orderBy: {
        completedAt: "desc",
      },
    });

    // Gộp và sắp xếp theo thời gian
    const allActivities = [
      ...swapTransactions.map((tx) => ({
        type: "swap",
        date: tx.transactionTime,
        amount: -tx.cost, // Âm vì là chi tiêu
        description: `Đổi pin tại ${tx.station.name}`,
        stationName: tx.station.name,
        cost: tx.cost,
      })),
      ...payments.map((pm) => ({
        type: "topup",
        date: pm.completedAt,
        amount: pm.amount, // Dương vì là nạp tiền
        description: `Nạp tiền qua ${pm.paymentMethod.toUpperCase()}`,
        paymentMethod: pm.paymentMethod,
      })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    // Phân trang
    const paginatedActivities = allActivities.slice(
      parseInt(offset),
      parseInt(offset) + parseInt(limit)
    );

    res.json({
      success: true,
      data: {
        transactions: paginatedActivities,
        pagination: {
          total: allActivities.length,
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
