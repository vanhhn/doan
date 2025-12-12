const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/database");

// Đăng ký tài khoản
exports.register = async (req, res) => {
  try {
    const { username, password, fullName, phone, email } = req.body;

    // Validate input
    if (!username || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: "Username, password và tên đầy đủ là bắt buộc.",
      });
    }

    // Kiểm tra username đã tồn tại
    const existingUser = await prisma.customer.findUnique({
      where: { username },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Username đã tồn tại.",
      });
    }

    // Kiểm tra email đã tồn tại
    if (email) {
      const existingEmail = await prisma.customer.findUnique({
        where: { email },
      });

      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: "Email đã được sử dụng.",
        });
      }
    }

    // Kiểm tra phone đã tồn tại
    if (phone) {
      const existingPhone = await prisma.customer.findUnique({
        where: { phone },
      });

      if (existingPhone) {
        return res.status(409).json({
          success: false,
          message: "Số điện thoại đã được sử dụng.",
        });
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Tạo user mới
    const newCustomer = await prisma.customer.create({
      data: {
        username,
        passwordHash,
        fullName,
        phone: phone || null,
        email: email || null,
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        phone: true,
        email: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "Đăng ký thành công.",
      data: newCustomer,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi đăng ký.",
      error: error.message,
    });
  }
};

// Đăng nhập
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log(`🔐 Login attempt - Username: ${username}`);

    // Validate input
    if (!username || !password) {
      console.log("❌ Missing username or password");
      return res.status(400).json({
        success: false,
        message: "Username và password là bắt buộc.",
      });
    }

    // Tìm user theo username hoặc phone
    const customer = await prisma.customer.findFirst({
      where: {
        OR: [
          { username: username },
          { phone: username }, // Cho phép đăng nhập bằng số điện thoại
        ],
      },
    });

    if (!customer) {
      console.log(`❌ User not found: ${username}`);
      return res.status(401).json({
        success: false,
        message: "Username hoặc password không đúng.",
      });
    }

    console.log(`✅ User found: ${customer.fullName} (ID: ${customer.id})`);

    // Kiểm tra password
    const isPasswordValid = await bcrypt.compare(
      password,
      customer.passwordHash
    );

    if (!isPasswordValid) {
      console.log(`❌ Invalid password for user: ${username}`);
      return res.status(401).json({
        success: false,
        message: "Username hoặc password không đúng.",
      });
    }

    console.log(`✅ Password valid, generating token...`);

    // Tạo JWT token
    const token = jwt.sign(
      {
        id: customer.id,
        username: customer.username,
        type: "customer",
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    res.json({
      success: true,
      message: "Đăng nhập thành công.",
      data: {
        token,
        customer: {
          id: customer.id,
          username: customer.username,
          fullName: customer.fullName,
          phone: customer.phone,
          email: customer.email,
          currentBatteryUid: customer.currentBatteryUid,
          totalSwaps: customer.totalSwaps,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi đăng nhập.",
      error: error.message,
    });
  }
};

// Reset mật khẩu (Forgot Password)
exports.resetPassword = async (req, res) => {
  try {
    const { phone, newPassword } = req.body;

    // Validate input
    if (!phone || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Số điện thoại và mật khẩu mới là bắt buộc.",
      });
    }

    // Kiểm tra độ dài mật khẩu
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu phải có ít nhất 6 ký tự.",
      });
    }

    // Tìm user theo số điện thoại
    const customer = await prisma.customer.findUnique({
      where: { phone },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tài khoản với số điện thoại này.",
      });
    }

    // Hash mật khẩu mới
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Cập nhật mật khẩu
    await prisma.customer.update({
      where: { phone },
      data: { passwordHash },
    });

    res.json({
      success: true,
      message: "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập ngay.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi đặt lại mật khẩu.",
      error: error.message,
    });
  }
};
